/**
 * Activités de famille : présenter la famille, se souvenir d'une aventure, aider son frère
 * ou sa sœur. Les parents et les bébés parlent avec leur propre voix.
 */
import { ADVENTURES, TREASURES } from '../adventures';
import { PLACES } from '../places';
import { PROPS } from '../props';
import type { ActivityDef, QuestStep } from '../types';
import { anchor, ask, back, end, heShe, L, moveTo, nameable, no, ok, say, sibWord, tap } from './kit';
import { babySex, other } from './games';

// ---------------------------------------------------------------------------
// 2.1 — Présenter la famille
// ---------------------------------------------------------------------------

export const familyPresentation: ActivityDef = {
  id: 'family_presentation',
  choices: () => ['family'],
  build(c) {
    const f = c.species.father.name;
    const m = c.species.mother.name;
    const sex = babySex(c);
    const sib = sex ? sibWord(other(sex)) : L('brother', 'frère');
    const sibSex = sex ? other(sex) : 'boy';
    return [
      say('father', `Hello! I'm ${f}. I'm the dad!`, `Bonjour ! Je suis ${f}. Je suis le papa !`, {}, 'happy'),
      say('mother', `And I'm ${m}. I'm the mum!`, `Et moi, je suis ${m}. Je suis la maman !`, {}, 'love'),
      ask('father', 'Who am I? The mum or the dad?', 'Qui suis-je ? La maman ou le papa ?', [ok("You're the dad!", 'Tu es le papa !', '👨'), no("You're the mum!", 'Tu es la maman !', '👩')], [`I'm ${f}, the dad!`, `Je suis ${f}, le papa !`], ['dad'], { keepOrder: true, onCorrect: L("Yes! I'm the dad!", 'Oui ! Je suis le papa !') }),
      ask('mother', 'And who am I?', 'Et moi, qui suis-je ?', [ok("You're the mum!", 'Tu es la maman !', '👩'), no("You're the dad!", 'Tu es le papa !', '👨'), no("You're the baby!", 'Tu es le bébé !', '👶')], [`I'm ${m}, the mum!`, `Je suis ${m}, la maman !`], ['mum'], { minTier: 'intermediate', onCorrect: L("Yes! I'm the mum!", 'Oui ! Je suis la maman !') }),
      say('baby', "And I'm the baby! Hello!", 'Et moi, je suis le bébé ! Coucou !', { needs: 'baby' }, 'happy'),
      ask('baby', 'Who am I?', 'Qui suis-je ?', [ok("You're the baby!", 'Tu es le bébé !', '👶'), no("You're the dad!", 'Tu es le papa !', '👨'), no("You're the mum!", 'Tu es la maman !', '👩')], ["I'm small. I'm the baby!", 'Je suis petit. Je suis le bébé !'], ['baby'], { needs: 'baby', onCorrect: L("Yes! I'm the baby!", 'Oui ! Je suis le bébé !') }),
      say('baby', `This is my ${sib.en}, {siblingName}!`, `Voici mon ${sib.fr}, {siblingName} !`, { needs: 'sibling' }, 'love'),
      ask('sibling', 'Hello! Am I a boy or a girl?', 'Coucou ! Suis-je un garçon ou une fille ?', [ok(sibSex === 'boy' ? "You're a boy!" : "You're a girl!", sibSex === 'boy' ? 'Tu es un garçon !' : 'Tu es une fille !', sibSex === 'boy' ? '💙' : '💗'), no(sibSex === 'boy' ? "You're a girl!" : "You're a boy!", sibSex === 'boy' ? 'Tu es une fille !' : 'Tu es un garçon !', sibSex === 'boy' ? '💗' : '💙')], [`I'm the ${sib.en}!`, `Je suis le ${sib.fr} !`], [sibSex === 'boy' ? 'its_a_boy' : 'its_a_girl', sib.en], { keepOrder: true, needs: 'sibling', minTier: 'intermediate', onCorrect: L(`Yes! I'm a ${sibSex}!`, `Oui ! Je suis ${sibSex === 'boy' ? 'un garçon' : 'une fille'} !`) }),
      ask('father', 'And you? Do you have a brother or a sister?', 'Et toi ? Tu as un frère ou une sœur ?', [ok('I have a brother!', "J'ai un frère !", '👦'), ok('I have a sister!', "J'ai une sœur !", '👧'), ok("No, I don't.", 'Non.', '🙂')], ['You can tell us about your family!', 'Tu peux nous parler de ta famille !'], ['brother', 'sister'], { keepOrder: true, minTier: 'expert', onCorrect: L('Thank you for telling us!', 'Merci de nous le dire !') }),
      end('mother', 'We love our family!', "Nous aimons notre famille !"),
    ];
  },
  memoryEvent: () => 'met_family',
};

// ---------------------------------------------------------------------------
// 3.5 — Se souvenir (passé simple : « We found… », « We ate… »)
// ---------------------------------------------------------------------------

export const rememberYesterday: ActivityDef = {
  id: 'remember_yesterday',
  choices: (c) =>
    c.memories.filter((m) => {
      if (m.startsWith('adventure:')) return !!ADVENTURES.find((a) => a.id === m.slice(10) && a.continentId === c.place.continentId);
      if (m.startsWith('ate:')) return !!PROPS[m.slice(4)]?.eat;
      if (m.startsWith('found_water:')) return !!PLACES[m.slice(12)];
      return false;
    }),
  build(_c, _tier, choice) {
    let question: QuestStep | undefined;
    if (choice.startsWith('adventure:')) {
      const adv = ADVENTURES.find((a) => a.id === choice.slice(10));
      const t = adv && TREASURES[adv.treasure];
      if (!t) return undefined;
      const others = Object.values(TREASURES).filter((x) => x.id !== t.id);
      const start = t.id.length % Math.max(1, others.length);
      const wrong = [others[start], others[(start + 3) % others.length]].filter((x, i, arr) => x && arr.indexOf(x) === i);
      question = ask('actor', 'Remember our adventure? What did we find?', 'Tu te souviens de notre aventure ? Qu’avons-nous trouvé ?', [ok(`We found ${t.nameEn}!`, `Nous avons trouvé ${t.nameFr} !`, t.icon), ...wrong.map((x) => no(`We found ${x!.nameEn}!`, `Nous avons trouvé ${x!.nameFr} !`, x!.icon)), no('We found a car!', 'Nous avons trouvé une voiture !', '🚗')], ['Look in your passport!', 'Regarde dans ton passeport !'], ['remember', 'we_found'], { onCorrect: L(`Yes! We found ${t.nameEn}!`, `Oui ! Nous avons trouvé ${t.nameFr} !`) });
    } else if (choice.startsWith('ate:')) {
      const p = PROPS[choice.slice(4)];
      if (!p?.eat) return undefined;
      question = ask('actor', 'Remember? We ate something yummy. What did we eat?', 'Tu te souviens ? Nous avons mangé quelque chose de bon. Quoi ?', [ok(`We ate ${p.eat.en}!`, `Nous avons mangé ${p.eat.fr} !`, p.emoji), no('We ate rocks!', 'Nous avons mangé des cailloux !', '🪨'), no('We ate ice cream!', 'Nous avons mangé une glace !', '🍦'), no('We ate pizza!', 'Nous avons mangé une pizza !', '🍕')], [`We ate ${p.eat.en}! Yum!`, `Nous avons mangé ${p.eat.fr} ! Miam !`], ['remember', 'we_ate', p.word], { onCorrect: L(`Yes! We ate ${p.eat.en}! Yum!`, `Oui ! Nous avons mangé ${p.eat.fr} ! Miam !`) });
    } else if (choice.startsWith('found_water:')) {
      question = ask('actor', 'Remember? I was thirsty. What did we find?', "Tu te souviens ? J'avais soif. Qu'avons-nous trouvé ?", [ok('We found water!', "Nous avons trouvé de l'eau !", '💧'), no('We found a car!', 'Nous avons trouvé une voiture !', '🚗'), no('We found pizza!', 'Nous avons trouvé une pizza !', '🍕')], ['I was thirsty… we found water!', "J'avais soif… nous avons trouvé de l'eau !"], ['remember', 'we_found', 'water'], { onCorrect: L('Yes! We found water!', "Oui ! Nous avons trouvé de l'eau !") });
    }
    if (!question) return undefined;
    return [
      say('actor', 'I have a story in my head…', "J'ai une histoire dans la tête…", {}, 'curious'),
      question,
      ask('actor', 'Was it fun?', 'C’était amusant ?', [ok('Yes, it was!', 'Oui !', '😄'), ok('It was great!', "C'était génial !", '🤩')], ['You can say: yes, it was!', 'Tu peux dire : yes, it was!'], ['it_was'], { keepOrder: true, minTier: 'intermediate', onCorrect: L('For me too!', 'Pour moi aussi !') }),
      end('actor', 'I love our memories!', "J'adore nos souvenirs !"),
    ];
  },
};

// ---------------------------------------------------------------------------
// 2.1 / 2.6 — Aider son frère ou sa sœur (le bébé joué + l'autre bébé)
// ---------------------------------------------------------------------------

export const helpSibling: ActivityDef = {
  id: 'help_sibling',
  choices: (c) => (c.actorKind === 'baby' && c.babies.length >= 2 && c.actorSex ? nameable(c.place).filter((a) => a.stand).map((a) => a.id) : []),
  build(c, _tier, choice) {
    const a = anchor(c.place, choice);
    if (!a || !c.actorSex) return undefined;
    const sibSex = other(c.actorSex);
    const sib = sibWord(sibSex);
    const he = heShe(sibSex);
    return [
      ask('sibling', `Oh no! I can't find the ${a.word}! Can you help me?`, `Oh non ! Je ne trouve pas ${a.wordFr} ! Tu peux m'aider ?`, [ok('Yes! I can help you!', 'Oui ! Je peux t’aider !', '🤝'), no('No, goodbye!', 'Non, au revoir !', '🙋')], ['Say yes! We can help!', 'Dis oui ! On peut aider !'], ['help', 'can'], { keepOrder: true, onCorrect: L('Oh, thank you!', 'Oh, merci !'), emotion: 'curious' }),
      tap('sibling', `Where is the ${a.word}?`, `Où est ${a.wordFr} ?`, a.id, [`Look! Find the ${a.word}!`, `Regarde ! Trouve ${a.wordFr} !`], [a.word, 'where']),
      moveTo(a.id, 'walk', 'sibling'),
      say('sibling', `Here it is! I found the ${a.word}!`, `Le voilà ! J'ai trouvé ${a.wordFr} !`, {}, 'happy'),
      back('sibling'),
      ask('sibling', 'Thank you for helping me!', "Merci de m'avoir aidé !", [ok("You're welcome!", 'De rien !', '😊'), no('Goodbye!', 'Au revoir !', '🙋'), no('Hello!', 'Bonjour !', '👋')], ["When someone says thank you, we say: you're welcome!", "Quand on nous dit merci, on répond : you're welcome!"], ['youre_welcome'], { minTier: 'intermediate' }),
      ask('actor', `Is my ${sib.en} happy now?`, `Est-ce que mon ${sib.fr} est content maintenant ?`, [ok(`Yes, ${he.en.toLowerCase()}'s happy!`, `Oui, ${he.fr.toLowerCase()} est content !`, '😄'), no(`No, ${he.en.toLowerCase()}'s sad.`, `Non, ${he.fr.toLowerCase()} est triste.`, '😢')], ['Look at the big smile!', 'Regarde ce grand sourire !'], ['happy', sibSex === 'boy' ? 'he_is' : 'she_is'], { keepOrder: true, minTier: 'expert' }),
      end('actor', 'We help each other. I love you!', "On s'aide. Je t'aime !"),
    ];
  },
  memoryEvent: () => 'helped_sibling',
};
