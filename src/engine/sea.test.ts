import { describe, expect, it } from 'vitest';
import { clipFor } from '../audio/speech';
import { itemInfo } from '../content/items';
import { DOLPHINS, SEA_FRIENDS, SEA_HD, SEA_THINGS, TURTLE, WHALE, whaleCount, whaleYes } from '../content/sea';
import { CONTINENTS } from '../content/world';
import { currentRound, INTRO, numberChoices, OUTRO, seaChoose, seaDone, seaNext, seaReward, seaRounds, startSea, type SeaState } from './sea';
import { newGameState } from './state';

/** découpes présentes sur le disque (sans dépendre des types Node) */
const SPRITES = Object.keys(import.meta.glob('/public/assets/sea/*.webp'));

const GAMES = ['whale', 'turtle', 'dolphins'] as const;
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7 + 1);

/** joue toute une partie ; `mistakes` erreurs à chaque manche avant la bonne réponse */
function play(game: (typeof GAMES)[number], seed: number, mistakes = 0): SeaState {
  let { state } = startSea(game, seed);
  state = seaNext(state).state;
  while (!seaDone(state)) {
    const r = currentRound(state)!;
    const wrong = r.choices.find((c) => c.id !== r.answer)!.id;
    for (let k = 0; k < mistakes; k++) state = seaChoose(state, wrong).state;
    state = seaChoose(state, r.answer).state;
    state = seaNext(state).state;
  }
  return state;
}

describe('jeux bonus de la mer : manches', () => {
  it('baleine : 3 manches, 1 à 5 jets, trois nombres qui se suivent dont le bon', () => {
    for (const seed of SEEDS) {
      const rounds = seaRounds('whale', seed);
      expect(rounds).toHaveLength(3);
      expect(new Set(rounds.map((r) => r.splashes)).size).toBe(3);
      for (const r of rounds) {
        const ns = r.choices.map((c) => Number(c.id));
        expect(ns).toContain(r.splashes);
        expect(ns[1]! - ns[0]!).toBe(1);
        expect(Math.min(...ns)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...ns)).toBeLessThanOrEqual(5);
        expect(r.answer).toBe(String(r.splashes));
      }
    }
  });

  it('la bonne carte n’est pas toujours au même endroit', () => {
    const where = new Set<number>();
    for (let n = 1; n <= 5; n++) for (let p = 0; p < 3; p++) where.add(numberChoices(n, p).indexOf(n));
    expect([...where].sort()).toEqual([0, 1, 2]);
  });

  it('tortue : 3 choses différentes à trouver, parmi 3 cartes sans doublon', () => {
    for (const seed of SEEDS) {
      const rounds = seaRounds('turtle', seed);
      expect(new Set(rounds.map((r) => r.answer)).size).toBe(3);
      for (const r of rounds) {
        expect(r.choices).toHaveLength(3);
        expect(new Set(r.choices.map((c) => c.id)).size).toBe(3);
        expect(r.choices.map((c) => c.id)).toContain(r.answer);
      }
    }
  });

  it('dauphins : 4 ordres, deux pour chacun, chaque geste au moins une fois', () => {
    for (const seed of SEEDS) {
      const rounds = seaRounds('dolphins', seed);
      expect(rounds.filter((r) => r.answer === 'big')).toHaveLength(2);
      expect(new Set(rounds.map((r) => r.move))).toEqual(new Set(['jump', 'swim', 'splash']));
      for (const r of rounds) expect(r.prompt.en).toBe(`${r.answer === 'big' ? 'Big' : 'Little'} dolphin, ${r.move}!`);
    }
  });

  it('même graine, même partie (reproductible)', () => {
    for (const g of GAMES) expect(seaRounds(g, 42)).toEqual(seaRounds(g, 42));
  });
});

describe('jeux bonus de la mer : lecteur', () => {
  it('intro, puis chaque manche, puis au revoir', () => {
    for (const g of GAMES) {
      const start = startSea(g, 3);
      expect(start.say[0]!.line).toEqual(INTRO[g]);
      let s = seaNext(start.state);
      expect(s.say[0]!.line).toEqual(s.state.rounds[0]!.prompt);
      // on ne saute pas une manche sans y répondre
      expect(seaNext(s.state).state).toBe(s.state);
      const end = play(g, 3);
      expect(seaDone(end)).toBe(true);
      s = { state: { ...end, index: end.rounds.length - 1, feedback: 'ok' }, say: [] };
      expect(seaNext(s.state).say[0]!.line).toEqual(OUTRO[g]);
    }
  });

  it('baleine : « Oops! Watch again! », puis elle compte avec l’enfant et la bonne carte brille', () => {
    let s = seaNext(startSea('whale', 5).state).state;
    const r = currentRound(s)!;
    const wrong = r.choices.find((c) => c.id !== r.answer)!.id;
    let out = seaChoose(s, wrong);
    expect(out.say[0]!.line).toEqual(WHALE.again);
    expect(out.state.reveal).toBe(false);
    out = seaChoose(out.state, wrong);
    expect(out.say[0]!.line).toEqual(whaleCount(r.splashes!));
    expect(out.state.reveal).toBe(true);
    s = seaChoose(out.state, r.answer).state;
    expect(s.feedback).toBe('ok');
    expect(s.answers).toEqual([
      { items: r.items, correct: false, aided: false },
      { items: r.items, correct: true, aided: true },
    ]);
  });

  it('dauphins : le mauvais dauphin dit « Not me! », le bon fait le geste avec sa voix', () => {
    const s = seaNext(startSea('dolphins', 9).state).state;
    const r = currentRound(s)!;
    const other = r.answer === 'big' ? 'little' : 'big';
    const out = seaChoose(s, other);
    expect(out.say).toEqual([{ voice: DOLPHINS.voice[other], line: DOLPHINS.notMe[other] }]);
    const ok = seaChoose(out.state, r.answer);
    expect(ok.say).toEqual([{ voice: DOLPHINS.voice[r.answer as 'big'], line: DOLPHINS.reply[r.move!] }]);
  });

  it('les mots joués arrivent au passeport', () => {
    for (const g of GAMES) {
      const end = play(g, 11);
      const p = seaReward(newGameState().player, end);
      for (const r of end.rounds) for (const id of r.items) expect(p.items[id]?.correctUnaided, `${g}:${id}`).toBe(1);
    }
  });
});

describe('jeux bonus de la mer : contenu', () => {
  it('chaque mot suivi est connu du passeport', () => {
    for (const g of GAMES) for (const seed of SEEDS) for (const r of seaRounds(g, seed)) for (const id of r.items) expect(itemInfo(id), id).toBeDefined();
  });

  it('les grandes images HD des jeux existent', () => {
    for (const name of Object.values(SEA_HD)) expect(SPRITES, name).toContain(`/public/assets/sea/${name}.webp`);
  });

  it('les découpes existent et sont posées dans la mer, hors des continents', () => {
    for (const f of SEA_FRIENDS) {
      for (const sp of f.sprites) {
        expect(SPRITES, sp.sprite).toContain(`/public/assets/sea/${sp.sprite}.webp`);
        const cx = sp.box.x + sp.box.w / 2;
        const cy = sp.box.y + sp.box.h / 2;
        expect(cx > 0 && cx < 100 && cy > 0 && cy < 100).toBe(true);
      }
    }
    expect(CONTINENTS).toHaveLength(7);
  });

  it('chaque phrase des jeux de la mer est enregistrée dans la bonne voix', () => {
    const lines: [string, Parameters<typeof clipFor>[1]][] = [];
    for (const f of SEA_FRIENDS) lines.push([f.hello.en, f.voice]);
    for (const g of GAMES) {
      const start = startSea(g, 1);
      lines.push([start.say[0]!.line.en, start.say[0]!.voice]);
      for (const seed of SEEDS) {
        let s = seaNext(startSea(g, seed).state).state;
        while (!seaDone(s)) {
          const r = currentRound(s)!;
          lines.push([r.prompt.en, r.promptVoice]);
          for (const c of r.choices) if (c.id !== r.answer) {
            const a = seaChoose(s, c.id);
            const b = seaChoose(a.state, c.id);
            for (const u of [...a.say, ...b.say]) lines.push([u.line.en, u.voice]);
          }
          const ok = seaChoose(s, r.answer);
          for (const u of ok.say) lines.push([u.line.en, u.voice]);
          const n = seaNext(ok.state);
          for (const u of n.say) if (seaDone(n.state)) lines.push([u.line.en, u.voice]);
          s = n.state;
        }
      }
    }
    const missing = [...new Set(lines.filter(([en, v]) => !clipFor(en, v, [])).map(([en, v]) => `${v}: ${en}`))];
    expect(missing).toEqual([]);
  });

  it('textes : nombres au singulier pour 1, une phrase par chose de la tortue', () => {
    expect(whaleYes(1).en).toBe('Yes! One splash!');
    expect(whaleYes(3).en).toBe('Yes! Three splashes!');
    expect(whaleCount(3).en).toBe('One, Two, Three!');
    expect(SEA_THINGS.map((t) => t.find.en)).toEqual(['Find the fish!', 'Find the crab!', 'Find the shell!', 'Find the octopus!']);
    expect(TURTLE.end.en).toMatch(/Bye-bye/);
  });
});
