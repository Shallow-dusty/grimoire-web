import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { RoomSelection } from './RoomSelection';

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, props.children),
  },
}));

let mockStoreState: Record<string, unknown> = {};
let mockCreateGame = vi.fn();

vi.mock('../../store', () => ({
  useStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockStoreState),
}));

let mockSandboxState: Record<string, unknown> = {};

vi.mock('../../sandboxStore', () => ({
  useSandboxStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockSandboxState),
}));

describe('RoomSelection launch actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    mockCreateGame = vi.fn();
    mockStoreState = {
      user: { id: 'host-1', name: 'Host', isStoryteller: true },
      createGame: mockCreateGame,
      joinGame: vi.fn(),
      leaveGame: vi.fn(),
    };
    mockSandboxState = {
      startSandbox: vi.fn(),
    };
  });

  it('auto-creates a default room from the create-room shortcut for storytellers', async () => {
    window.history.replaceState({}, '', '/?action=create-room');

    render(<RoomSelection />);

    await waitFor(() => {
      expect(mockCreateGame).toHaveBeenCalledWith(12);
    });
    expect(window.location.search).toBe('');
  });

  it('focuses the room code input from the join-room shortcut', async () => {
    window.history.replaceState({}, '', '/?action=join-room');

    render(<RoomSelection />);

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByPlaceholderText('8888'));
    });
  });
});
