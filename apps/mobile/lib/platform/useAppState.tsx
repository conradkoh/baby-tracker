import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState() {
  // const [appState, setAppState] = useState(AppState.currentState);
  const [stateTransition, setStateTransition] = useState<{
    prevState: AppStateStatus | null;
    appState: AppStateStatus;
  }>({ prevState: null, appState: AppState.currentState });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setStateTransition({
        prevState: stateTransition.appState,
        appState: nextAppState,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [stateTransition]);
  return {
    appState: stateTransition.appState,
    didFocus: () => {
      return (
        stateTransition.prevState &&
        stateTransition.prevState.match(/inactive|background/) &&
        stateTransition.appState === 'active'
      );
    },
  };
}
