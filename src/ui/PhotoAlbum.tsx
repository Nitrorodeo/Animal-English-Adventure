import { useEffect, useMemo, useState } from 'react';
import { speech } from '../audio/speech';
import { PLACES } from '../content/places';
import { getSpecies, SPECIES } from '../content/species';
import { say } from '../content/utterances';
import { giftDef } from '../engine/gifts';
import { ALBUM_MAX_PER_FAMILY, albumFamilies, deletePhoto, familyPhotos, type Photo, type SnapActor } from '../engine/photoAlbum';
import type { GameState } from '../engine/state';
import { rigFor } from '../game/rigs';
import { giftUrl } from './Gifts';
import { BedtimeSky } from './Habitat';
import { assetUrl, background, spriteFor } from './scene';

/** Dessin d'un animal tel qu'il était sur la photo (un bébé garde l'âge qu'il avait ce jour-là). */
function snapSprite(speciesId: string, a: SnapActor) {
  if (a.who !== 'baby') return spriteFor(speciesId, { role: a.who });
  return a.sex && a.stage ? spriteFor(speciesId, { sex: a.sex, stage: a.stage }) : undefined;
}

/**
 * Une photo redessinée : le décor, puis les cadeaux et les animaux à leur place, dans leur sens. Aucune image n'est
 * stockée (engine/photoAlbum.ts) : ce sont les dessins du jeu, déjà sur l'appareil.
 */
export function PhotoScene({ photo, className = '' }: { photo: Photo; className?: string }) {
  const place = PLACES[photo.p];
  const sp = SPECIES.find((s) => s.id === photo.sp);
  const bg = place ? background(place.background) : undefined;
  return (
    <div className={`photo-scene${photo.night ? ' night' : ''} ${className}`}>
      {bg ? <img className="ps-bg" src={assetUrl(bg)} alt="" draggable={false} loading="lazy" /> : <div className="ps-bg" style={{ background: place?.placeholderGradient ?? '#9ccf7a' }} />}
      {/* prise pendant « Good night » : le même ciel que le décor (bleu nuit, lune, étoiles), pas un décor de jour assombri */}
      {photo.night && <BedtimeSky />}
      {photo.g.map((g, i) => {
        const def = giftDef(g.id);
        if (!def) return null;
        return (
          <span key={`${g.id}${i}`} className="ps-gift" style={{ height: `${g.h * def.h}%`, aspectRatio: String(def.ratio), transform: `translate(${g.x}cqw, ${(g.y * 9) / 16}cqw) translate(-50%, -100%)`, zIndex: Math.round(g.y) }}>
            <img src={giftUrl(g.id)} alt="" draggable={false} loading="lazy" />
          </span>
        );
      })}
      {photo.a.map((a) => {
        const sprite = snapSprite(photo.sp, a);
        const natural = rigFor(sprite?.path.split('/').pop()?.replace(/\.\w+$/, ''))?.facing ?? 1;
        return (
          <span key={`${a.who}${a.birthOrder ?? ''}`} className="ps-char" style={{ height: `${a.h}%`, transform: `translate(${a.x}cqw, ${(a.y * 9) / 16}cqw) translate(-50%, -100%)`, zIndex: Math.round(a.y) }}>
            {sprite ? (
              <img src={assetUrl(sprite)} alt="" draggable={false} loading="lazy" style={a.f !== natural ? { transform: 'scaleX(-1)' } : undefined} />
            ) : (
              <span className="ps-icon">{sp?.icon}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Espace perso de la joueuse : l'album 📷, rangé par animal (demande du parent, 2026-11-25). Toucher une photo
 * l'ouvre en grand ; on peut la retirer de l'album.
 */
export function PhotoAlbum({ state, setState, current, onClose }: { state: GameState; setState: (fn: (s: GameState) => GameState) => void; current?: string; onClose: () => void }) {
  const fr = state.settings.frenchHelp;
  const families = useMemo(() => {
    const counts = new Map(albumFamilies(state).map((f) => [f.speciesId, f.count]));
    // dans l'ordre du jeu (continents), seulement les animaux connus qui ont des photos
    return SPECIES.filter((s) => counts.has(s.id)).map((s) => ({ sp: s, count: counts.get(s.id)! }));
  }, [state]);
  const [pick, setPick] = useState<string | undefined>(() => (current && families.some((f) => f.sp.id === current) ? current : families[0]?.sp.id));
  const shown = pick && families.some((f) => f.sp.id === pick) ? pick : families[0]?.sp.id;
  const photos = useMemo(() => (shown ? familyPhotos(state, shown) : []), [state, shown]);
  const [open, setOpen] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  const big = open !== null ? photos[open] : undefined;
  useEffect(() => setConfirm(false), [open]);
  // la photo ouverte vient d'être retirée (ou n'existe plus) : retour à la grille
  useEffect(() => {
    if (open !== null && !photos[open]) setOpen(photos.length ? Math.min(open, photos.length - 1) : null);
  }, [open, photos]);

  return (
    <div className="screen panel-screen">
      <div className="panel album-panel">
        <div className="picker-head">
          <h2>📷 My photos {fr && <small>· Mes photos</small>}</h2>
          <button className="round" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {families.length === 0 ? (
          <p className="album-empty">
            <span className="album-empty-icon" aria-hidden="true">📷</span>
            Take photos of your animals!
            {fr && <small>Touche 📷 dans le décor d’un animal pour le prendre en photo.</small>}
          </p>
        ) : (
          <>
            <div className="album-tabs" role="tablist" aria-label="Animals">
              {families.map(({ sp, count }) => {
                const art = spriteFor(sp.id, { role: 'father' });
                return (
                  <button
                    key={sp.id}
                    role="tab"
                    aria-selected={sp.id === shown}
                    className={`album-tab${sp.id === shown ? ' on' : ''}`}
                    onClick={() => {
                      setPick(sp.id);
                      setOpen(null);
                      void speech.speak(say.speciesPick(sp));
                    }}
                  >
                    {art ? <img src={assetUrl(art)} alt="" draggable={false} /> : <span aria-hidden="true">{sp.icon}</span>}
                    <span className="album-tab-name">{sp.nameEn}</span>
                    <span className="album-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="album-grid">
              {photos.map((p, i) => (
                <button key={p.id} className="album-thumb" onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}, ${PLACES[p.p]?.nameEn ?? ''}`}>
                  <PhotoScene photo={p} />
                </button>
              ))}
            </div>
            {shown && photos.length >= ALBUM_MAX_PER_FAMILY && (
              <p className="album-full">{fr ? `Album plein pour ${getSpecies(shown).nameFr} (${ALBUM_MAX_PER_FAMILY} photos) : retire une photo pour en prendre une nouvelle.` : `${ALBUM_MAX_PER_FAMILY} photos!`}</p>
            )}
          </>
        )}
      </div>

      {big && open !== null && (
        <div className="album-view" role="dialog" aria-label="Photo">
          <div className="album-view-frame">
            <PhotoScene photo={big} className="big" />
            <span className="album-view-place">{PLACES[big.p]?.nameEn}</span>
          </div>
          <div className="album-view-bar">
            <button className="round album-nav" onClick={() => setOpen(open - 1)} disabled={open === 0} aria-label="Previous">‹</button>
            {confirm ? (
              <span className="album-confirm">
                {fr ? 'Retirer cette photo ?' : 'Remove it?'}
                <button
                  className="album-yes"
                  onClick={() => {
                    setState((s) => deletePhoto(s, big.id));
                    setConfirm(false);
                  }}
                >
                  ✓ {fr ? 'Oui' : 'Yes'}
                </button>
                <button className="album-no" onClick={() => setConfirm(false)}>✕ {fr ? 'Non' : 'No'}</button>
              </span>
            ) : (
              <button className="album-del" onClick={() => setConfirm(true)} aria-label="Remove the photo">🗑️</button>
            )}
            <button className="round album-nav" onClick={() => setOpen(open + 1)} disabled={open >= photos.length - 1} aria-label="Next">›</button>
            <button className="round album-close" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
