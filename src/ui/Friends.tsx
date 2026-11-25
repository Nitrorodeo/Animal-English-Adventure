import { useEffect, useRef, useState } from 'react';
import { friendAlbumState, type Summary } from '../engine/circle';
import type { AlbumRec } from '../engine/photoAlbum';
import type { GameState } from '../engine/state';
import { PhotoAlbum } from './PhotoAlbum';
import type { CircleInfo } from './useCircle';

/** Une carte = le petit tableau de bord d'un enfant : deux gros chiffres, rien d'autre. */
function Card({ s, you, isNew, fr, onPhotos, note }: { s: Summary; you?: boolean; isNew?: boolean; fr: boolean; onPhotos?: () => void; note?: string }) {
  return (
    <li className={`friend-card${you ? ' you' : ''}`}>
      <span className="friend-name">
        {you ? 'You' : s.name}
        {you && <small> · {s.name}</small>}
        {isNew && <span className="friend-new">✨ New!</span>}
      </span>
      <span className="friend-stat" aria-label={`${s.stars} stars`}>
        <span className="friend-num">⭐ {s.stars}</span>
        <small>
          stars{fr && ' · étoiles'}
        </small>
      </span>
      <span className="friend-stat" aria-label={`${s.adventures} adventures`}>
        <span className="friend-num">🗺️ {s.adventures}</span>
        <small>
          adventures{fr && ' · aventures'}
        </small>
      </span>
      {onPhotos && (
        <button className="friend-photos" onClick={onPhotos} aria-label={`${s.name}’s photos`}>
          📷 Photos{fr && <small> · ses photos</small>}
        </button>
      )}
      {note && <small className="friend-note">{note}</small>}
    </li>
  );
}

/**
 * Les amis (version en ligne) : une carte par enfant du cercle, en ordre alphabétique, la sienne en premier.
 * Aucun classement, aucun message qui compare ; chaque nouvel enfant arrive avec la pastille « New! ».
 */
export function Friends({ circle, settings, onClose }: { circle: CircleInfo; settings: GameState['settings']; onClose: () => void }) {
  const fr = settings.frenchHelp;
  // l'album d'un ami, ouvert en lecture seule (demande du parent, 2026-11-25)
  const [viewing, setViewing] = useState<{ name: string; album: AlbumRec } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const asked = useRef(0);
  const openAlbum = async (id: string, name: string) => {
    const run = ++asked.current;
    setNotes((n) => ({ ...n, [id]: '…' }));
    const r = await circle.friendAlbum(id);
    if (asked.current !== run) return;
    if (r === 'none') setNotes((n) => ({ ...n, [id]: fr ? `${name} n’a pas encore de photo.` : 'No photos yet!' }));
    else if (r === 'offline') setNotes((n) => ({ ...n, [id]: fr ? 'Pas de connexion : réessaie plus tard.' : 'Try again later!' }));
    else {
      setNotes((n) => ({ ...n, [id]: '' }));
      setViewing({ name, album: r });
    }
  };
  // les cartes nouvelles à l'ouverture gardent leur pastille pendant cette visite
  const [fresh] = useState(() => circle.fresh);
  const { see } = circle;
  useEffect(() => {
    if (circle.friends.length > 0) see();
  }, [circle.friends.length, see]);

  // l'album d'un ami prend la place de l'écran des amis ; ✕ y ramène
  if (viewing) return <PhotoAlbum state={friendAlbumState(viewing.album, settings)} setState={() => undefined} owner={viewing.name} onClose={() => setViewing(null)} />;

  return (
    <div className="screen panel-screen">
      <div className="panel">
        <div className="picker-head">
          <h2>🧒 My friends {fr && <small>· Mes amis</small>}</h2>
          <button className="round" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <ul className="friend-cards">
          {circle.me && <Card s={circle.me} you fr={fr} />}
          {circle.friends.map((f) => (
            <Card key={f.id} s={f} isNew={fresh.includes(f.id)} fr={fr} onPhotos={() => void openAlbum(f.id, f.name)} note={notes[f.id] || undefined} />
          ))}
        </ul>
        {circle.friends.length === 0 && (
          <p className="note friend-empty">
            Your friends will appear here! {fr && <>· Tes amis apparaîtront ici dès qu’ils auront rejoint le cercle (espace parents ⚙️).</>}
          </p>
        )}
        {circle.status === 'offline' && <p className="note">Pas de connexion : les cartes se mettront à jour au retour d’internet.</p>}
      </div>
    </div>
  );
}
