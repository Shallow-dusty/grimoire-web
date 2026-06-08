
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store';
import { useSandboxStore } from './sandboxStore';

// Loading
import { LoadingFallback } from './components/ui/LoadingFallback';

// Core
import { Lobby } from './components/lobby/Lobby';
import { RoomSelection } from './components/lobby/RoomSelection';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy shells
const TownSquare = lazy(() => import('./components/game/TownSquare').then(m => ({ default: m.TownSquare })));
const SandboxView = lazy(() => import('./components/sandbox/SandboxView').then(m => ({ default: m.SandboxView })));
const StorytellerShell = lazy(() => import('./components/app/StorytellerShell').then(m => ({ default: m.StorytellerShell })));
const PlayerShell = lazy(() => import('./components/app/PlayerShell').then(m => ({ default: m.PlayerShell })));

const App = () => {
  const { t, i18n } = useTranslation();
  const user = useStore(state => state.user);
  const gameState = useStore(state => state.gameState);
  const isSandboxActive = useSandboxStore(state => state.isActive);

  // Keep the <html lang> attribute in sync with i18next so screen readers and
  // browser features (translation hints, hyphenation) pick the correct language.
  useEffect(() => {
    const updateLang = (lang: string) => {
      document.documentElement.lang = lang;
    };
    updateLang(i18n.language);
    i18n.on('languageChanged', updateLang);
    return () => { i18n.off('languageChanged', updateLang); };
  }, [i18n]);

  if (window.location.pathname === '/townsquare' || window.location.search.includes('mode=townsquare')) {
    return (
      <Suspense fallback={<LoadingFallback fullScreen />}>
        <TownSquare />
      </Suspense>
    );
  }

  if (isSandboxActive) {
    return (
      <Suspense fallback={<LoadingFallback fullScreen message={t('sandbox.loading')} />}>
        <SandboxView />
      </Suspense>
    );
  }

  if (!user) {
    return <Lobby />;
  }

  if (!gameState) {
    return <RoomSelection />;
  }

  return (
    <Suspense fallback={<LoadingFallback fullScreen message={t('ui.loading.loadingGrimoire')} />}>
      {user.isStoryteller ? (
        <StorytellerShell user={user} gameState={gameState} />
      ) : (
        <PlayerShell user={user} gameState={gameState} />
      )}
    </Suspense>
  );
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
