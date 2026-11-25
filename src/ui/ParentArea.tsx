import { useEffect, useState } from 'react';
import { itemLabel } from '../content/items';
import type { Tier } from '../content/types';
import { itemStatus } from '../engine/skills';
import { clampSpeechSpeed, SPEECH_SPEED, type GameState, type Settings } from '../engine/state';
import { speech } from '../audio/speech';
import { SPEED_SAMPLE } from '../content/utterances';
import { WEEK_WORD_CHOICES, weekWordChoice } from '../content/weekWord';
import { PLACES } from '../content/places';
import { micAvailable } from './RepeatMic';
import { offlineLabel, offlineStatus, onOfflineStatus } from '../pwa/offline';
import { DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { NameSetup } from './NameSetup';
import type { NameVoiceState } from './useNameVoices';
import { CLOUD_URL, type CloudInfo } from './useCloudSync';
import { resetFamilyChoice } from './FamilyGate';
import { CircleSettings } from './CircleSettings';
import type { CircleInfo } from './useCircle';

const PRON_LABEL = { fr: 'à la française', en: 'à l’anglaise', spelled: 'comme écrit' } as const;

function nameVoiceLabel(v: NameVoiceState): string {
  if (v.status === 'ready') return '✓ les animaux disent son prénom';
  if (v.status === 'working') return `⏳ l'ordinateur enregistre les phrases avec son prénom (${v.done}/${v.total})`;
  if (v.status === 'unavailable') return 'voix du prénom indisponibles ici (il faut le jeu servi par l’ordinateur) : les animaux disent « Hello! » sans le prénom';
  return 'prononciation pas encore choisie';
}

const CLOUD_LABEL = {
  off: '',
  syncing: '⏳ envoi en cours…',
  ok: '✓ à jour sur tous les appareils',
  offline: 'pas de connexion pour l’instant : la partie est gardée ici et partira dès le retour d’internet',
} as const;

const SPEED_PRESETS = [
  { label: 'Lent', value: 0.7 },
  { label: 'Conseillé', value: SPEECH_SPEED.default },
  { label: 'Naturel', value: SPEECH_SPEED.natural },
] as const;

interface Props {
  state: GameState;
  setState: (fn: (s: GameState) => GameState) => void;
  nameVoice: NameVoiceState;
  cloud: CloudInfo;
  circle: CircleInfo;
  onReset: () => void;
  onClose: () => void;
}

/** Espace parents, ouvert directement (pas de verrou : décision du parent du 2026-11-19) : réglages, suivi, remise à zéro. */
export function ParentArea({ state, setState, nameVoice, cloud, circle, onReset, onClose }: Props) {
  const [editName, setEditName] = useState(false);
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
          <div className="name-settings">
            <span>
              Prénom : <strong>{state.player.name === DEFAULT_PLAYER_NAME ? '(pas encore donné)' : state.player.name}</strong>
              {state.player.namePron && <> · dit {PRON_LABEL[state.player.namePron.mode]}{state.player.namePron.spelling ? ` (« ${state.player.namePron.spelling} »)` : ''}</>}
            </span>
            <span className="note">{nameVoiceLabel(nameVoice)}. {cloud.code ? 'Le prénom reste dans la partie, partagée seulement avec les appareils qui ont le code de famille.' : "Le prénom reste dans la partie (tablette et ordinateur), rien n'est envoyé ailleurs."}</span>
            {editName ? (
              <NameSetup
                initialName={state.player.name}
                initialPron={state.player.namePron}
                speechSpeed={state.settings.speechSpeed}
                onDone={(name, pron) => {
                  setState((s) => ({ ...s, player: { ...s.player, name, namePron: pron } }));
                  setEditName(false);
                }}
                onCancel={() => setEditName(false)}
              />
            ) : (
              <span className="row">
                <button onClick={() => setEditName(true)}>Changer le prénom ou sa prononciation</button>
              </span>
            )}
          </div>
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
            Mot de la semaine
            <select value={state.settings.weekWord ?? ''} onChange={(e) => set({ weekWord: e.target.value || undefined })}>
              <option value="">Aucun</option>
              {WEEK_WORD_CHOICES.map((c) => (
                <option key={c.word} value={c.word}>
                  {c.noun.fr} · {c.noun.en}
                </option>
              ))}
            </select>
          </label>
          {weekWordChoice(state.settings.weekWord) && (
            <p className="note">
              Annoncé en arrivant dans : {weekWordChoice(state.settings.weekWord)!.places.map((id) => PLACES[id]?.nameFr ?? id).join(', ')}. L'objet brille jusqu'à ce qu'elle le touche.
            </p>
          )}
          <label className="check">
            <input type="checkbox" checked={!!state.settings.micRepeat} disabled={!micAvailable()} onChange={(e) => set({ micRepeat: e.target.checked || undefined })} /> « Répète après moi » avec le micro
          </label>
          <p className="note">
            {micAvailable()
              ? 'Un bouton 🎤 dans la bulle : elle dit la phrase, s’entend, puis réécoute le jeu. L’enregistrement reste dans l’appareil, n’est ni envoyé, ni gardé, ni analysé : il est effacé dès la réécoute.'
              : 'Micro indisponible sur cet appareil ou ce navigateur.'}
          </p>
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
            Voix : enregistrements anglais intégrés au jeu (voix Kokoro, générées sur l'ordinateur), aide française par la synthèse vocale de l'appareil{speech.available ? '' : ' (son indisponible : sous-titres seulement)'}. Aucun compte, aucune donnée envoyée ; le micro n'est utilisé que si vous cochez « Répète après moi ».
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

        {CLOUD_URL ? (
          <section>
            <h3>Partie partagée</h3>
            {cloud.code ? (
              <>
                <p>
                  Code de famille : <strong className="family-code small">{cloud.code}</strong>
                </p>
                <p className="note">{CLOUD_LABEL[cloud.status]}</p>
                <p className="note">
                  Sur un autre appareil (téléphone, tablette, ordinateur) : ouvrir le jeu, taper le code du jeu, puis « J'ai déjà un code » et ce code de famille. La partie s'enregistre toute seule ; le serveur garde aussi la version de la veille pendant 60 jours.
                </p>
                <button onClick={resetFamilyChoice}>Changer de code de famille…</button>
              </>
            ) : (
              <>
                <p className="note">Cet appareil joue seul : la partie est gardée seulement ici.</p>
                <button onClick={resetFamilyChoice}>Partager la partie avec d'autres appareils…</button>
              </>
            )}
          </section>
        ) : (
        <section>
          <h3>Parties sauvegardées</h3>
          <p className="note">
            Les parties sont gardées sur cet appareil, et une copie est rangée sur l'ordinateur qui fait tourner le jeu (dossier <code>saves</code> du projet, avec une copie par jour dans <code>saves/historique</code>). Si la tablette ouvre le jeu à une autre adresse, elle reprend toute seule la partie de l'ordinateur.
          </p>
          <p className="note">Conseil : réserver une adresse fixe pour l'ordinateur dans la box, et ouvrir le jeu sur la tablette toujours depuis le même favori.</p>
        </section>
        )}

        {circle.available && <CircleSettings circle={circle} />}

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
            {confirmReset ? `Confirmer : tout effacer (bébés, progrès)${cloud.code ? ' sur tous les appareils' : ''}` : 'Effacer la partie…'}
          </button>
          {confirmReset > 0 && <button onClick={() => setConfirmReset(0)}>Annuler</button>}
        </section>
      </div>
    </div>
  );
}
