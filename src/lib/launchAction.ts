export type LaunchAction = 'create-room' | 'join-room';

const launchActions = new Set<LaunchAction>(['create-room', 'join-room']);

export const getLaunchAction = (): LaunchAction | null => {
  if (typeof window === 'undefined') return null;

  const action = new URLSearchParams(window.location.search).get('action');
  return launchActions.has(action as LaunchAction) ? (action as LaunchAction) : null;
};

export const clearLaunchAction = (): void => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has('action')) return;

  url.searchParams.delete('action');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
};
