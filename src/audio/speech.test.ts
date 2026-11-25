import { paceOf } from './voiceKey';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { say, SPEED_SAMPLE } from '../content/utterances';

/** Faux lecteur audio : enregistre les lectures, finit à la demande. */
class FakeAudio extends EventTarget {
  static last: FakeAudio;
  src = '';
  playbackRate = 1;
  defaultPlaybackRate = 1;
  preservesPitch = false;
  played: string[] = [];
  private rejectPlay?: (e: Error) => void;
  constructor() {
    super();
    FakeAudio.last = this;
  }
  play() {
    this.played.push(this.src);
    return new Promise<void>((resolve, reject) => {
      this.rejectPlay = reject;
      resolve();
    });
  }
  pause() {
    this.rejectPlay?.(new Error('AbortError'));
  }
  end() {
    this.dispatchEvent(new Event('ended'));
  }
}

const spoken: string[] = [];
class FakeUtterance {
  onend?: () => void;
  onerror?: () => void;
  lang = '';
  rate = 1;
  pitch = 1;
  voice: unknown;
  constructor(public text: string) {}
}

beforeEach(() => {
  spoken.length = 0;
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('window', {
    speechSynthesis: {
      getVoices: () => [],
      cancel: () => undefined,
      speak: (u: FakeUtterance) => {
        spoken.push(u.text);
        queueMicrotask(() => u.onend?.());
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

const load = async () => {
  vi.resetModules();
  const m = await import('./speech');
  await m.voicesReady; // la table des enregistrements arrive à part
  return m.createSpeech();
};
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('lecture des voix', () => {
  it('joue l’enregistrement de la phrase, même avec le prénom de la joueuse', async () => {
    const s = await load();
    s.setNames(['Ava']);
    const p = s.speak(say.title('Ava'));
    await flush();
    expect(FakeAudio.last.played).toHaveLength(1);
    expect(FakeAudio.last.played[0]).toMatch(/audio\/voice\/[0-9a-f]{12}\.mp3$/);
    FakeAudio.last.end();
    await p;
    expect(spoken).toEqual([]);
  });

  it('une phrase coupée par la suivante ne bloque pas la suivante', async () => {
    const s = await load();
    const first = s.speak(say.continent('Africa'));
    await flush();
    const second = s.speak(say.continentPrompt('Africa'));
    await first; // la première se termine dès qu'elle est interrompue
    await flush(); // l'échec tardif de la première lecture arrive ici
    FakeAudio.last.end();
    await second;
    expect(FakeAudio.last.played).toHaveLength(2);
    expect(spoken).toEqual([]); // aucun repli sur la voix de l'appareil
  });

  it('repli sur la voix de l’appareil si la phrase n’est pas enregistrée', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const s = await load();
    await s.speak('A sentence nobody wrote.', { role: 'father' });
    expect(spoken).toEqual(['A sentence nobody wrote.']);
    warn.mockRestore();
  });

  it('100 % = vitesse naturelle : la lecture accélère ou ralentit les enregistrements, hauteur conservée', async () => {
    const s = await load();
    const rateAt = async (speed: number, slow = false) => {
      s.setSpeed(speed);
      const p = s.speak(SPEED_SAMPLE.text, { role: SPEED_SAMPLE.role, slow });
      await flush();
      const r = FakeAudio.last.playbackRate / paceOf(SPEED_SAMPLE.role); // sans la correction propre à la voix
      expect(FakeAudio.last.preservesPitch).toBe(true);
      FakeAudio.last.end();
      await p;
      return r;
    };
    expect(await rateAt(0.8)).toBeCloseTo(1); // défaut = enregistrement tel quel
    expect(await rateAt(1)).toBeCloseTo(1.25); // naturel
    expect(await rateAt(0.5)).toBeCloseTo(0.625);
    expect(await rateAt(1.5)).toBeCloseTo(1.875);
    expect(await rateAt(1, true)).toBeCloseTo(0.9375); // 🐢 en plus
    expect(await rateAt(Number.NaN)).toBeCloseTo(1); // valeur absurde : vitesse des enregistrements
    expect(FakeAudio.last.played.length).toBeGreaterThan(0);
    expect(spoken).toEqual([]);
  });

  it('bouger la barre pendant l’écoute change la vitesse de la phrase en cours', async () => {
    const s = await load();
    s.setSpeed(0.8);
    const p = s.speak(SPEED_SAMPLE.text, { role: SPEED_SAMPLE.role });
    await flush();
    const pace = paceOf(SPEED_SAMPLE.role);
    expect(FakeAudio.last.playbackRate).toBeCloseTo(1 * pace);
    s.setSpeed(1.2);
    expect(FakeAudio.last.playbackRate).toBeCloseTo(1.5 * pace);
    expect(FakeAudio.last.played).toHaveLength(1); // pas de redémarrage
    FakeAudio.last.end();
    await p;
  });

  it('la voix de l’appareil suit aussi la vitesse (1 = naturelle)', async () => {
    const rates: number[] = [];
    const s = await load();
    const synth = (window as unknown as { speechSynthesis: { speak: (u: FakeUtterance) => void } }).speechSynthesis;
    const speak = synth.speak;
    synth.speak = (u) => {
      rates.push(u.rate);
      speak(u);
    };
    s.setSpeed(1.2);
    await s.speak('Bonjour', { lang: 'fr' });
    await s.speak('Bonjour', { lang: 'fr', slow: true });
    expect(rates[0]).toBeCloseTo(1.2);
    expect(rates[1]).toBeCloseTo(0.9);
  });

  it('le français passe par la voix de l’appareil ; muet = silence', async () => {
    const s = await load();
    await s.speak('Bonjour', { lang: 'fr' });
    expect(spoken).toEqual(['Bonjour']);
    s.setMuted(true);
    await s.speak(say.title('Explorer'));
    expect(FakeAudio.last.played).toEqual([]);
  });
});

describe('voix du prénom de la joueuse', () => {
  it('joue la phrase enregistrée avec son prénom quand elle est prête', async () => {
    const s = await load();
    s.setNames(['Chloé', 'Mia']);
    s.setNameVoice('Chloé', { 'bf_isabella|Hello, {name}! Let\'s go on an adventure!': 'api/name/chloe-0000/t.mp3' });
    const p = s.speak(say.title('Chloé'));
    await flush();
    expect(FakeAudio.last.played).toEqual(['/api/name/chloe-0000/t.mp3']);
    FakeAudio.last.end();
    await p;
  });

  it('sans phrase prête (ou pour un bébé), la variante sans prénom', async () => {
    const s = await load();
    s.setNames(['Chloé', 'Mia']);
    s.setNameVoice('Chloé', {});
    const p = s.speak(say.title('Mia'));
    await flush();
    expect(FakeAudio.last.played).toHaveLength(1);
    expect(FakeAudio.last.played[0]).toMatch(/audio\/voice\/[0-9a-f]{12}\.mp3$/);
    FakeAudio.last.end();
    await p;
  });

  it('une suite de répliques s’arrête si l’enfant touche autre chose', async () => {
    const s = await load();
    const seq = s.sequence([{ text: say.hello('Chloé'), opts: { role: 'mother' } }, { text: say.continent('Africa') }]);
    await flush();
    void s.speak(say.continentPrompt('Asia'));
    await seq;
    await flush();
    expect(FakeAudio.last.played).toHaveLength(2); // l'accueil, puis la phrase demandée ; pas « Africa »
  });

  it('quitter l’écran (stop) coupe la suite des répliques : rien n’est dit après', async () => {
    const s = await load();
    const seq = s.sequence([{ text: say.continent('Africa') }, { text: say.continent('Asia') }]);
    await flush();
    expect(FakeAudio.last.played).toHaveLength(1); // « Africa » en cours
    s.stop();
    await seq;
    await flush();
    expect(FakeAudio.last.played).toHaveLength(1); // « Asia » n'est jamais dit
    expect(spoken).toEqual([]);
  });
});
