import { describe, it, expect, beforeEach } from 'vitest';
import { useSandboxStore } from './sandboxStore';
import { act } from '@testing-library/react';

describe('sandboxStore', () => {
    beforeEach(() => {
        useSandboxStore.setState({ isActive: false, gameState: null });
    });

    it('should initialize correctly', () => {
        const { isActive, gameState } = useSandboxStore.getState();
        expect(isActive).toBe(false);
        expect(gameState).toBeNull();

        act(() => {
            useSandboxStore.getState().startSandbox(7, 'tb');
        });

        const state = useSandboxStore.getState();
        expect(state.isActive).toBe(true);
        expect(state.gameState).not.toBeNull();
        expect(state.gameState?.seats).toHaveLength(7);
        expect(state.gameState?.currentScriptId).toBe('tb');
    });

    it('should exit sandbox', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().exitSandbox();
        });

        const state = useSandboxStore.getState();
        expect(state.isActive).toBe(false);
        expect(state.gameState).toBeNull();
    });

    it('should set phase', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().setPhase('NIGHT');
        });

        const state = useSandboxStore.getState();
        expect(state.gameState?.phase).toBe('NIGHT');
        expect(state.gameState?.roundInfo.nightCount).toBe(1);
    });

    it('should assign role', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().assignRole(0, 'imp');
        });

        const state = useSandboxStore.getState();
        const seat = state.gameState?.seats.find(s => s.id === 0);
        expect(seat?.roleId).toBe('imp');
        expect(seat?.realRoleId).toBe('imp');
    });

    it('should toggle dead', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().toggleDead(0);
        });

        const state = useSandboxStore.getState();
        const seat = state.gameState?.seats.find(s => s.id === 0);
        expect(seat?.isDead).toBe(true);
        expect(seat?.hasGhostVote).toBe(true);
    });

    it('should manage reminders', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().addReminder(0, 'Test Reminder');
        });

        let state = useSandboxStore.getState();
        let seat = state.gameState?.seats.find(s => s.id === 0);
        expect(seat?.reminders).toHaveLength(1);
        expect(seat?.reminders?.[0]?.text).toBe('Test Reminder');

        const reminderId = seat?.reminders?.[0]?.id;

        act(() => {
            if (reminderId) {
                useSandboxStore.getState().removeReminder(reminderId);
            }
        });

        state = useSandboxStore.getState();
        seat = state.gameState?.seats.find(s => s.id === 0);
        expect(seat?.reminders).toHaveLength(0);
    });

    it('should handle night actions', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().setPhase('NIGHT');
        });

        let state = useSandboxStore.getState();
        expect(state.gameState?.nightCurrentIndex).toBe(0);

        act(() => {
            useSandboxStore.getState().nightNext();
        });

        state = useSandboxStore.getState();
        // Depending on the queue, index might increment or phase might change
        // Since we didn't assign roles, queue might be empty or small
        // Let's just check that it didn't crash
        expect(state.gameState).not.toBeNull();
    });

    it('should handle voting', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().setPhase('DAY');
            useSandboxStore.getState().startVote(1);
        });

        let state = useSandboxStore.getState();
        expect(state.gameState?.voting).not.toBeNull();
        expect(state.gameState?.voting?.nomineeSeatId).toBe(1);

        act(() => {
            useSandboxStore.getState().closeVote();
        });

        state = useSandboxStore.getState();
        expect(state.gameState?.voting).toBeNull();
    });

    it('should add and remove seats', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().addSeat();
        });

        let state = useSandboxStore.getState();
        expect(state.gameState?.seats).toHaveLength(6);

        act(() => {
            useSandboxStore.getState().removeSeat();
        });

        state = useSandboxStore.getState();
        expect(state.gameState?.seats).toHaveLength(5);
    });

    it('should auto assign roles', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(7, 'tb'); // 7 players
            useSandboxStore.getState().assignRoles();
        });

        const state = useSandboxStore.getState();
        const seats = state.gameState?.seats;
        const assignedRoles = seats?.filter(s => s.roleId !== null);
        expect(assignedRoles).toHaveLength(7);
        
        // Check composition for 7 players: 5 Townsfolk, 0 Outsider, 1 Minion, 1 Demon
        // (This depends on gameLogic implementation, assuming standard rules)
    });

    it('should switch to and auto assign custom scripts', () => {
        const customRoles = {
            dusk_seer: { id: 'dusk_seer', name: 'Dusk Seer', team: 'TOWNSFOLK' as const, ability: 'Test' },
            bone_oracle: { id: 'bone_oracle', name: 'Bone Oracle', team: 'TOWNSFOLK' as const, ability: 'Test' },
            ember_sage: { id: 'ember_sage', name: 'Ember Sage', team: 'TOWNSFOLK' as const, ability: 'Test' },
            grave_hermit: { id: 'grave_hermit', name: 'Grave Hermit', team: 'OUTSIDER' as const, ability: 'Test' },
            shadow_agent: { id: 'shadow_agent', name: 'Shadow Agent', team: 'MINION' as const, ability: 'Test' },
            midnight_fiend: { id: 'midnight_fiend', name: 'Midnight Fiend', team: 'DEMON' as const, ability: 'Test' },
        };
        const customScripts = {
            homebrew: {
                id: 'homebrew',
                name: 'Homebrew',
                roles: Object.keys(customRoles),
                isCustom: true,
            },
        };

        act(() => {
            useSandboxStore.getState().startSandbox(6, 'tb', customScripts, customRoles);
            useSandboxStore.getState().setScript('homebrew');
            useSandboxStore.getState().assignRoles();
        });

        const state = useSandboxStore.getState();
        const assignedRoles = state.gameState?.seats.map(s => s.realRoleId).filter(Boolean);
        expect(state.gameState?.currentScriptId).toBe('homebrew');
        expect(assignedRoles).toHaveLength(6);
        expect(assignedRoles?.every(roleId => roleId !== null && roleId in customRoles)).toBe(true);
    });

    it('should reset game', () => {
        act(() => {
            useSandboxStore.getState().startSandbox(5);
            useSandboxStore.getState().setPhase('NIGHT');
            useSandboxStore.getState().resetGame();
        });

        const state = useSandboxStore.getState();
        expect(state.gameState?.phase).toBe('SETUP');
        expect(state.gameState?.seats).toHaveLength(5);
    });

    it('should preserve custom catalogs when resetting sandbox', () => {
        const customRoles = {
            midnight_fiend: { id: 'midnight_fiend', name: 'Midnight Fiend', team: 'DEMON' as const, ability: 'Test' },
        };
        const customScripts = {
            homebrew: {
                id: 'homebrew',
                name: 'Homebrew',
                roles: ['midnight_fiend'],
                isCustom: true,
            },
        };

        act(() => {
            useSandboxStore.getState().startSandbox(5, 'homebrew', customScripts, customRoles);
            useSandboxStore.getState().setPhase('NIGHT');
            useSandboxStore.getState().resetGame();
        });

        const state = useSandboxStore.getState();
        expect(state.gameState?.currentScriptId).toBe('homebrew');
        expect(state.gameState?.customScripts.homebrew?.name).toBe('Homebrew');
        expect(state.gameState?.customRoles.midnight_fiend?.team).toBe('DEMON');
    });
});
