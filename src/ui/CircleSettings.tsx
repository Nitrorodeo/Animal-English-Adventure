import { useState, type FormEvent } from 'react';
import { easyToGuess, EASY_CODE_WARNING, isFamilyCode, normalizeFamilyCode } from '../engine/cloud';
import type { CircleInfo, CircleResult } from './useCircle';

const WHY: Record<Exclude<CircleResult, { ok: true }>['reason'], string> = {
  code: 'Le code fait au moins 4 lettres ou chiffres, par exemple « amis-lion-mango-4271 ».',
  none: 'Aucun cercle avec ce code. Vérifiez les mots et les chiffres.',
  offline: 'Pas de connexion au serveur. Vérifiez internet puis réessayez.',
  name: 'Donnez d’abord un prénom à la joueuse (écran de départ), pour que ses amis la reconnaissent.',
  full: 'Ce cercle a déjà 12 enfants.',
  taken: 'Ce code est déjà utilisé par un autre cercle. Choisissez-en un autre, ou prenez « Rejoindre un cercle » si c’est le vôtre.',
};

/** Espace parents : créer, rejoindre ou quitter le cercle d'amis (engine/circle.ts). */
export function CircleSettings({ circle }: { circle: CircleInfo }) {
  const [mode, setMode] = useState<'idle' | 'join' | 'create' | 'change'>('idle');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const run = async (go: () => Promise<CircleResult>) => {
    setBusy(true);
    setError(null);
    const r = await go();
    setBusy(false);
    if (r.ok) {
      setMode('idle');
      setTyped('');
    } else setError(WHY[r.reason]);
  };

  return (
    <section>
      <h3>Cercle d’amis</h3>
      <p className="note">
        Pour que votre fille voie la progression de ses amis, sans concurrence : chaque enfant a une petite carte avec son prénom, ses étoiles et ses aventures. Rien d’autre n’est partagé (jamais la partie), il n’y a ni classement ni ordre d’étoiles, et chaque famille peut quitter le cercle quand elle veut.
      </p>
      {circle.code && mode === 'change' ? (
        <form
          className="family-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void run(() => circle.change(typed, 'create'));
          }}
        >
          <p className="note">
            Nouveau code du cercle (actuellement <strong>{circle.code}</strong>). Choisissez-le, ou tapez celui qu’un ami vous a donné.
          </p>
          <input
            className="access-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="amis-lea-tom-2026"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Nouveau code du cercle d’amis"
            aria-invalid={error !== null}
            autoFocus
          />
          <p className="note">
            Sa carte passe dans le cercle du nouveau code et quitte l’ancien. Donnez ensuite le nouveau code aux parents des copains : chez eux, espace parents ⚙️, « Cercle d’amis », « Changer le code du cercle… », puis « Rejoindre ce code ».
          </p>
          {isFamilyCode(normalizeFamilyCode(typed)) && easyToGuess(normalizeFamilyCode(typed)) && (
            <p className="note code-easy" role="status">
              {EASY_CODE_WARNING}
            </p>
          )}
          {error && (
            <p className="access-wrong" role="alert">
              {error}
            </p>
          )}
          <button className="ok" type="submit" disabled={busy || !typed.trim()}>
            {busy ? '⏳' : 'Créer ce nouveau code'}
          </button>
          <button type="button" disabled={busy || !typed.trim()} onClick={() => void run(() => circle.change(typed, 'join'))}>
            Rejoindre ce code (donné par un ami)
          </button>
          <button type="button" disabled={busy} onClick={() => setTyped(circle.propose())}>
            🎲 Un autre code proposé
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('idle');
              setError(null);
            }}
          >
            ← Retour
          </button>
        </form>
      ) : circle.code ? (
        <>
          <p>
            Code du cercle : <strong className="family-code small">{circle.code}</strong>
          </p>
          <p className="note">
            Donnez ce code aux parents de ses amis : sur leur appareil, ouvrir le jeu, puis espace parents ⚙️, « Cercle d’amis », « Rejoindre un cercle ». Chaque nouvel enfant qui entre reçoit sa carte, et elle voit apparaître la sienne chez eux.
            {circle.status === 'offline' && ' Pas de connexion pour l’instant : les cartes se mettront à jour au retour d’internet.'}
            {circle.status === 'full' && ' Le cercle est complet (12 enfants) : cette carte ne peut pas y être ajoutée.'}
          </p>
          <p className="note">
            Les amis dans le cercle : {circle.friends.length === 0 ? 'personne d’autre pour l’instant.' : circle.friends.map((f) => f.name).join(', ') + '.'}
          </p>
          <button
            onClick={() => {
              setError(null);
              setConfirmLeave(false);
              setTyped(circle.propose());
              setMode('change');
            }}
          >
            Changer le code du cercle…
          </button>
          <button onClick={() => (confirmLeave ? (setConfirmLeave(false), void circle.leave()) : setConfirmLeave(true))}>
            {confirmLeave ? 'Confirmer : quitter le cercle (sa carte disparaît chez les amis)' : 'Quitter le cercle…'}
          </button>
          {confirmLeave && <button onClick={() => setConfirmLeave(false)}>Annuler</button>}
        </>
      ) : mode === 'join' ? (
        <form
          className="family-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void run(() => circle.join(typed));
          }}
        >
          <input
            className="access-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="amis-lion-mango-4271"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Code du cercle d’amis"
            aria-invalid={error !== null}
            autoFocus
          />
          {error && (
            <p className="access-wrong" role="alert">
              {error}
            </p>
          )}
          <button className="ok" type="submit" disabled={busy || !typed.trim()}>
            {busy ? '⏳' : 'Rejoindre'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('idle');
              setError(null);
            }}
          >
            ← Retour
          </button>
        </form>
      ) : mode === 'create' ? (
        <form
          className="family-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void run(() => circle.create(typed));
          }}
        >
          <p className="note">Voici un code proposé. Vous pouvez l’effacer et choisir le vôtre (par exemple « amis-lea-tom-2026 »).</p>
          <input
            className="access-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="amis-lea-tom-2026"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Code du cercle d’amis choisi"
            aria-invalid={error !== null}
            autoFocus
          />
          <p className="note">Lettres et chiffres, au moins 4 ; les espaces deviennent des tirets. Évitez un code facile à deviner : toute personne qui le connaît voit les cartes du cercle.</p>
          {isFamilyCode(normalizeFamilyCode(typed)) && easyToGuess(normalizeFamilyCode(typed)) && (
            <p className="note code-easy" role="status">
              {EASY_CODE_WARNING}
            </p>
          )}
          {error && (
            <p className="access-wrong" role="alert">
              {error}
            </p>
          )}
          <button className="ok" type="submit" disabled={busy || !typed.trim()}>
            {busy ? '⏳' : 'Créer le cercle'}
          </button>
          <button type="button" disabled={busy} onClick={() => setTyped(circle.propose())}>
            🎲 Un autre code proposé
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('idle');
              setError(null);
            }}
          >
            ← Retour
          </button>
        </form>
      ) : (
        <>
          {error && (
            <p className="access-wrong" role="alert">
              {error}
            </p>
          )}
          <button
            className="ok"
            disabled={busy}
            onClick={() => {
              setError(null);
              setTyped(circle.propose());
              setMode('create');
            }}
          >
            Créer un cercle (première famille)
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setError(null);
              setTyped('');
              setMode('join');
            }}
          >
            Rejoindre un cercle (j’ai un code)
          </button>
        </>
      )}
    </section>
  );
}
