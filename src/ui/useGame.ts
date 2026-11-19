import { useCallback, useEffect, useRef, useState } from 'react';
import { speech } from '../audio/speech';
import { loadGame, memoryStorage, resetGame, saveGame, type LoadStatus, type StorageLike } from '../engine/save';
import { newGameState, variableNames, type GameState } from '../engine/state';

function browserStorage(): StorageLike {
  try {
    const t = '__aea_test__';
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return memoryStorage(); // navigation privée : on joue sans sauvegarde durable
  }
}

export function useGame() {
  const storage = useRef<StorageLike>(null as unknown as StorageLike);
  if (!storage.current) storage.current = browserStorage();
  const [boot] = useState(() => loadGame(storage.current));
  const [state, setState] = useState<GameState>(boot.state);
  const loadStatus: LoadStatus = boot.status;
  // au rendu : les effets des enfants parlent avant ceux du parent
  speech.setNames(variableNames(state));
  speech.setSpeed(state.settings.speechSpeed);

  useEffect(() => {
    saveGame(storage.current, state);
  }, [state]);

  useEffect(() => {
    speech.setMuted(state.settings.muted);
  }, [state.settings.muted]);

  const reset = useCallback(() => {
    resetGame(storage.current);
    setState(newGameState());
  }, []);

  return { state, setState, loadStatus, reset };
}
