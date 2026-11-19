import { useEffect, useState } from 'react';
import { speech, type VoiceRole } from '../audio/speech';
import { babyVoice } from '../audio/voiceKey';
import { FAMILY_LINES } from '../content/dialogues';
import type { Line, Sex, SpeciesDef } from '../content/types';
import { NAME_ERRORS, SEX_CHOICE } from '../content/utterances';
import { fillLine } from '../engine/dialogue';
import { createBaby, nextBabySex } from '../engine/family';
import type { Baby, FamilyState } from '../engine/state';
import { DialogueBox } from './DialogueBox';
import { assetUrl, spriteFor } from './scene';

interface Props {
  species: SpeciesDef;
  family: FamilyState;
  frenchHelp: boolean;
  slowVoice: boolean;
  onDone: (family: FamilyState | null, baby?: Baby) => void;
}

type Phase = 'intro' | 'surprise' | 'choose' | 'reveal' | 'name' | 'hello' | 'sibling' | 'complete' | 'full';

/**
 * Scène familiale tendre → naissance. Premier bébé : garçon ou fille au choix.
 * Second : automatiquement de l'autre sexe. Au-delà de deux : refus doux.
 */
export function FamilyEvent({ species, family, frenchHelp, slowVoice, onDone }: Props) {
  const forced = nextBabySex(family);
  const isSecond = family.babies.length === 1;
  const [phase, setPhase] = useState<Phase>(forced === 'none' ? 'full' : isSecond ? 'surprise' : 'intro');
  const [sex, setSex] = useState<Sex | null>(forced === 'boy' || forced === 'girl' ? forced : null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ family: FamilyState; baby: Baby } | null>(null);

  const sibling = family.babies[0];
  const vars = { babyName: result?.baby.name ?? '', siblingName: sibling?.name ?? '' };
  const lineOf = (p: Phase): Line => {
    switch (p) {
      case 'intro': return FAMILY_LINES.intro;
      case 'surprise': return isSecond ? FAMILY_LINES.anotherSurprise : FAMILY_LINES.surprise;
      case 'choose': return FAMILY_LINES.boyOrGirl;
      case 'reveal': return sex === 'girl' ? FAMILY_LINES.itsAGirl : FAMILY_LINES.itsABoy;
      case 'name': return FAMILY_LINES.chooseName;
      case 'hello': return FAMILY_LINES.babyHello;
      case 'sibling': return sibling?.sex === 'girl' ? FAMILY_LINES.sister : FAMILY_LINES.brother;
      case 'complete': return isSecond ? FAMILY_LINES.familyComplete : FAMILY_LINES.welcomeBaby;
      case 'full': return FAMILY_LINES.familyComplete;
    }
  };
  const line = fillLine(lineOf(phase), vars);
  const sceneNames = [vars.babyName, vars.siblingName];
  const role: VoiceRole = phase === 'hello' || phase === 'sibling' ? babyVoice(result?.baby.sex ?? sex ?? 'girl') : phase === 'intro' ? 'mother' : 'narrator';

  useEffect(() => {
    void speech.speak(line.en, { role, slow: slowVoice, names: sceneNames });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const next = () => {
    if (phase === 'intro') setPhase('surprise');
    else if (phase === 'surprise') setPhase(sex ? 'reveal' : 'choose');
    else if (phase === 'reveal') setPhase('name');
    else if (phase === 'hello') setPhase(isSecond ? 'sibling' : 'complete');
    else if (phase === 'sibling') setPhase('complete');
    else if (phase === 'complete') onDone(result!.family, result!.baby);
    else if (phase === 'full') onDone(null);
  };

  const submitName = () => {
    if (!sex) return;
    const r = createBaby(family, sex, name, `${species.id}-b${family.babies.length + 1}`);
    if (!r.ok) {
      setError(r.error);
      const msg = NAME_ERRORS[r.error];
      if (msg) void speech.speak(msg.en);
      return;
    }
    setError(null);
    setResult({ family: r.family, baby: r.baby });
    setPhase('hello');
  };

  const father = spriteFor(species.id, { role: 'father' });
  const mother = spriteFor(species.id, { role: 'mother' });
  const babySprite = (s: Sex) => spriteFor(species.id, { sex: s, stage: 'newborn' });
  const shownBaby = sex ? babySprite(sex) : undefined;
  const babyVisible = phase !== 'intro' && phase !== 'full';

  return (
    <div className="family-event" role="dialog" aria-label="La famille">
      {phase !== 'complete' && phase !== 'full' && phase !== 'hello' && phase !== 'sibling' && (
        <button className="skip" onClick={() => setPhase(sex ? 'name' : 'choose')}>Passer ⏭</button>
      )}
      <div className="family-stage">
        <div className="hearts" aria-hidden>{phase === 'intro' ? '💕 💗 💕' : '✨'}</div>
        {father && <img className="fam-parent" src={assetUrl(father)} alt={species.father.name} />}
        {babyVisible && (
          <div className="fam-babies">
            {isSecond && sibling && babySprite(sibling.sex) && <img className="fam-baby" src={assetUrl(babySprite(sibling.sex)!)} alt={sibling.name} />}
            {phase === 'surprise' || phase === 'choose' ? (
              <div className="fam-bundle" aria-hidden>❔</div>
            ) : shownBaby ? (
              <img className="fam-baby new" src={assetUrl(shownBaby)} alt="" />
            ) : (
              <div className="fam-bundle">{species.icon}</div>
            )}
          </div>
        )}
        {mother && <img className="fam-parent" src={assetUrl(mother)} alt={species.mother.name} />}
      </div>

      <DialogueBox speaker={phase === 'hello' || phase === 'sibling' ? result?.baby.name ?? '' : '✨'} line={line} frenchHelp={frenchHelp} onReplay={(slow) => void speech.speak(line.en, { role, slow: slow ?? slowVoice, names: sceneNames })}>
        {phase === 'choose' && (
          <div className="options">
            {(['boy', 'girl'] as const).map((s) => (
              <div className="option" key={s}>
                <button
                  className="option-main"
                  onClick={() => {
                    setSex(s);
                    setPhase('reveal');
                  }}
                >
                  {babySprite(s) ? <img className="opt-img" src={assetUrl(babySprite(s)!)} alt="" /> : <span className="opt-icon">{s === 'boy' ? '👦' : '👧'}</span>}
                  <span className="opt-text">{SEX_CHOICE[s]}</span>
                  {frenchHelp && <span className="fr">{s === 'boy' ? 'Un garçon' : 'Une fille'}</span>}
                </button>
                <button className="listen" aria-label="Écouter" onClick={() => void speech.speak(SEX_CHOICE[s])}>🔊</button>
              </div>
            ))}
          </div>
        )}
        {phase === 'name' && (
          <form
            className="name-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitName();
            }}
          >
            <input autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Prénom du bébé" aria-label="Prénom du bébé" autoComplete="off" />
            <button className="big ok" type="submit">OK ✓</button>
            {error && <p className="name-error">{NAME_ERRORS[error]?.fr}</p>}
          </form>
        )}
        {phase !== 'choose' && phase !== 'name' && (
          <button className="big next" onClick={next} aria-label="Continuer">▶</button>
        )}
      </DialogueBox>
    </div>
  );
}
