import { useState, type FormEvent, type ReactNode } from 'react';
import { ACCESS_KEY, accessToken, hasAccess, isAccessCode, isStaticSite } from '../engine/access';

function readAccess(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

function rememberAccess(): void {
  try {
    window.localStorage.setItem(ACCESS_KEY, accessToken());
  } catch {
    /* navigation privée : le code sera redemandé la prochaine fois */
  }
}

/**
 * Version en ligne seulement : demande le code une fois par appareil (voir engine/access.ts).
 * Le jeu servi par l'ordinateur de la maison passe directement.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => !isStaticSite(import.meta.env) || hasAccess(readAccess()));
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);

  if (open) return <>{children}</>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (isAccessCode(code)) {
      rememberAccess();
      setOpen(true);
    } else {
      setWrong(true);
      setCode('');
    }
  };

  return (
    <div className="screen access-screen">
      <form className="access-card" onSubmit={submit}>
        <h1>Animal English Adventure</h1>
        <p className="access-hint">Code du jeu</p>
        <input
          className="access-input"
          type="password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setWrong(false);
          }}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Code du jeu"
          aria-invalid={wrong}
          autoFocus
        />
        {wrong && <p className="access-wrong" role="alert">Ce n'est pas le bon code.</p>}
        <button className="big play" type="submit" disabled={!code.trim()}>
          OK
        </button>
      </form>
    </div>
  );
}
