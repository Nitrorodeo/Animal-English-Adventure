"""Débit réel de chaque voix enregistrée (syllabes par seconde), pour régler VOICE_PACE (src/audio/voiceKey.ts).

  tools/tts/.venv/Scripts/python.exe tools/tts/mesurer_debit.py .
"""
import json, re, random, sys, collections
import soundfile as sf
root = sys.argv[1]
d = json.load(open(root + '/src/content/voiceManifest.json', encoding='utf-8'))['clips']
by = collections.defaultdict(list)
for k, v in d.items():
    voice, text = k.split('|', 1)
    by[voice].append((text, v))
def syl(t):
    return sum(max(1, len(re.findall(r'[aeiouy]+', w.lower()))) for w in re.findall(r"[A-Za-z']+", t))
random.seed(1)
for voice, items in sorted(by.items()):
    sample = random.sample(items, min(600, len(items)))
    rates = []
    for text, path in sample:
        try:
            info = sf.info(root + '/public/' + path)
        except Exception as e:
            continue
        n = syl(text.replace('{name}', 'Explorer'))
        s = text.count('.') + text.count('!') + text.count('?')
        dur = info.duration - 0.35 * max(0, s - 1)  # pauses entre phrases
        if n >= 4 and dur > 0.3: rates.append(n / dur)
    rates.sort()
    if rates:
        print(f"{voice:14} n={len(items):5}  médiane {rates[len(rates)//2]:.2f} syll/s  (p10 {rates[len(rates)//10]:.2f}, p90 {rates[len(rates)*9//10]:.2f})")
