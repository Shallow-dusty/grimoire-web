import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, GamePhase } from './types';
import type { RoleDef, ScriptDefinition } from './types';
import { SCRIPTS } from './constants';
import {
    addSystemMessage,
    applyRoleToSeat,
    toggleSeatDead,
    handlePhaseChange,
    createVotingState,
    createReminder,
    generateRoleAssignment,
    getStandardComposition
} from './lib/gameLogic';
import { shuffle } from './lib/random';
import { getRoleCatalog, getScriptDefinition } from './lib/scriptRoleUtils';

/**
 * 沙盒模式 Store
 * 用于离线单人练习，不连接 Supabase
 * 说书人可以模拟操作魔典、分配角色、结算夜间行动
 */

const generateSandboxRoleAssignment = (
    script: ScriptDefinition,
    roleCatalog: Record<string, RoleDef>,
    seatCount: number
): string[] => {
    const composition = getStandardComposition(seatCount);
    const townsfolkRoles = script.roles.filter(id => roleCatalog[id]?.team === 'TOWNSFOLK');
    const outsiderRoles = script.roles.filter(id => roleCatalog[id]?.team === 'OUTSIDER');
    const minionRoles = script.roles.filter(id => roleCatalog[id]?.team === 'MINION');
    const demonRoles = script.roles.filter(id => roleCatalog[id]?.team === 'DEMON');
    const selectedMinions = shuffle(minionRoles).slice(0, composition.minion);
    const hasBaron = selectedMinions.includes('baron');
    const outsiderCount = hasBaron ? Math.min(composition.outsider + 2, outsiderRoles.length) : composition.outsider;
    const townsfolkCount = hasBaron ? Math.max(composition.townsfolk - 2, 0) : composition.townsfolk;

    return shuffle([
        ...shuffle(townsfolkRoles).slice(0, townsfolkCount),
        ...shuffle(outsiderRoles).slice(0, outsiderCount),
        ...selectedMinions,
        ...shuffle(demonRoles).slice(0, composition.demon)
    ]);
};

const getInitialSandboxState = (
    seatCount: number,
    scriptId = 'tb',
    customScripts: Record<string, ScriptDefinition> = {},
    customRoles: Record<string, RoleDef> = {}
): GameState => ({
    roomId: 'SANDBOX',
    currentScriptId: scriptId,
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: Array.from({ length: seatCount }, (_, i) => ({
        id: i,
        userId: `sandbox_player_${i}`,
        userName: `玩家 ${String(i + 1)}`,
        isDead: false,
        hasGhostVote: true,
        roleId: null,
        realRoleId: null,
        seenRoleId: null,
        reminders: [],
        isHandRaised: false,
        isNominated: false,
        hasUsedAbility: false,
        statuses: [],
        voteLocked: false,
        isVirtual: true, // 所有玩家都是虚拟的
    })),
    messages: [{
        id: 'sandbox_welcome',
        senderId: 'system',
        senderName: '系统',
        recipientId: null,
        content: '🎮 欢迎进入沙盒模式！你可以自由练习说书人操作，无需联网。',
        timestamp: Date.now(),
        type: 'system'
    }],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: {
        trackId: null,
        isPlaying: false,
        volume: 0.5,
    },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customScripts,
    customRoles,
    voteHistory: [],
    roundInfo: {
        dayCount: 0,
        nightCount: 0,
        nominationCount: 0,
        totalRounds: 0
    },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    swapRequests: [],
    candlelightEnabled: false,
    dailyExecutionCompleted: false,
    dailyNominations: [],
    ruleAutomationLevel: 'GUIDED',
    interactionLog: []
});

interface SandboxState {
    isActive: boolean;
    gameState: GameState | null;

    // 初始化沙盒
    startSandbox: (
        seatCount: number,
        scriptId?: string,
        customScripts?: Record<string, ScriptDefinition>,
        customRoles?: Record<string, RoleDef>
    ) => void;
    exitSandbox: () => void;

    // 游戏操作
    setPhase: (phase: GamePhase) => void;
    setScript: (scriptId: string) => void;
    assignRole: (seatId: number, roleId: string | null) => void;
    toggleDead: (seatId: number) => void;
    toggleAbilityUsed: (seatId: number) => void;
    addReminder: (seatId: number, text: string, icon?: string, color?: string) => void;
    removeReminder: (id: string) => void;

    // 夜间行动
    nightNext: () => void;
    nightPrev: () => void;

    // 投票
    startVote: (nomineeId: number) => void;
    closeVote: () => void;

    // 座位管理
    addSeat: () => void;
    removeSeat: () => void;

    // 角色分配
    assignRoles: () => void;

    // 重置
    resetGame: () => void;
}

export const useSandboxStore = create<SandboxState>()(
    immer((set) => ({
        isActive: false,
        gameState: null,

        startSandbox: (seatCount, scriptId = 'tb', customScripts = {}, customRoles = {}) => {
            set({
                isActive: true,
                gameState: getInitialSandboxState(seatCount, scriptId, customScripts, customRoles)
            });
        },

        exitSandbox: () => {
            set({
                isActive: false,
                gameState: null
            });
        },

        setPhase: (phase) => {
            set((state) => {
                if (!state.gameState) return;
                const prevPhase = state.gameState.phase;
                state.gameState.phase = phase;
                handlePhaseChange(state.gameState, phase, prevPhase);
            });
        },

        setScript: (scriptId) => {
            set((state) => {
                if (!state.gameState) return;
                const script = getScriptDefinition(scriptId, state.gameState.customScripts);
                if (!script) return;
                state.gameState.currentScriptId = scriptId;
                addSystemMessage(state.gameState, `剧本已切换为: ${script.name}`);
            });
        },

        assignRole: (seatId, roleId) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    applyRoleToSeat(seat, roleId);
                }
            });
        },

        toggleDead: (seatId) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    const message = toggleSeatDead(seat);
                    addSystemMessage(state.gameState, message);
                }
            });
        },

        toggleAbilityUsed: (seatId) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.hasUsedAbility = !seat.hasUsedAbility;
                }
            });
        },

        addReminder: (seatId, text, icon, color) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.reminders.push(createReminder(seatId, text, 'ST', icon, color));
                }
            });
        },

        removeReminder: (id) => {
            set((state) => {
                if (!state.gameState) return;
                state.gameState.seats.forEach(seat => {
                    seat.reminders = seat.reminders.filter(r => r.id !== id);
                });
            });
        },

        nightNext: () => {
            set((state) => {
                if (!state.gameState) return;
                if (state.gameState.nightCurrentIndex < state.gameState.nightQueue.length - 1) {
                    state.gameState.nightCurrentIndex++;
                } else {
                    // 夜晚结束
                    const prevPhase = state.gameState.phase;
                    state.gameState.phase = 'DAY';
                    handlePhaseChange(state.gameState, 'DAY', prevPhase);
                }
            });
        },

        nightPrev: () => {
            set((state) => {
                if (!state.gameState) return;
                if (state.gameState.nightCurrentIndex > 0) {
                    state.gameState.nightCurrentIndex--;
                }
            });
        },

        startVote: (nomineeId) => {
            set((state) => {
                const gameState = state.gameState;
                if (!gameState) return;
                const automationLevel = gameState.ruleAutomationLevel ?? 'GUIDED';
                const shouldEnforce = automationLevel === 'FULL_AUTO';
                const shouldWarn = automationLevel === 'GUIDED';
                const handleViolation = (message: string): boolean => {
                    if (shouldWarn || shouldEnforce) {
                        addSystemMessage(gameState, message);
                    }
                    return shouldEnforce;
                };

                if (gameState.phase !== 'DAY') {
                    if (handleViolation('只能在白天进行提名。')) return;
                }
                if (gameState.voting) {
                    if (handleViolation('当前已有投票进行中。')) return;
                }
                const nominee = gameState.seats.find(s => s.id === nomineeId);
                if (!nominee) {
                    addSystemMessage(gameState, '无法提名：该座位不存在。');
                    return;
                }
                if (!nominee.userId) {
                    if (handleViolation('无法提名：座位未入座。')) return;
                }
                if (nominee.isDead) {
                    if (handleViolation('无法提名：该玩家已死亡。')) return;
                }
                if (gameState.dailyExecutionCompleted) {
                    if (handleViolation('今日已处决过玩家，无法再次进行投票处决。')) return;
                }
                const day = gameState.roundInfo.dayCount;
                if (gameState.dailyNominations.some(n => n.round === day && n.nomineeSeatId === nomineeId)) {
                    if (handleViolation('无法提名：该玩家今日已被提名。')) return;
                }
                gameState.voting = createVotingState(nomineeId);
                gameState.phase = 'VOTING';
                gameState.dailyNominations.push({
                    nominatorSeatId: -1,
                    nomineeSeatId: nomineeId,
                    round: gameState.roundInfo.dayCount,
                    timestamp: Date.now()
                });
                gameState.roundInfo.nominationCount += 1;
                addSystemMessage(gameState, `开始对 ${nominee.userName} 进行投票。`);
            });
        },

        closeVote: () => {
            set((state) => {
                if (!state.gameState) return;
                state.gameState.voting = null;
                addSystemMessage(state.gameState, '投票已结束。');
            });
        },

        addSeat: () => {
            set((state) => {
                if (!state.gameState || state.gameState.seats.length >= 20) return;
                const newId = state.gameState.seats.length;
                state.gameState.seats.push({
                    id: newId,
                    userId: `sandbox_player_${newId}`,
                    userName: `玩家 ${String(newId + 1)}`,
                    isDead: false,
                    hasGhostVote: true,
                    roleId: null,
                    realRoleId: null,
                    seenRoleId: null,
                    reminders: [],
                    isHandRaised: false,
                    isNominated: false,
                    hasUsedAbility: false,
                    statuses: [],
                    voteLocked: false,
                    isVirtual: true
                });
            });
        },

        removeSeat: () => {
            set((state) => {
                if (!state.gameState || state.gameState.seats.length <= 5) return;
                state.gameState.seats.pop();
            });
        },

        assignRoles: () => {
            set((state) => {
                if (!state.gameState) return;
                const seatCount = state.gameState.seats.length;
                const scriptId = state.gameState.currentScriptId;
                const script = getScriptDefinition(scriptId, state.gameState.customScripts);
                const roleCatalog = getRoleCatalog(state.gameState.customRoles);
                const roles = scriptId in SCRIPTS
                    ? generateRoleAssignment(scriptId, seatCount)
                    : script
                        ? generateSandboxRoleAssignment(script, roleCatalog, seatCount)
                        : [];
                if (roles.length === 0) return;
                state.gameState.seats.forEach((seat, idx) => {
                    if (idx < roles.length) {
                        applyRoleToSeat(seat, roles[idx] ?? null);
                    }
                });
                addSystemMessage(state.gameState, `已自动分配角色 (${String(seatCount)}人)`);
            });
        },

        resetGame: () => {
            set((state) => {
                if (!state.gameState) return;
                state.gameState = getInitialSandboxState(
                    state.gameState.seats.length,
                    state.gameState.currentScriptId,
                    state.gameState.customScripts,
                    state.gameState.customRoles
                );
            });
        }
    }))
);
