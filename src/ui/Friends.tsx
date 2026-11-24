import { useEffect, useState } from 'react';
import type { Summary } from '../engine/circle';
import type { CircleInfo } from './useCircle';

/** Une carte = le petit tableau de bord d'un enfant : deux gros chiffres, rien d'autre. */
function Card({ s, you, isNew, fr }: { s: Summary; you?: boolean; isNew?: boolean; fr: boolean }) {
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
    </li>
  );
}

/**
 * Les amis (version en ligne) : une carte par enfant du cercle, en ordre alphabétique, la sienne en premier.
 * Aucun classement, aucun message qui compare ; chaque nouvel enfant arrive avec la pastille « New! ».
 */
export function Friends({ circle, fr, onClose }: { circle: CircleInfo; fr: boolean; onClose: () => void }) {
  // les cartes nouvelles à l'ouverture gardent leur pastille pendant cette visite
  const [fresh] = useState(() => circle.fresh);
  const { see } = circle;
  useEffect(() => {
    if (circle.friends.length > 0) see();
  }, [circle.friends.length, see]);

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
            <Card key={f.id} s={f} isNew={fresh.includes(f.id)} fr={fr} />
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
