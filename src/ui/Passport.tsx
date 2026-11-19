import { speech } from '../audio/speech';
import { STAGE_NAMES } from '../content/dialogues';
import { adventuresOf, TREASURES } from '../content/adventures';
import { itemLabel } from '../content/items';
import { NOUNS, PLACES } from '../content/places';
import { SKILLS } from '../content/skills';
import { say } from '../content/utterances';
import { getSpecies } from '../content/species';
import { CONTINENTS } from '../content/world';
import { MECHANIC_LABELS } from '../content/archetypes';
import { favouriteMechanics, growthPercent, growthProgress, nextStageGoal } from '../engine/family';
import { itemStatus, type ItemStatus } from '../engine/skills';
import type { GameState } from '../engine/state';
import { assetUrl, background, spriteFor } from './scene';

const STARS: Record<ItemStatus, string> = { new: '☆☆☆', recognised: '★☆☆', supported: '★★☆', independent: '★★★' };

/** Passeport d'exploratrice : mots rencontrés, continents, bébés. Aucun score public. */
export function Passport({ state, onClose }: { state: GameState; onClose: () => void }) {
  const fr = state.settings.frenchHelp;
  const babies = Object.values(state.families).flatMap((f) => f.babies);
  return (
    <div className="screen panel-screen">
      <div className="panel">
        <div className="picker-head">
          <h2>🎒 Passport {fr && <small>· Passeport</small>}</h2>
          <button className="round" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <section>
          <h3>🌍 {fr ? 'Continents visités' : 'Continents'}</h3>
          <div className="chips">
            {CONTINENTS.map((c) => (
              <span key={c.id} className={`chip${state.player.visitedContinents.includes(c.id) ? ' on' : ''}`}>{c.nameEn}</span>
            ))}
          </div>
        </section>

        <section>
          <h3>🎁 {fr ? 'Mes trésors' : 'My treasures'} <small>{state.player.treasures.length} / {Object.keys(TREASURES).length}</small></h3>
          {CONTINENTS.map((c) => {
            const ids = [...new Set(adventuresOf(c.id).map((a) => a.treasure))];
            if (!ids.length) return null;
            return (
              <div key={c.id} className="skill-row">
                <h4>{c.nameEn}</h4>
                <div className="chips">
                  {ids.map((id) => {
                    const t = TREASURES[id];
                    const got = state.player.treasures.includes(id);
                    if (!t) return null;
                    return got ? (
                      <button key={id} className="chip treasure on" onClick={() => void speech.speak(say.treasure(t.nameEn))}>
                        {t.icon} {t.nameEn}{fr && <small> · {t.nameFr}</small>}
                      </button>
                    ) : (
                      <span key={id} className="chip treasure locked" aria-label={fr ? 'Trésor à trouver' : 'Treasure to find'}>❔</span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {state.player.placesVisited.length > 0 && (
          <section>
            <h3>📍 {fr ? 'Lieux explorés' : 'Places'} <small>{state.player.placesVisited.length} / {Object.keys(PLACES).length}</small></h3>
            <div className="chips">
              {state.player.placesVisited.map((id) => PLACES[id] && <span key={id} className="chip on">{PLACES[id]!.nameEn}</span>)}
            </div>
          </section>
        )}

        {state.player.photos.length > 0 && (
          <section>
            <h3>📷 {fr ? 'Mon album photo' : 'My photos'} <small>{state.player.photos.length}</small></h3>
            <div className="photo-album">
              {state.player.photos.map((key) => {
                const [placeId, anchorId] = key.split(':');
                const place = PLACES[placeId ?? ''];
                const a = place?.anchors.find((x) => x.id === anchorId);
                if (!place || !a) return null;
                const bg = background(place.background);
                const label = NOUNS[a.word]?.en ?? a.word;
                const cx = a.hit.x + a.hit.w / 2;
                const cy = a.hit.y + a.hit.h / 2;
                return (
                  <button key={key} className="polaroid" onClick={() => void speech.speak(say.decorWord(NOUNS[a.word], a.word))}>
                    <span className="polaroid-img" style={bg ? { backgroundImage: `url("${assetUrl(bg)}")`, backgroundPosition: `${cx}% ${cy}%` } : { background: place.placeholderGradient }} />
                    <span className="polaroid-txt">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {CONTINENTS.some((c) => state.player.words[c.id]?.length) && (
          <section>
            <h3>🧭 {fr ? 'Mots de chaque continent' : 'Words from each continent'}</h3>
            {CONTINENTS.filter((c) => state.player.words[c.id]?.length).map((c) => (
              <div key={c.id} className="skill-row">
                <h4>{c.nameEn}</h4>
                <div className="chips">
                  {state.player.words[c.id]!.map((w) => {
                    const it = itemLabel(w);
                    return (
                      <button key={w} className="chip word" onClick={() => void speech.speak(it.en)}>
                        {it.icon} {it.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {babies.length > 0 && (
          <section>
            <h3>👶 {fr ? 'Les bébés' : 'Babies'}</h3>
            <div className="baby-cards">
              {babies.map((b) => {
                const sp = getSpecies(b.familyId);
                const sprite = spriteFor(sp.id, { sex: b.sex, stage: b.stage });
                const p = growthProgress(b);
                const goal = nextStageGoal(b);
                const likes = favouriteMechanics(b);
                return (
                  <div key={`${b.familyId}-${b.id}`} className="baby-card">
                    {sprite ? <img src={assetUrl(sprite)} alt="" /> : <span className="big-icon">{sp.icon}</span>}
                    <strong>{b.name}</strong>
                    <span>{STAGE_NAMES[b.stage]!.en}{fr && ` · ${STAGE_NAMES[b.stage]!.fr}`}</span>
                    {goal && (
                      <span className="grow-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(growthPercent(b) * 100)} aria-label={fr ? `Vers : ${STAGE_NAMES[goal.stage]!.fr}` : `Next: ${STAGE_NAMES[goal.stage]!.en}`}>
                        <span style={{ width: `${Math.round(growthPercent(b) * 100)}%` }} />
                        <em>➜ {STAGE_NAMES[goal.stage]!.en}</em>
                      </span>
                    )}
                    {likes.length > 0 && (
                      <span className="likes">
                        ❤️ {likes.map((m) => `${MECHANIC_LABELS[m]?.icon ?? ''} ${fr ? (MECHANIC_LABELS[m]?.fr ?? m) : (MECHANIC_LABELS[m]?.en ?? m)}`).join(' · ')}
                      </span>
                    )}
                    <span className="words">{Object.keys(b.taughtWords).map((w) => (b.retainedWords.includes(w) ? `💡${w}` : w)).join(' · ') || '—'}</span>
                    {goal && fr && (
                      <span className="goal">
                        Pour grandir : {p.retained}/{goal.threshold.retained} mots retenus · {p.seen}/{goal.threshold.seen} expressions · {p.activities}/{goal.threshold.activities} sortes d'aventures
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h3>🗣️ {fr ? 'Mes mots anglais' : 'My English words'}</h3>
          {SKILLS.filter((s) => s.items.some((i) => state.player.items[i])).map((s) => (
            <div key={s.id} className="skill-row">
              <h4>{s.titleEn}{fr && <small> · {s.titleFr}</small>}</h4>
              <div className="chips">
                {s.items.filter((i) => state.player.items[i]).map((i) => {
                  const it = itemLabel(i);
                  return (
                    <button key={i} className="chip word" onClick={() => void speech.speak(it.en)}>
                      {it.icon} {it.en} <span className="stars-s">{STARS[itemStatus(state.player.items[i])]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(state.player.items).length === 0 && <p>{fr ? 'Va dire bonjour aux animaux !' : 'Go and say hello to the animals!'}</p>}
        </section>
      </div>
    </div>
  );
}
