import { useEffect, useState } from 'react';
import { speech } from '../audio/speech';
import { DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { isStaticSite } from '../engine/access';
import { NAME_API, NAME_POLL_MS, parseNameStatus, type NamePron, type NameVoiceStatus } from '../engine/nameVoice';

/** État des voix du prénom, pour l'Espace parents. */
export type NameVoiceState = NameVoiceStatus | { status: 'none' };

const apiUrl = (path: string) => `${import.meta.env.BASE_URL}${NAME_API}/${path}`;
/** version en ligne : pas d'ordinateur derrière, le prénom n'est envoyé nulle part */
const PC_SERVER = !isStaticSite(import.meta.env);

/**
 * Demande à l'ordinateur les phrases dites avec le prénom de la joueuse, et redemande tant
 * qu'il les enregistre. Sans ordinateur, rien ne change : les phrases restent dites sans prénom.
 */
export function useNameVoices(name: string, pron: NamePron | null): NameVoiceState {
  const request = PC_SERVER && pron && name !== DEFAULT_PLAYER_NAME ? JSON.stringify({ name, pron }) : null;
  const [state, setState] = useState<NameVoiceState>({ status: 'none' });

  useEffect(() => {
    speech.setNameVoice(name, null);
    setState({ status: 'none' });
    if (!request) return;
    let live = true;
    let timer: number | undefined;
    const ask = async () => {
      let st: NameVoiceStatus = { status: 'unavailable' };
      try {
        const r = await fetch(apiUrl('voices'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: request, cache: 'no-store' });
        st = parseNameStatus(await r.json());
      } catch {
        /* pas d'ordinateur : phrases sans prénom */
      }
      if (!live) return;
      setState(st);
      if (st.status === 'ready') speech.setNameVoice(name, st.clips);
      else if (st.status === 'working') timer = window.setTimeout(() => void ask(), NAME_POLL_MS);
    };
    void ask();
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    // `request` contient déjà le prénom et la prononciation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  return state;
}

/** Les essais d'écoute : « Hello, <prénom>! » dit à la française, à l'anglaise et comme écrit. */
export async function fetchNamePreview(name: string, spelling: string | null): Promise<Partial<Record<'fr' | 'en' | 'spelled', string>> | null> {
  if (!PC_SERVER) return null;
  try {
    const r = await fetch(apiUrl('preview'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, spelling }), cache: 'no-store' });
    if (!r.ok) return null;
    const data = (await r.json()) as Record<string, unknown>;
    const out: Partial<Record<'fr' | 'en' | 'spelled', string>> = {};
    for (const m of ['fr', 'en', 'spelled'] as const) if (typeof data[m] === 'string') out[m] = `${import.meta.env.BASE_URL}${data[m] as string}`;
    return out;
  } catch {
    return null;
  }
}
