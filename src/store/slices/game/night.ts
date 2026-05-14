import { StoreSlice, GameSlice } from '../../types';
import { supabase } from '../connection';
import { addSystemMessage } from '../../utils';
import { logNightAction, getTeamFromRoleType } from '@/lib/supabaseService';
import { getRoleDefinition } from '@/lib/scriptRoleUtils';
import { generateShortId } from '@/lib/random';

export const createGameNightSlice: StoreSlice<Pick<GameSlice, 'performNightAction' | 'submitNightAction' | 'resolveNightAction' | 'getPendingNightActions'>> = (set, get) => ({
    performNightAction: (action) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (!state.gameState) return;
            const actor = state.gameState.seats.find(seat =>
                !seat.isDead && (seat.realRoleId === action.roleId || seat.seenRoleId === action.roleId)
            );
            if (actor) {
                actor.hasUsedAbility = true;
            }
            state.gameState.nightActionRequests.push({
                id: generateShortId(),
                seatId: actor?.id ?? -1,
                roleId: action.roleId,
                payload: action.payload,
                status: 'resolved',
                result: 'ST 已执行',
                timestamp: Date.now(),
            });
            const role = getRoleDefinition(action.roleId, state.gameState.customRoles);
            addSystemMessage(state.gameState, `ST 已执行夜间行动: ${role?.name ?? action.roleId}`);
        });
        get().sync();
    },

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    submitNightAction: async (action) => {
        const { user, gameState } = get();
        if (!user?.roomId || !gameState) return;

        const seat = gameState.seats.find(s => s.userId === user.id);
        if (!seat) return;
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- fallback for legacy seat snapshots
        const seatRoleId = seat.seenRoleId ?? seat.realRoleId ?? seat.roleId;
        const currentNightRole = gameState.nightQueue[gameState.nightCurrentIndex];
        if (gameState.phase !== 'NIGHT' || seatRoleId !== action.roleId || currentNightRole !== action.roleId) {
            addSystemMessage(gameState, '当前不能提交该夜间行动', user.id);
            get().sync();
            return;
        }

        try {
            const payload = action.payload;
            const { error } = await supabase.rpc('submit_night_action', {
                p_room_code: user.roomId,
                p_seat_id: seat.id,
                p_role_id: action.roleId,
                p_payload: payload as Record<string, unknown> | undefined
            });

            if (error) throw error;

            // v2.0: Log night action to database (storyteller only)
            const roomDbId = get().roomDbId;
            if (user.isStoryteller && roomDbId) {
                const roleData = getRoleDefinition(action.roleId, gameState.customRoles);
                const targetSeatId = payload?.seatId;
                const targetSeat = targetSeatId !== undefined
                    ? gameState.seats.find(s => s.id === targetSeatId)
                    : undefined;

                await logNightAction(
                    roomDbId,
                    gameState.roundInfo.nightCount,
                    seat.id,
                    action.roleId,
                    getTeamFromRoleType(roleData?.team),
                    targetSeatId,
                    targetSeat?.seenRoleId ?? undefined,
                    'SUCCESS',
                    payload as Record<string, unknown> | undefined
                );
            }

            set((state) => {
                if (!state.gameState) return;
                const existingRequest = state.gameState.nightActionRequests.find(req =>
                    req.seatId === seat.id &&
                    req.roleId === action.roleId &&
                    req.status === 'pending'
                );
                if (!existingRequest) {
                    state.gameState.nightActionRequests.push({
                        id: generateShortId(),
                        seatId: seat.id,
                        roleId: action.roleId,
                        payload,
                        status: 'pending',
                        timestamp: Date.now(),
                    });
                }
                addSystemMessage(state.gameState, `已提交夜间行动`);
            });
            get().sync();

        } catch (e: unknown) {
            console.error('Submit night action error:', e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            addSystemMessage(gameState, `提交失败: ${errorMessage}`);
            get().sync();
        }
    },

    resolveNightAction: (requestId, result) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const req = state.gameState.nightActionRequests.find(r => r.id === requestId);
                if (req) {
                    req.status = 'resolved';
                    req.result = result;
                }
            }
        });
        get().sync();
    },

    getPendingNightActions: () => {
        const state = get().gameState;
        return state ? state.nightActionRequests.filter(r => r.status === 'pending') : [];
    }
});
