import { useEffect, useState } from 'react';
import { itemLabel } from '../content/items';
import type { Tier } from '../content/types';
import { sanitizeName } from '../engine/family';
import { itemStatus } from '../engine/skills';
import { clampSpeechSpeed, SPEECH_SPEED, type GameState, type Settings } from '../engine/state';
import { speech } from '../audio/speech';
import { SPEED_SAMPLE } from '../content/utterances';
import { offlineLabel, offlineStatus, onOfflineStatus } from '../pwa/offline';

const SPEED_PRESETS = [
  { label: 'Lent', value: 0.7 },
  { label: 'Conseillé', value: SPEECH_SPEED.default },
  { label: 'Naturel', value: SPEECH_SPEED.natural },
] as const;

interface Props {
  state: GameState;
  setState: (fn: (s: GameState) => GameState) => void;
  onReset: () => void;
  onClose: () => void;
}

/** Espace parents, ouvert directement (pas de verrou : décision du parent du 2026-11-19) : réglages, suivi, remise à zéro. */
export function ParentArea({ state, setState, onReset, onClose }: Props) {
  const [name, setName] = useState(state.player.name === 'Explorer' ? '' : state.player.name);
  const [confirmReset, setConfirmReset] = useState(0);
  const [offline, setOffline] = useState(offlineStatus);
  useEffect(() => onOfflineStatus(setOffline), []);

  const set = (patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const speed = state.settings.speechSpeed;
  const setSpeed = (v: number) => set({ speechSpeed: clampSpeechSpeed(v) });
  const pct = Math.round(speed * 100);
  const speedHint = pct < 100 ? 'plus lent que la vitesse naturelle' : pct > 100 ? 'plus rapide que la vitesse naturelle' : 'vitesse naturelle';

  const items = Object.entries(state.player.items);
  return (
    <div className="screen panel-screen">
      <div className="panel">
        <div className="picker-head">
          <h2>⚙️ Espace parents</h2>
          <button className="round" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <section className="settings">
          <label>
            Prénom de l'exploratrice (facultatif, reste sur cet appareil)
            <span className="row">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              <button
                onClick={() => {
                  const r = sanitizeName(name);
                  setState((s) => ({ ...s, player: { ...s.player, name: r.ok ? r.name : 'Explorer' } }));
                }}
              >
                Enregistrer
              </button>
            </span>
          </label>
          <label className="check"><input type="checkbox" checked={state.settings.muted} onChange={(e) => set({ muted: e.target.checked })} /> Couper le son</label>
          <div className="speed">
            <label htmlFor="speech-speed">
              Vitesse des voix : <strong>{pct} %</strong> <span className="speed-hint">({speedHint})</span>
            </label>
            <span className="row speed-row">
              <button onClick={() => setSpeed(speed - SPEECH_SPEED.step)} disabled={speed <= SPEECH_SPEED.min} aria-label="Plus lent">🐢 −</button>
              <input
                id="speech-speed"
                type="range"
                list="speech-speed-marks"
                min={SPEECH_SPEED.min}
                max={SPEECH_SPEED.max}
                step={SPEECH_SPEED.step}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <button onClick={() => setSpeed(speed + SPEECH_SPEED.step)} disabled={speed >= SPEECH_SPEED.max} aria-label="Plus rapide">+ 🐇</button>
              <button
                className="speed-listen"
                onClick={() => void speech.speak(SPEED_SAMPLE.text, { role: SPEED_SAMPLE.role, slow: state.settings.slowVoice })}
                disabled={state.settings.muted}
                title={state.settings.muted ? 'Le son est coupé' : 'Écouter Leo à cette vitesse'}
              >
                ▶ Écouter
              </button>
            </span>
            <datalist id="speech-speed-marks">
              {[SPEECH_SPEED.min, SPEECH_SPEED.default, SPEECH_SPEED.natural, SPEECH_SPEED.max].map((v) => <option key={v} value={v} />)}
            </datalist>
            <span className="row speed-presets">
              {SPEED_PRESETS.map((p) => (
                <button key={p.value} aria-pressed={speed === p.value} className={speed === p.value ? 'on' : undefined} onClick={() => setSpeed(p.value)}>
                  {p.label} {Math.round(p.value * 100)} %
                </button>
              ))}
            </span>
            <span className="note">100 % = vitesse naturelle d'un adulte qui parle. En dessous : plus lent ; au-dessus : plus rapide. Pendant l'écoute, bougez la barre : la voix change aussitôt.</span>
          </div>
          <label className="check"><input type="checkbox" checked={state.settings.slowVoice} onChange={(e) => set({ slowVoice: e.target.checked })} /> Voix lente par défaut</label>
          <label className="check"><input type="checkbox" checked={state.settings.frenchHelp} onChange={(e) => set({ frenchHelp: e.target.checked })} /> Afficher l'aide en français</label>
          <label>
            Niveau des dialogues
            <select value={state.settings.levelOverride} onChange={(e) => set({ levelOverride: e.target.value as 'auto' | Tier })}>
              <option value="auto">Automatique (selon les acquis)</option>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <p className="note">
            Voix : enregistrements anglais intégrés au jeu (voix Kokoro, générées sur l'ordinateur), aide française par la synthèse vocale de l'appareil{speech.available ? '' : ' (son indisponible : sous-titres seulement)'}. Aucun micro, aucun compte, aucune donnée envoyée.
          </p>
        </section>

        <section>
          <h3>Suivi ({state.player.activityCounter} activités)</h3>
          <table className="progress-table">
            <thead><tr><th>Expression</th><th>Statut</th><th>Vue</th><th>Réussie seule</th><th>Avec aide</th><th>Contextes</th></tr></thead>
            <tbody>
              {items.map(([id, p]) => (
                <tr key={id}>
                  <td>{itemLabel(id).en}</td>
                  <td>{{ new: 'nouvelle', recognised: 'reconnue', supported: 'avec soutien', independent: 'autonome' }[itemStatus(p)]}</td>
                  <td>{p.seen}</td>
                  <td>{p.correctUnaided}</td>
                  <td>{p.correctAided}</td>
                  <td>{p.contexts.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">« Autonome » = 3 réussites sans aide dans 2 aventures différentes. Une réponse tactile n'évalue pas la prononciation.</p>
        </section>

        <section>
          <h3>Parties sauvegardées</h3>
          <p className="note">
            Les parties sont gardées sur cet appareil, et une copie est rangée sur l'ordinateur qui fait tourner le jeu (dossier <code>saves</code> du projet, avec une copie par jour dans <code>saves/historique</code>). Si la tablette ouvre le jeu à une autre adresse, elle reprend toute seule la partie de l'ordinateur.
          </p>
          <p className="note">Conseil : réserver une adresse fixe pour l'ordinateur dans la box, et ouvrir le jeu sur la tablette toujours depuis le même favori.</p>
        </section>

        <section>
          <h3>Jouer sans internet</h3>
          <p className="note offline-state">{offlineLabel(offline)}</p>
          {offline.state === 'downloading' && (
            <span className="grow-bar" aria-hidden>
              <span style={{ width: `${(100 * offline.done) / Math.max(1, offline.total)}%` }} />
            </span>
          )}
          <p className="note">Le téléchargement se fait tout seul en arrière-plan (environ 175 Mo : dessins puis voix). Sur tablette, « Ajouter à l'écran d'accueil » installe le jeu comme une application.</p>
        </section>

        <section>
          <h3>Remise à zéro</h3>
          <button className="danger" onClick={() => (confirmReset ? (onReset(), setConfirmReset(0)) : setConfirmReset(1))}>
            {confirmReset ? 'Confirmer : tout effacer (bébés, progrès)' : 'Effacer la partie…'}
          </button>
          {confirmReset > 0 && <button onClick={() => setConfirmReset(0)}>Annuler</button>}
        </section>
      </div>
    </div>
  );
}
