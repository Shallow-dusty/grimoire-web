import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { RoleDef, Seat, GamePhase } from '../../types';
import { TEAM_COLORS } from '../../constants';
import { getRoleDefinition } from '../../lib/scriptRoleUtils';
import { VoteButton } from '../game/VoteButton';
import { DoomsdayClock } from '../game/DoomsdayClock';
import { Zap } from 'lucide-react';
import { ActiveAbilityButton } from '../game/ActiveAbilityButton';

// Compact Role Display Component
interface CompactRoleDisplayProps {
    role: RoleDef;
    seat: Seat;
    gamePhase: GamePhase;
}

const CompactRoleDisplay: React.FC<CompactRoleDisplayProps> = ({ role, seat, gamePhase }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-stone-900/80 rounded-lg border border-stone-700 overflow-hidden shadow-sm">
            {/* Header - Always Visible */}
            <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-stone-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center bg-stone-950 shadow-inner" style={{ borderColor: TEAM_COLORS[role.team] }}>
                        <span className="text-2xl">{role.icon ?? (role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : '⚜️')}</span>
                    </div>
                    <div>
                        <div className="font-bold font-cinzel text-stone-200 flex items-center gap-2">
                            <span style={{ color: TEAM_COLORS[role.team] }}>{role.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-500 border border-stone-700 uppercase tracking-wider">
                                {role.team === 'TOWNSFOLK' ? t('script.composition.townsfolk') : role.team === 'MINION' ? t('script.composition.minion') : role.team === 'DEMON' ? t('script.composition.demon') : t('script.composition.outsider')}
                            </span>
                        </div>
                        <div className="text-xs text-stone-500 font-serif italic truncate max-w-[200px]">
                            {isExpanded ? t('grimoire.clickToView') : role.ability}
                        </div>
                    </div>
                </div>
                <div className="text-stone-600">
                    {isExpanded ? '▼' : '▲'}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="text-sm text-stone-400 leading-relaxed border-t border-stone-800/50 pt-2 mt-1">
                        {role.ability}
                    </div>
                    
                    {/* Active Ability Button */}
                    <ActiveAbilityButton
                        role={role}
                        seat={seat}
                        gamePhase={gamePhase}
                    />
                </div>
            )}
        </div>
    );
};

interface ControlsPlayerSectionProps {
    onShowHistory: () => void;
    onShowNightAction: () => void;
}

// 优化选择器 - 细粒度订阅
const usePlayerSectionState = () => useStore(
    useShallow(state => ({
        seats: state.gameState?.seats ?? [],
        phase: state.gameState?.phase ?? 'SETUP',
        voting: state.gameState?.voting,
        nightQueue: state.gameState?.nightQueue ?? [],
        nightCurrentIndex: state.gameState?.nightCurrentIndex ?? 0,
        customRoles: state.gameState?.customRoles,
        hasGameState: !!state.gameState,
    }))
);

export const ControlsPlayerSection: React.FC<ControlsPlayerSectionProps> = ({
    onShowHistory,
    onShowNightAction
}) => {
    const { t } = useTranslation();
    const user = useStore(state => state.user);
    const { seats, phase, voting, nightQueue, nightCurrentIndex, customRoles, hasGameState } = usePlayerSectionState();
    const toggleHand = useStore(state => state.toggleHand);
    const leaveSeat = useStore(state => state.leaveSeat);

    if (!user || !hasGameState) return null;

    const currentSeat = seats.find(s => s.userId === user.id);
    const role = currentSeat?.seenRoleId ? getRoleDefinition(currentSeat.seenRoleId, customRoles) : null;

    return (
        <div className="space-y-3">
            {/* Compact Role Display */}
            {role && currentSeat && (
                <div className="space-y-2">
                    <CompactRoleDisplay
                        role={role}
                        seat={currentSeat}
                        gamePhase={phase}
                    />
                    <button
                        onClick={() => useStore.getState().openRoleReveal()}
                        className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs rounded border border-stone-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <span>👁️</span> {t('grimoire.clickToView')}
                    </button>
                </div>
            )}

            {/* Night Phase UI */}
            {phase === 'NIGHT' && (
                <div className="p-4 bg-indigo-950/30 rounded border border-indigo-900/50 text-center shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-xl">🌙</span>
                        <h3 className="text-indigo-200 font-bold font-cinzel tracking-widest">{t('effects.midnightChime.nightFalls')}</h3>
                    </div>

                    {/* 当前是你的回合 - 始终显示按钮 */}
                    {currentSeat?.seenRoleId === nightQueue[nightCurrentIndex] && (
                        <button
                            onClick={onShowNightAction}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg animate-pulse border border-indigo-400 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Zap className="w-5 h-5" />
                            {t('nightAction.panel.nightAction')}
                        </button>
                    )}

                </div>
            )}

            {/* Voting UI */}
            {voting?.isOpen && (
                <div className="p-3 bg-amber-950/20 rounded border border-amber-800/30 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-900/20 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold">⚖ {t('voting.title')}</span>
                            <span className="text-stone-500 text-xs">{t('game.doomsdayClock.nominee')}:</span>
                            <span className="text-amber-100 font-bold">{seats.find(s => s.id === voting?.nomineeSeatId)?.userName}</span>
                        </div>
                    </div>

                    {currentSeat ? (
                        <>
                            <VoteButton
                                isRaised={currentSeat.isHandRaised}
                                isLocked={currentSeat.voteLocked ?? false}
                                isDead={currentSeat.isDead}
                                hasGhostVote={currentSeat.hasGhostVote}
                                onToggle={toggleHand}
                            />
                            <div className="text-center text-xs text-stone-500 font-serif">
                                {currentSeat.voteLocked
                                    ? t('game.floatingVote.locked')
                                    : voting.clockHandSeatId === currentSeat.id
                                        ? '⏳ ' + t('common.loading')
                                        : t('voting.raiseHand') + '/' + t('voting.lowerHand')}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-stone-600 italic text-xs">
                            {t('seat.joinSeat')}
                        </div>
                    )}
                </div>
            )}

            {/* Voting Stats Chart */}
            <DoomsdayClock />

            {/* Settings / Tools */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onShowHistory}
                    className="bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 py-2 px-3 rounded text-xs border border-stone-800 transition-colors flex items-center justify-center gap-2"
                >
                    <span>📜</span> {t('history.title')}
                </button>

                {currentSeat && (
                    <button
                        onClick={() => void leaveSeat()}
                        className="bg-stone-900 hover:bg-red-950/30 text-stone-400 hover:text-red-400 py-2 px-3 rounded text-xs border border-stone-800 hover:border-red-900/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🚪</span> {t('seat.leaveSeat')}
                    </button>
                )}
            </div>
        </div>
    );
};
