import { Component, type ErrorInfo, type ReactNode } from 'react';
import { setAsideSave } from '../engine/save';

/**
 * Filet de sécurité : si un écran plante, on montre une page simple au lieu d'un écran vide
 * qui revient à chaque rechargement (audit du 2026-11-25). Deux boutons :
 * réessayer, ou repartir d'une nouvelle partie en gardant l'ancienne de côté (`aea.save.corrupt`).
 */
export class CrashScreen extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[jeu] écran planté', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="screen crash-screen">
        <div className="crash-card">
          <div className="crash-icon" aria-hidden>🦁</div>
          <h1>Oops!</h1>
          <p className="note">Le jeu a eu un souci. Réessaie ; si ça recommence, repars d'une nouvelle partie : l'ancienne est gardée de côté.</p>
          <button type="button" className="primary" onClick={() => location.reload()}>
            ↻ Try again · Réessayer
          </button>
          <button
            type="button"
            onClick={() => {
              setAsideSave(window.localStorage);
              location.reload();
            }}
          >
            New game · Nouvelle partie
          </button>
        </div>
      </div>
    );
  }
}
