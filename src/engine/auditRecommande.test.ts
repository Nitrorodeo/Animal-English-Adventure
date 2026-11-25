import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import type { QuestScript } from '../content/types';
import { say } from '../content/utterances';
import { applyQuestOutcome } from './events';
import { newGameState, type Baby, type GameState } from './state';

/** Corrections recommandées par l'audit du 2026-11-25. */
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('deux bébés grandissent dans le même jeu', () => {
  const almost = (id: string, birthOrder: 1 | 2): Baby => ({
    id,
    familyId: 'lion',
    name: id,
    sex: birthOrder === 1 ? 'girl' : 'boy',
    birthOrder,
    stage: 'newborn',
    personality: 'curious',
    taughtWords: {},
    retainedWords: ['a', 'b'],
    seenItems: ['1', '2', '3', '4', '5', '6'],
    activities: ['old_game'],
    questMemory: [],
    milestones: [],
  });

  it('les deux annonces sont gardées, même quand le bébé du jeu est le second de la liste', () => {
    const s0 = newGameState();
    const state: GameState = {
      ...s0,
      families: { lion: { speciesId: 'lion', babies: [almost('mia', 1), almost('leo', 2)], memories: [], parentMemory: { father: [], mother: [] } } as never },
    };
    // le jeu est mené par le second bébé ; le premier y parle aussi (« sibling ») : tous deux grandissent
    const script = { archetypeId: 'zz_two_grow', speciesId: 'lion', biomeId: 'savanna', steps: [{ kind: 'say', speaker: 'sibling', line: { en: 'Hi!' } }] } as unknown as QuestScript;
    const { events } = applyQuestOutcome(state, { script, mechanic: 'talk', actor: { kind: 'baby', speciesId: 'lion', babyId: 'leo' } as never, answers: [], continentId: 'africa' });
    expect(events.grew?.babyId).toBe('leo');
    expect(events.grewOthers?.map((g) => g.babyId)).toEqual(['mia']);
  });
});

describe('une voix qui cale ne bloque plus le jeu', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('un enregistrement qui ne démarre jamais laisse la place à la voix de l’appareil', async () => {
    const spoken: string[] = [];
    class StuckAudio extends EventTarget {
      src = '';
      playbackRate = 1;
      defaultPlaybackRate = 1;
      preservesPitch = false;
      duration = Number.NaN;
      paused = 0;
      play() {
        return new Promise<void>(() => undefined); // le réseau a coupé : ni « ended » ni « error »
      }
      pause() {
        this.paused++;
      }
    }
    vi.stubGlobal('Audio', StuckAudio);
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      onend?: () => void;
      lang = '';
      rate = 1;
      voice: unknown;
      constructor(public text: string) {}
    });
    vi.stubGlobal('window', {
      speechSynthesis: {
        getVoices: () => [],
        cancel: () => undefined,
        speak: (u: { text: string; onend?: () => void }) => {
          spoken.push(u.text);
          queueMicrotask(() => u.onend?.());
        },
      },
    });
    vi.resetModules();
    const m = await import('../audio/speech');
    await m.voicesReady;
    const s = m.createSpeech();
    vi.useFakeTimers();
    let finished = false;
    const line = say.continent('Africa'); // phrase enregistrée
    const p = s.speak(line).then(() => (finished = true));
    await vi.advanceTimersByTimeAsync(m.CLIP_START_MS - 100);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    await vi.runAllTimersAsync();
    await p;
    expect(finished).toBe(true);
    expect(spoken).toEqual([line]);
  });

  it('la page du jeu est servie depuis le cache si le réseau traîne', () => {
    const sw = read('../../tools/pwa/sw-template.js');
    expect(sw).toMatch(/const NAV_TIMEOUT_MS = \d+;/);
    expect(sw).toContain("Promise.race([net, new Promise((r) => setTimeout(r, NAV_TIMEOUT_MS, 'slow'))])");
    expect(sw).toContain('return (await cached()) || (await net);');
  });
});

describe('interface', () => {
  const app = read('../ui/App.tsx');
  const habitat = read('../ui/Habitat.tsx');
  const mic = read('../ui/RepeatMic.tsx');

  it('pendant un jeu, le cadeau ou la fête, le bandeau du haut est en pause', () => {
    expect(habitat).toContain('const busy = running !== null || giftPick !== null || grow !== null;');
    expect(habitat).toContain('useEffect(() => () => onBusy?.(false), [onBusy]);');
    expect(app).toContain('onBusy={setBusy}');
    expect(app.match(/inert=\{paused\}/g)).toHaveLength(2);
    expect(read('../styles.css')).toContain('.topbar.paused .tb-side {');
  });

  it('micro : une nouvelle réplique arrête l’écoute en cours au lieu de couvrir la nouvelle question', () => {
    expect(habitat).toContain('<RepeatMic key={`${q.bubble.who}|${q.bubble.line}`}');
    // chaque attente est suivie d'un contrôle : le micro démonté ne parle plus
    expect(mic).toMatch(/await speech\.speak\(MIC\.turn\.en\);\s*if \(!alive\.current\) return;/);
    expect(mic).toMatch(/await speech\.speak\(MIC\.listen\.en\);\s*if \(!alive\.current\) return;/);
  });
});
