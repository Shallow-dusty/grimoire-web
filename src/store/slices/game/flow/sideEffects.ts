/**
 * Phase transition side-effects — pure functions operating on Draft<AppState>.
 *
 * Extracted from phase.ts so they can be called by both the legacy
 * applyPhaseChange() path and the new XState subscription handler.
 */
import type { Draft } from 'immer';
import type { AppState } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { PHASE_LABELS } from '@/constants';
import { calculateNightQueue, getVoteThreshold } from './utils';
import { checkGameOver, countAlivePlayers } from '@/lib/gameLogic';
import { getRoleCatalog } from '@/lib/scriptRoleUtils';
import { logExecution, updateNominationResult } from '@/lib/supabaseService';
import type { GamePhase, GameState, Seat } from '@/types';
import i18n from '@/i18n';

/**
 * Apply Scarlet Woman inheritance when a Demon dies.
 * Mirrors the logic in store/slices/game/roles.ts toggleDead so all death
 * paths (manual toggle + daily execution) trigger SW transformation consistently.
 *
 * Rule interpretation: SW becomes the Demon if ≥ 5 players alive at the time of
 * the Demon's death (the dying Demon is included in the count, matching the
 * convention asserted by roles.test.ts).
 *
 * IMPORTANT: caller must invoke this BEFORE setting dyingSeat.isDead = true so
 * the alive count includes the Demon.
 */
function applyScarletWomanInheritance(
    gameState: GameState,
    dyingSeat: Seat,
): void {
    const roleCatalog = getRoleCatalog(gameState.customRoles);
    const dyingRole = dyingSeat.realRoleId ? roleCatalog[dyingSeat.realRoleId] : null;
    if (dyingRole?.team !== 'DEMON') return;

    const scarletWoman = gameState.seats.find(s =>
        s.realRoleId === 'scarlet_woman' &&
        !s.isDead &&
        !(s.statuses?.some(status => status === 'POISONED' || status === 'DRUNK'))
    );
    if (!scarletWoman) return;

    // Count includes the dying Demon (still alive at this point).
    const aliveAtDeath = countAlivePlayers(gameState.seats, gameState.customRoles);
    if (aliveAtDeath < 5) return;

    const demonRoleId = dyingSeat.realRoleId;
    if (!demonRoleId) return;

    scarletWoman.realRoleId = demonRoleId;
    scarletWoman.seenRoleId = demonRoleId;
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
    scarletWoman.roleId = demonRoleId;
    scarletWoman.hasUsedAbility = false;
    addSystemMessage(
        gameState,
        i18n.t('game.systemMessage.scarletWomanInherit', {
            name: scarletWoman.userName,
            defaultValue: `${scarletWoman.userName} 继承了 恶魔 身份`,
        }),
        scarletWoman.userId,
    );
}

// ---------------------------------------------------------------------------
// Entry side-effects (called when entering a phase)
// ---------------------------------------------------------------------------

/** Side-effects when entering NIGHT phase.
 *  When called from the XState subscriber, counters and nightQueue are already
 *  set by the machine — pass `fromXState: true` to skip re-incrementing them. */
export function onEnterNight(state: Draft<AppState>, opts?: { fromXState?: boolean }): void {
  if (!state.gameState) return;
  const gs = state.gameState;

  if (!opts?.fromXState) {
    const nextNightCount = gs.roundInfo.nightCount + 1;
    gs.roundInfo.nightCount = nextNightCount;
    gs.roundInfo.totalRounds++;

    const isFirstNight = nextNightCount === 1;
    gs.nightQueue = calculateNightQueue(gs.seats, isFirstNight, gs.currentScriptId, {
      customScripts: gs.customScripts,
      customRoles: gs.customRoles,
    });
    gs.nightCurrentIndex = -1;
  }

  gs.dailyExecutionCompleted = false;
}

/** Side-effects when entering DAY phase.
 *  When called from the XState subscriber, counters are already set by the
 *  machine — pass `fromXState: true` to skip re-incrementing dayCount. */
export function onEnterDay(state: Draft<AppState>, opts?: { fromXState?: boolean }): void {
  if (!state.gameState) return;
  const gs = state.gameState;

  if (!opts?.fromXState) {
    gs.roundInfo.dayCount++;
  }

  gs.roundInfo.nominationCount = 0;
  gs.candlelightEnabled = false;
  gs.dailyNominations = [];
}

/** Side-effects when leaving VOTING phase. */
export function onExitVoting(state: Draft<AppState>): void {
  if (!state.gameState) return;
  state.gameState.voting = null;
}

// ---------------------------------------------------------------------------
// Daily execution resolution (called on DAY→NIGHT transition)
// ---------------------------------------------------------------------------

export function resolveDailyExecution(state: Draft<AppState>): void {
  if (!state.gameState) return;
  const gameState = state.gameState;
  const day = gameState.roundInfo.dayCount;
  const dayVotes = gameState.voteHistory.filter(vote => vote.round === day && vote.result !== 'cancelled');

  const applyNoExecutionResult = () => {
    const gameOver = checkGameOver(gameState.seats, {
      executionOccurred: false,
      customRoles: gameState.customRoles,
    });
    if (gameOver) {
      gameState.gameOver = gameOver;
      addSystemMessage(gameState, i18n.t('game.systemMessage.gameOverMessage', { winner: i18n.t(gameOver.winner === 'GOOD' ? 'game.systemMessage.winnerGood' : 'game.systemMessage.winnerEvil'), reason: gameOver.reason }));
    }
  };

  const getSeatRoleId = (seat: { realRoleId?: string | null; seenRoleId?: string | null; roleId?: string | null }): string | null => {
    return seat.realRoleId ?? seat.seenRoleId ?? seat.roleId ?? null;
  };
  const hasVoudon = gameState.seats.some(seat => {
    const roleId = getSeatRoleId(seat);
    return !seat.isDead && roleId === 'voudon';
  });

  if (dayVotes.length === 0) {
    applyNoExecutionResult();
    return;
  }

  const aliveCount = gameState.seats.filter(seat => !seat.isDead).length;
  const requiredVotes = hasVoudon ? 0 : getVoteThreshold(aliveCount);
  const eligibleVotes = hasVoudon ? dayVotes : dayVotes.filter(vote => vote.voteCount >= requiredVotes);
  if (eligibleVotes.length === 0) {
    applyNoExecutionResult();
    return;
  }

  const maxVotes = Math.max(...eligibleVotes.map(vote => vote.voteCount));
  const topVotes = eligibleVotes.filter(vote => vote.voteCount === maxVotes);

  if (topVotes.length !== 1) {
    topVotes.forEach(vote => { vote.result = 'tied'; });
    addSystemMessage(gameState, i18n.t('game.systemMessage.voteTied'));
    applyNoExecutionResult();
    return;
  }

  const winningVote = topVotes[0];
  if (!winningVote) return;
  const nomineeSeat = gameState.seats.find(seat => seat.id === winningVote.nomineeSeatId);
  if (!nomineeSeat || nomineeSeat.isDead) {
    winningVote.result = 'cancelled';
    addSystemMessage(gameState, i18n.t('game.systemMessage.voteCancelledDead'));
    applyNoExecutionResult();
    return;
  }

  // Trigger Scarlet Woman inheritance BEFORE marking the Demon dead — the rule
  // counts the dying Demon as alive. This must also run before checkGameOver so
  // SW takes the Demon role and prevents the (otherwise immediate) good-team win.
  applyScarletWomanInheritance(gameState, nomineeSeat);

  nomineeSeat.isDead = true;
  gameState.dailyExecutionCompleted = true;
  winningVote.result = 'executed';
  addSystemMessage(gameState, i18n.t('game.systemMessage.executed', { name: nomineeSeat.userName, count: winningVote.voteCount }));

  const gameOver = checkGameOver(gameState.seats, {
    executedSeatId: nomineeSeat.id,
    executionOccurred: true,
    customRoles: gameState.customRoles,
  });
  if (gameOver) {
    gameState.gameOver = gameOver;
    addSystemMessage(gameState, i18n.t('game.systemMessage.gameOverMessage', { winner: i18n.t(gameOver.winner === 'GOOD' ? 'game.systemMessage.winnerGood' : 'game.systemMessage.winnerEvil'), reason: gameOver.reason }));
  }

  const roomDbId = state.roomDbId;
  if (roomDbId) {
    logExecution(
      roomDbId,
      gameState.roundInfo.dayCount,
      nomineeSeat.id,
      nomineeSeat.seenRoleId ?? 'unknown',
      winningVote.voteCount
    ).catch(console.error);
    updateNominationResult(
      roomDbId,
      gameState.roundInfo.dayCount,
      nomineeSeat.id,
      winningVote.voteCount > 0,
      winningVote.voteCount,
      true
    ).catch(console.error);
  }
}

// ---------------------------------------------------------------------------
// Transition side-effect dispatcher
// ---------------------------------------------------------------------------

/** Add a phase-change system message. */
export function addPhaseChangeMessage(state: Draft<AppState>, phase: GamePhase): void {
  if (!state.gameState) return;
  addSystemMessage(state.gameState, i18n.t('game.systemMessage.phaseChanged', { phase: PHASE_LABELS[phase] }));
}
