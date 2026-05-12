import { beforeEach, describe, expect, it } from 'vitest';
import { clearLaunchAction, getLaunchAction } from './launchAction';

describe('launchAction', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('reads supported manifest shortcut actions', () => {
    window.history.replaceState({}, '', '/?action=create-room');
    expect(getLaunchAction()).toBe('create-room');

    window.history.replaceState({}, '', '/?action=join-room');
    expect(getLaunchAction()).toBe('join-room');
  });

  it('ignores unknown actions', () => {
    window.history.replaceState({}, '', '/?action=share');
    expect(getLaunchAction()).toBeNull();
  });

  it('clears only the action query parameter', () => {
    window.history.replaceState({}, '', '/?action=create-room&mode=townsquare#anchor');

    clearLaunchAction();

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?mode=townsquare');
    expect(window.location.hash).toBe('#anchor');
  });
});
