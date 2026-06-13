import { StoreSlice, GameSlice } from '../../types';

export const createGameSeatSwapSlice: StoreSlice<Pick<GameSlice, 'swapSeats' | 'requestSeatSwap' | 'respondToSwapRequest' | 'forceLeaveSeat'>> = (set, get) => ({
    swapSeats: (seatId1, seatId2) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const s1 = state.gameState.seats.find(s => s.id === seatId1);
                const s2 = state.gameState.seats.find(s => s.id === seatId2);
                if (s1 && s2) {
                    const tempUser = { userId: s1.userId, userName: s1.userName, isVirtual: s1.isVirtual };
                    s1.userId = s2.userId;
                    s1.userName = s2.userName;
                    s1.isVirtual = s2.isVirtual;
                    
                    s2.userId = tempUser.userId;
                    s2.userName = tempUser.userName;
                    s2.isVirtual = tempUser.isVirtual;
                }
            }
        });
        get().sync();
    },

    // Player-initiated swap request. NOTE: this is a PLAYER action (the only
    // caller is the non-storyteller branch of Grimoire.handleSeatClick), so it
    // must NOT be gated behind isStoryteller — the requester only needs to be
    // seated. Storytellers reorganize seats directly via swapSeats instead.
    requestSeatSwap: (toSeatId) => {
        const { user } = get();
        if (!user) return;
        set((state) => {
            if (state.gameState) {
                const fromSeat = state.gameState.seats.find(s => s.userId === user.id);
                const toSeat = state.gameState.seats.find(s => s.id === toSeatId);
                // Requester must be seated; target must be occupied by someone else.
                if (fromSeat && toSeat?.userId && toSeat.userId !== user.id) {
                    // De-duplicate: ignore repeated/double-tapped requests against
                    // the same target so the target isn't spammed with copies.
                    const alreadyPending = state.gameState.swapRequests.some(
                        r => r.fromUserId === user.id && r.toUserId === toSeat.userId
                    );
                    if (!alreadyPending) {
                        state.gameState.swapRequests.push({
                            id: `${Date.now().toString()}-${String(fromSeat.id)}-${String(toSeat.id)}`,
                            fromSeatId: fromSeat.id,
                            fromUserId: user.id,
                            fromName: user.name,
                            toSeatId: toSeat.id,
                            toUserId: toSeat.userId,
                            timestamp: Date.now()
                        });
                    }
                }
            }
        });
        get().sync();
    },

    // Respond to a swap request. The responder is the request's TARGET player
    // (shown SwapRequestModal) or the storyteller — not an arbitrary user.
    respondToSwapRequest: (requestId, accept) => {
        const { user } = get();
        if (!user) return;
        set((state) => {
            if (state.gameState) {
                const reqIndex = state.gameState.swapRequests.findIndex(r => r.id === requestId);
                if (reqIndex !== -1) {
                    const req = state.gameState.swapRequests[reqIndex];
                    if (!req) return;
                    // Authorization: only the targeted player or the ST may resolve it.
                    const authorized = user.isStoryteller || req.toUserId === user.id;
                    if (!authorized) return;
                    if (accept) {
                        const s1 = state.gameState.seats.find(s => s.id === req.fromSeatId);
                        const s2 = state.gameState.seats.find(s => s.id === req.toSeatId);
                        // Only swap if both seats still hold the original occupants —
                        // otherwise the request is stale (someone moved/left) and
                        // applying it would shuffle the wrong players.
                        if (s1 && s2 && s1.userId === req.fromUserId && s2.userId === req.toUserId) {
                            const tempUser = { userId: s1.userId, userName: s1.userName, isVirtual: s1.isVirtual };
                            s1.userId = s2.userId;
                            s1.userName = s2.userName;
                            s1.isVirtual = s2.isVirtual;
                            s2.userId = tempUser.userId;
                            s2.userName = tempUser.userName;
                            s2.isVirtual = tempUser.isVirtual;
                        }
                    }
                    state.gameState.swapRequests.splice(reqIndex, 1);
                }
            }
        });
        get().sync();
    },

    forceLeaveSeat: (seatId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.userId = null;
                    seat.userName = `座位 ${seat.id + 1}`;
                    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
                    seat.roleId = null;
                    seat.realRoleId = null;
                    seat.seenRoleId = null;
                }
            }
        });
        get().sync();
    }
});
