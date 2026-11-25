import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { clipFor } from '../audio/clips';
import { ACTIVITIES } from '../content/activities';
import { FAMILY_LINES } from '../content/dialogues';
import { allWhoLines, HAPPY_BIRTHDAY, NIGHT_TIME, photoStory, QUIZ_LINES, QUIZ_START, quizQuestion, quizTargets, whoLine } from '../content/photoTalk';
import { NOUNS, PLACES } from '../content/places';
import { WEATHER_WORDS } from '../content/props';
import { SPECIES } from '../content/species';
import { TIERS, type ActivityCtx, type BiomeDef, type Weather } from '../content/types';
import { BIRTHDAY, CHEESE, MIC, say, WEEK_WORD } from '../content/utterances';
import { WEEK_WORD_CHOICES, weekWordAnchor, weekWordChoice } from '../content/weekWord';
import { CLOUD_MAX_BYTES } from './cloud';
import { ALBUM_MAX_PER_FAMILY, birthdayPhoto, familyPhotos, moveSticker, parseAlbum, PHOTO_STICKERS, PHOTO_STICKERS_MAX, photoStickerArt, resizeSticker, STICKER_SIZE_DEFAULT, STICKER_SIZES, stickOnPhoto, takePhoto, unstickPhoto, type Shot } from './photoAlbum';
import { migrate } from './save';
import { newGameState, type GameState } from './state';
import { activityOffered, FAMILY_CONFIGS, possibleMemories } from './variants';
import { dayWeathers, INDOOR_PLACES, placeWeathers, WEATHER_ACTIVITIES, weatherFx, weatherOfDay, withDayWeather } from './weather';

/**
 * Les 8 idées validées le 2026-11-25 (« tous les 8 ») : photo racontée, « Cheese! » et « Who is in the photo? »,
 * autocollants, anniversaire, livre du bébé, météo du décor, mot de la semaine, micro « Répète après moi ».
 */

const places = Object.values(PLACES);

describe('météo du jour : toujours plausible dans le lieu', () => {
  it('chaque décor garde sa météo dessinée, en premier', () => {
    for (const p of places) expect(placeWeathers(p)[0], p.id).toBe(p.weather);
  });

  it('pas de neige dans la savane, le désert, la jungle ou un lieu chaud : seulement là où il fait froid, ou en Antarctique', () => {
    const coldDrawn: Weather[] = ['cold', 'windy', 'snowy'];
    for (const p of places) {
      if (dayWeathers(p).includes('snowy')) expect(p.continentId === 'antarctica' || coldDrawn.includes(p.weather), p.id).toBe(true);
    }
    for (const p of places.filter((x) => x.continentId === 'africa' || x.continentId === 'oceania' || x.weather === 'hot')) expect(dayWeathers(p), p.id).not.toContain('snowy');
  });

  it('pas de pluie dans le grand froid, en Antarctique, ni dans un lieu brûlant', () => {
    for (const p of places.filter((x) => x.continentId === 'antarctica' || ['cold', 'snowy', 'windy', 'hot'].includes(x.weather))) expect(dayWeathers(p), p.id).not.toContain('rainy');
  });

  it('rien ne tombe dans la grotte de glace (vue de l’intérieur)', () => {
    for (const id of INDOOR_PLACES) {
      const p = PLACES[id]!;
      expect(p, id).toBeDefined();
      expect(dayWeathers(p)).toEqual([p.weather]);
    }
  });

  it('la même journée donne la même météo ; un mois de savane n’est pas toujours pareil', () => {
    const p = places.find((x) => x.continentId === 'africa' && x.weather === 'sunny')!;
    expect(weatherOfDay(p, '2026-11-25')).toBe(weatherOfDay(p, '2026-11-25'));
    const month = new Set(Array.from({ length: 30 }, (_, i) => weatherOfDay(p, `2026-12-${String(i + 1).padStart(2, '0')}`)));
    expect(month.size).toBeGreaterThan(1);
    // le décor du jour ne change que sa météo, et reste le même objet quand il fait le temps dessiné
    for (let i = 1; i <= 30; i++) {
      const day = `2026-12-${String(i).padStart(2, '0')}`;
      const d = withDayWeather(p, day);
      expect(d.weather).toBe(weatherOfDay(p, day));
      if (d.weather === p.weather) expect(d).toBe(p);
      else expect({ ...d, weather: p.weather }).toEqual(p);
    }
  });

  it('plus de pluie automatique (2026-11-25) : aucun décor ne la tire, aucune goutte ne tombe', () => {
    for (const p of places) expect(dayWeathers(p), p.id).not.toContain('rainy');
    expect(weatherFx('rainy')).toBeNull();
  });

  it('ce qui se voit : neige, vent, brume, nuages ; rien quand il fait beau, chaud ou froid', () => {
    expect(weatherFx('snowy')).toBe('snow');
    expect(weatherFx('windy')).toBe('wind');
    expect(weatherFx('misty')).toBe('mist');
    expect(weatherFx('cloudy')).toBe('clouds');
    for (const w of ['sunny', 'hot', 'cold'] as const) expect(weatherFx(w)).toBeNull();
  });

  it('contrôle mécanique : une activité hors WEATHER_ACTIVITIES ne dit rien de nouveau un autre jour (ses phrases sont toutes enregistrées)', () => {
    const configs = [FAMILY_CONFIGS[3]!, FAMILY_CONFIGS[8]!, FAMILY_CONFIGS[11]!];
    const bad = new Set<string>();
    for (const sp of SPECIES) {
      const memories = possibleMemories(sp);
      for (const placeId of sp.allowedBiomes) {
        const place = PLACES[placeId];
        if (!place) continue;
        const others = dayWeathers(place).filter((w) => w !== place.weather);
        if (!others.length) continue;
        for (const config of configs) {
          const base: ActivityCtx = { species: sp, place, actorKind: config.actorKind, babies: config.babies, actorSex: config.actorSex, memories, ...(config.actorKind === 'adult' ? { role: config.role as 'father' | 'mother' } : {}) };
          for (const act of ACTIVITIES) {
            if (WEATHER_ACTIVITIES.has(act.id) || !activityOffered(act.id, placeId, config)) continue;
            const scripts = (ctx: ActivityCtx) => new Set(act.choices(ctx).flatMap((ch) => TIERS.map((t) => JSON.stringify(act.build(ctx, t, ch) ?? null))));
            const drawn = scripts(base);
            for (const w of others) {
              for (const s of scripts({ ...base, place: { ...place, weather: w } })) if (!drawn.has(s)) bad.add(`${act.id} @ ${placeId} ~${w}`);
            }
          }
        }
      }
    }
    expect([...bad]).toEqual([]);
  });

  it('les cadeaux du soir suivent le climat dessiné, pas la météo du jour', () => {
    const habitat: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(habitat).toContain('giftOffer(r.state, species.id, baseBiome, today)');
    expect(habitat).toContain('const biome = useMemo(() => withDayWeather(baseBiome, today), [baseBiome, today]);');
  });
});

// --- photos : météo, anniversaire, autocollants ----------------------------------------------------------------

const shot = (over: Partial<Shot> = {}, dx = 0): Shot => ({
  sp: 'elephant',
  p: 'africa_acacia_plain',
  a: [
    { who: 'father', x: 52.34 + dx, y: 81.41, h: 42.66, f: 1 },
    { who: 'mother', x: 31.3, y: 78.4, h: 40.1, f: -1 },
    { who: 'baby', birthOrder: 1, x: 62.3, y: 85.4, h: 22.7, f: 1, stage: 'little', sex: 'girl' },
    { who: 'baby', birthOrder: 2, x: 72.3, y: 84.4, h: 20.7, f: -1, stage: 'newborn', sex: 'boy' },
  ],
  g: [
    { id: 'ball', x: 44.1, y: 83.2, h: 40.2 },
    { id: 'flower_pot', x: 14.1, y: 80.2, h: 38.2 },
  ],
  ...over,
});
function take(state: GameState, s: Shot, now: number): GameState {
  const r = takePhoto(state, s, now);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

describe('photos : la météo du jour, l’anniversaire, les autocollants', () => {
  it('la photo garde la météo du jour (le beau temps ne coûte rien) et l’anniversaire', () => {
    let s = take(newGameState(), shot({ weather: 'sunny' }), 1_000);
    expect(JSON.stringify(s.player.album)).not.toContain('"w"');
    s = take(s, shot({ weather: 'windy' }), 2_000);
    s = take(s, shot({ weather: 'windy', birthday: 1 }), 3_000);
    const [bday, windy, sunny] = familyPhotos(s, 'elephant');
    expect(sunny!.weather).toBeNull();
    expect(windy!.weather).toBe('windy');
    expect(bday!.birthday).toBe(1);
    expect(birthdayPhoto(s, 'elephant', 1, 'little')?.id).toBe(bday!.id);
    expect(birthdayPhoto(s, 'elephant', 2, 'newborn')).toBeUndefined();
    // même scène, autre temps : c'est une autre photo
    expect(takePhoto(s, shot({ weather: 'cloudy' }), 4_000).ok).toBe(true);
  });

  it('chaque autocollant des photos a son dessin (un vrai WebP carré), montré dans l’album', () => {
    for (const id of PHOTO_STICKERS) {
      const art = photoStickerArt(id)!;
      expect(art).toBe(`assets/ui/stickers/${id}.webp`);
      const bytes: Uint8Array = readFileSync(new URL(`../../public/${art}`, import.meta.url));
      expect(String.fromCharCode(...bytes.slice(0, 4)) + String.fromCharCode(...bytes.slice(8, 12))).toBe('RIFFWEBP');
      expect(bytes.length).toBeLessThan(40_000);
    }
    expect(photoStickerArt('rocket')).toBeUndefined();
    const ui: string = readFileSync(new URL('../ui/PhotoAlbum.tsx', import.meta.url), 'utf8');
    expect(ui.match(/<StickerPic /g)?.length).toBeGreaterThanOrEqual(4);
    expect(ui).not.toMatch(/>\s*\{(s|def|pickedSticker)\.icon\}/);
  });

  it('autocollants : on colle, on retire, 6 au plus ; ils suivent la sauvegarde', () => {
    let s = take(newGameState(), shot(), 1_000);
    const id = familyPhotos(s, 'elephant')[0]!.id;
    for (let i = 0; i < PHOTO_STICKERS_MAX + 2; i++) s = stickOnPhoto(s, id, PHOTO_STICKERS[i % PHOTO_STICKERS.length]!, 10 + i * 9, 20 + i);
    let p = familyPhotos(s, 'elephant')[0]!;
    expect(p.stickers).toHaveLength(PHOTO_STICKERS_MAX);
    expect(p.stickers[0]).toMatchObject({ id: 'heart', icon: '❤️', x: 10, y: 20 });
    s = unstickPhoto(s, id, 0);
    p = familyPhotos(s, 'elephant')[0]!;
    expect(p.stickers).toHaveLength(PHOTO_STICKERS_MAX - 1);
    expect(p.stickers[0]!.id).toBe('star');
    const back = migrate(JSON.parse(JSON.stringify(s)))!;
    expect(familyPhotos(back, 'elephant')).toEqual(familyPhotos(s, 'elephant'));
    // un autocollant inconnu, ou une photo absente : rien ne change
    expect(stickOnPhoto(s, id, 'dragon', 5, 5)).toBe(s);
    expect(stickOnPhoto(s, 'elephant:42', 'heart', 5, 5)).toBe(s);
    // tous retirés : la photo redevient comme avant (aucun champ vide gardé)
    for (let i = 0; i < PHOTO_STICKERS_MAX; i++) s = unstickPhoto(s, id, 0);
    expect(JSON.stringify(s.player.album)).not.toContain('"s"');
  });

  it('autocollants : on les déplace et on change leur taille (demande du parent, 2026-11-25)', () => {
    let s = take(newGameState(), shot(), 1_000);
    const id = familyPhotos(s, 'elephant')[0]!.id;
    s = stickOnPhoto(s, id, 'heart', 10, 20);
    s = stickOnPhoto(s, id, 'star', 30, 40);
    const sticker = (i: number) => familyPhotos(s, 'elephant')[0]!.stickers[i]!;
    expect(sticker(0).size).toBe(STICKER_SIZE_DEFAULT);
    // taille normale partout : aucun champ de taille gardé (les anciennes parties restent identiques)
    expect(JSON.stringify(s.player.album)).not.toContain('"z"');
    // déplacer : seul celui-là bouge, et il reste dans la photo
    s = moveSticker(s, id, 1, 77.6, 12.2);
    expect(sticker(1)).toMatchObject({ id: 'star', x: 78, y: 12 });
    expect(sticker(0)).toMatchObject({ x: 10, y: 20 });
    s = moveSticker(s, id, 1, 140, -20);
    expect(sticker(1).x).toBeLessThanOrEqual(99);
    expect(sticker(1).y).toBeGreaterThanOrEqual(0);
    // rien ne change : même partie (pas de sauvegarde inutile)
    expect(moveSticker(s, id, 1, sticker(1).x, sticker(1).y)).toBe(s);
    expect(moveSticker(s, id, 9, 50, 50)).toBe(s);
    // grandir jusqu'au bout, puis plus rien
    for (let k = 0; k < 10; k++) s = resizeSticker(s, id, 0, 1);
    expect(sticker(0).size).toBe(STICKER_SIZES.length - 1);
    expect(resizeSticker(s, id, 0, 1)).toBe(s);
    expect(JSON.stringify(s.player.album)).toContain('"z"');
    // rapetisser jusqu'au plus petit
    for (let k = 0; k < 10; k++) s = resizeSticker(s, id, 0, -1);
    expect(sticker(0).size).toBe(0);
    expect(resizeSticker(s, id, 0, -1)).toBe(s);
    // la taille et la place suivent la sauvegarde ; retirer garde la taille des autres
    const back = migrate(JSON.parse(JSON.stringify(s)))!;
    expect(familyPhotos(back, 'elephant')).toEqual(familyPhotos(s, 'elephant'));
    s = resizeSticker(s, id, 1, 1);
    s = unstickPhoto(s, id, 0);
    expect(sticker(0)).toMatchObject({ id: 'star', size: STICKER_SIZE_DEFAULT + 1 });
    // revenu à la taille normale : le champ disparaît
    s = resizeSticker(s, id, 0, -1);
    expect(JSON.stringify(s.player.album)).not.toContain('"z"');
  });

  it('une ancienne partie (autocollants sans taille) ou une taille abîmée : les autocollants restent, à la taille normale', () => {
    const old = parseAlbum({ elephant: [{ t: 5, p: 'africa_pond', a: [['f', 10, 80, 30, 1]], s: 'he1020st3040' }] });
    expect(old.elephant![0]!.s).toBe('he1020st3040');
    expect(old.elephant![0]!.z).toBeUndefined();
    const bad = parseAlbum({ elephant: [{ t: 5, p: 'africa_pond', a: [['f', 10, 80, 30, 1]], s: 'he1020st3040', z: '9x' }] });
    expect(bad.elephant![0]!.s).toBe('he1020st3040');
    expect(bad.elephant![0]!.z).toBeUndefined();
  });

  it('l’album : on fait glisser un autocollant, ➖ ➕ 🗑️ ; le nom n’est dit qu’une fois, quand on le choisit', () => {
    const ui: string = readFileSync(new URL('../ui/PhotoAlbum.tsx', import.meta.url), 'utf8');
    const stick = ui.slice(ui.indexOf('const stick = '), ui.indexOf('const pickedSticker'));
    expect(stick).toContain('stickOnPhoto(s, p.id, glue, x, y)');
    expect(stick).not.toContain('speech.speak');
    expect(ui).toContain('onClick={() => { setGlue(id); setPicked(null); void speech.speak(say.sticker(def.en), { slow }); }}');
    expect(ui).toContain('moveSticker(s, big.id, i, x, y)');
    expect(ui).toContain('resizeSticker(s, big.id, picked, -1)');
    expect(ui).toContain('resizeSticker(s, big.id, picked, 1)');
    expect(ui).toContain('unstickPhoto(s, big.id, picked)');
    expect(ui).toContain('onPointerMove');
  });

  it('une sauvegarde abîmée garde la photo, sans la météo ni les autocollants illisibles', () => {
    const album = parseAlbum({ elephant: [{ t: 5, p: 'africa_pond', a: [['f', 10, 80, 30, 1]], w: 99, b: 7, s: 'zz1010he2020x' }] });
    const [r] = album.elephant!;
    expect(r!.w).toBeUndefined();
    expect(r!.b).toBeUndefined();
    expect(r!.t).toBe(5);
  });

  it('pire cas : 100 photos chargées (vent, anniversaire, 6 autocollants) pour CHAQUE animal tiennent sous 70 % de la partie en ligne', () => {
    let s = newGameState();
    for (const sp of SPECIES) {
      for (let i = 0; i < ALBUM_MAX_PER_FAMILY; i++) {
        s = take(s, shot({ sp: sp.id, weather: 'windy', birthday: 2 }, i / 10), 1_795_593_050_008 + i);
        const id = `${sp.id}:${1_795_593_050_008 + i}`;
        for (let k = 0; k < PHOTO_STICKERS_MAX; k++) s = resizeSticker(stickOnPhoto(s, id, 'butterfly', 55, 66), id, k, 3);
      }
    }
    expect(JSON.stringify(migrate(JSON.parse(JSON.stringify(s)))).length).toBeLessThan(CLOUD_MAX_BYTES * 0.7);
  });
});

// --- l'album qui parle -----------------------------------------------------------------------------------------

describe('« Tell me about your photo » et « Who is in the photo? »', () => {
  const s = take(newGameState(), shot({ weather: 'windy' }), 1_000);
  const photo = familyPhotos(s, 'elephant')[0]!;

  it('le récit dit qui est là, où, le temps qu’il fait, puis les cadeaux', () => {
    const story = photoStory(photo).map((l) => l.en);
    expect(story[0]).toBe('Here are Daddy, Mummy and the two babies!');
    expect(story[1]).toBe(say.placeName(PLACES.africa_acacia_plain!));
    expect(story[2]).toBe(WEATHER_WORDS.windy.en);
    expect(story).toHaveLength(5);
    const night = familyPhotos(take(newGameState(), shot({ night: true, birthday: 1 }), 1_000), 'elephant')[0]!;
    expect(photoStory(night).map((l) => l.en).slice(0, 3)).toEqual([HAPPY_BIRTHDAY.en, 'Here are Daddy, Mummy and the two babies!', say.placeName(PLACES.africa_acacia_plain!)]);
    expect(photoStory(night).map((l) => l.en)).toContain(NIGHT_TIME.en);
  });

  it('qui est là : singulier, pluriel, en anglais et en français', () => {
    expect(whoLine(true, false, 0)).toEqual({ en: 'Here is Daddy!', fr: 'Voici papa !' });
    expect(whoLine(false, false, 2)?.en).toBe('Here are the two babies!');
    expect(whoLine(true, true, 1)?.fr).toBe('Voici papa, maman et le bébé !');
    expect(whoLine(false, false, 0)).toBeNull();
    expect(allWhoLines()).toHaveLength(11);
  });

  it('le jeu fait le tour de la famille ; deux bébés se distinguent par « baby girl » / « baby boy »', () => {
    expect(quizTargets(photo).map((t) => t.key)).toEqual(['father', 'mother', 'b1', 'b2']);
    expect(quizTargets(photo).find((t) => t.key === 'b1')?.ask.en).toBe('Where is the baby girl?');
    const asked = new Set(Array.from({ length: 4 }, (_, i) => quizQuestion(photo, i)!.key));
    expect(asked.size).toBe(4);
    const oneBaby = { ...photo, a: photo.a.slice(0, 3) };
    expect(quizTargets(oneBaby).find((t) => t.key === 'b1')?.ask.en).toBe('Where is the baby?');
  });

  it('chaque phrase dite par l’album, la fête et le micro a son enregistrement (sinon : npm run voices)', () => {
    const narrator = [
      ...allWhoLines(),
      NIGHT_TIME,
      HAPPY_BIRTHDAY,
      QUIZ_START,
      ...QUIZ_LINES,
      BIRTHDAY.blow,
      ...BIRTHDAY.count,
      BIRTHDAY.photo,
      WEEK_WORD.intro,
      WEEK_WORD.find,
      WEEK_WORD.found,
      MIC.turn,
      MIC.listen,
      FAMILY_LINES.tryAgain,
      FAMILY_LINES.wellDone,
      ...Object.values(WEATHER_WORDS),
    ];
    const missing = narrator.filter((l) => !clipFor(l.en, 'narrator', [])).map((l) => l.en);
    for (const role of ['father', 'mother', 'girl', 'boy'] as const) if (!clipFor(CHEESE.en, role, [])) missing.push(`${role}: ${CHEESE.en}`);
    for (const role of ['father', 'mother'] as const) if (!clipFor(BIRTHDAY.sing.en, role, [])) missing.push(`${role}: ${BIRTHDAY.sing.en}`);
    for (const w of Object.values(WEATHER_WORDS)) if (!clipFor(w.en, 'father', [])) missing.push(`father: ${w.en}`);
    for (const p of places) for (const l of photoStory({ ...photo, p: p.id, weather: null })) if (!clipFor(l.en, 'narrator', [])) missing.push(l.en);
    expect([...new Set(missing)]).toEqual([]);
  });
});

// --- mot de la semaine, réglages -------------------------------------------------------------------------------

describe('mot de la semaine et « Répète après moi »', () => {
  it('seuls les mots des décors sont proposés, chacun avec les lieux où le trouver', () => {
    expect(WEEK_WORD_CHOICES.length).toBeGreaterThan(20);
    for (const c of WEEK_WORD_CHOICES) {
      expect(NOUNS[c.word], c.word).toBeDefined();
      expect(c.places.length).toBeGreaterThan(0);
      for (const id of c.places) expect(weekWordAnchor(PLACES[id] as BiomeDef, c.word), `${c.word} @ ${id}`).toBeDefined();
    }
    const first = WEEK_WORD_CHOICES[0]!;
    expect(weekWordChoice(first.word)).toBe(first);
    expect(weekWordChoice('dragon')).toBeUndefined();
    expect(weekWordAnchor(PLACES[first.places[0]!] as BiomeDef, undefined)).toBeUndefined();
  });

  it('les réglages se gardent ; un mot inconnu ou un micro non coché ne sont pas gardés', () => {
    const word = WEEK_WORD_CHOICES[0]!.word;
    const s = newGameState();
    const keep = migrate(JSON.parse(JSON.stringify({ ...s, settings: { ...s.settings, weekWord: word, micRepeat: true } })))!;
    expect(keep.settings.weekWord).toBe(word);
    expect(keep.settings.micRepeat).toBe(true);
    const drop = migrate(JSON.parse(JSON.stringify({ ...s, settings: { ...s.settings, weekWord: 'dragon', micRepeat: 'yes' } })))!;
    expect(drop.settings.weekWord).toBeUndefined();
    expect(drop.settings.micRepeat).toBeUndefined();
  });
});

// --- interface (lue dans le code source) ----------------------------------------------------------------------

describe('les 8 idées dans l’interface', () => {
  const habitat: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
  const album: string = readFileSync(new URL('../ui/PhotoAlbum.tsx', import.meta.url), 'utf8');
  const parents: string = readFileSync(new URL('../ui/ParentArea.tsx', import.meta.url), 'utf8');
  const mic: string = readFileSync(new URL('../ui/RepeatMic.tsx', import.meta.url), 'utf8');
  const box: string = readFileSync(new URL('../ui/DialogueBox.tsx', import.meta.url), 'utf8');
  const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

  it('météo : dessinée dans le décor et dans les jeux, figée sur la photo, dite par Papa à l’arrivée', () => {
    expect(habitat).toContain('<WeatherLayer weather={biome.weather} />');
    expect(habitat).toContain('weatherOfDay(place, dayKey(new Date()))');
    expect(album).toContain('<WeatherLayer weather={photo.weather} still />');
    expect(habitat).toContain("{ text: wx.en, opts: { role: 'father' as const } }");
    for (const rule of ['.weather-fx {', '.wx-drop {', '.wx-flake {', '.wx-gust {', '.wx-fog {', '.wx-cloud {', '.weather-fx.still > span {']) expect(css).toContain(rule);
    // au-dessus des animaux, sous les boutons ; jamais un obstacle au doigt
    const rule = css.slice(css.indexOf('.weather-fx {'), css.indexOf('}', css.indexOf('.weather-fx {')));
    expect(rule).toContain('pointer-events: none');
    expect(Number(/z-index: (\d+)/.exec(rule)![1])).toBeLessThan(120);
  });

  it('« Cheese! » au déclic ; la photo emporte la météo du jour', () => {
    expect(habitat).toContain('void speech.speak(CHEESE.en, { role: voiceOf(state, cheeser) });');
    expect(habitat).toContain('weather: biome.weather,');
  });

  it('anniversaire : une bougie par stade, à souffler avant de fermer ; puis la chanson et la photo', () => {
    expect(habitat).toContain('<BirthdayCake candles={grow.candles}');
    expect(habitat).toContain('onClick={() => partyDone && closeParty()}');
    expect(habitat).toContain("makeShot(state, { birthday: grow.birthOrder, night: false })");
    expect(css).toContain('.bday-candle.out .bday-flame');
  });

  it('album : récit, jeu, autocollants, livre du bébé', () => {
    expect(album).toContain('for (const l of photoStory(p))');
    expect(album).toContain('aria-label="Who is in the photo?"');
    expect(album).toContain('stickOnPhoto(s, p.id, glue, x, y)');
    expect(album).toContain('<BabyBook');
    expect(album).toContain('birthdayPhoto(state, speciesId, baby.birthOrder, stage)');
  });

  it('mot de la semaine : choisi par le parent, l’objet brille jusqu’à ce qu’elle le touche', () => {
    expect(parents).toContain('WEEK_WORD_CHOICES.map');
    expect(habitat).toContain("a.id === weekAnchor && !weekFound && !night ? ' week-word' : ''");
    expect(css).toContain('.anchor.week-word {');
  });

  it('micro : coché par le parent, rien d’envoyé ni de gardé (l’enregistrement est effacé après la réécoute)', () => {
    expect(parents).toContain('checked={!!state.settings.micRepeat}');
    expect(habitat).toContain('mic={state.settings.micRepeat ? <RepeatMic');
    expect(box).toContain('{mic}');
    expect(mic).toContain('URL.revokeObjectURL(url)');
    expect(mic).toContain('getTracks().forEach((t) => t.stop())');
    expect(mic).not.toMatch(/fetch\(|localStorage|indexedDB|SpeechRecognition/);
  });
});
