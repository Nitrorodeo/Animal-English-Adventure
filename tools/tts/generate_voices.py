"""Génère les enregistrements Kokoro de toutes les phrases du jeu.

Usage : npm run voices   (exporte d'abord tools/tts/lines.json depuis le code du jeu)
Entrée : tools/tts/lines.json  [{voice, key, spoken}]
Sorties :
  public/audio/voice/<empreinte>.mp3   un fichier par couple (voix, texte parlé)
  src/content/voiceManifest.json       {version, clips: {clé: chemin}}
Incrémental : un fichier déjà présent n'est pas régénéré ; les fichiers qui ne servent plus
sont supprimés (uniquement dans public/audio/voice/, dossier entièrement généré par ce script).
Tout tourne en local, sans internet, une fois le modèle placé dans tools/tts/models/.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "public" / "audio" / "voice"
MANIFEST = ROOT / "src" / "content" / "voiceManifest.json"
# Réglages d'écoute (le parent, 2026-11-18 : « plus lente et audible » pour une enfant de 7 ans).
SPEED = 0.8  # débit de toutes les voix (1.0 = débit naturel de Kokoro)
SENTENCE_PAUSE = 0.35  # secondes de silence entre deux phrases d'une même réplique
TARGET_RMS_DB = -16.0  # volume moyen visé, identique pour toutes les voix
PEAK_DB = -1.0  # crête maximale, pour ne jamais saturer
# Bump pour tout régénérer si le réglage de voix change (vitesse, découpe des silences…).
RENDER_VERSION = "2"


def lang_of(voice: str) -> str:
    return "en-gb" if voice.startswith("b") else "en-us"


def parse_voice(voice: str) -> tuple[str, float]:
    """« bf_emma+5 » → (« bf_emma », 5 demi-tons de rajeunissement)."""
    base, _, semis = voice.partition("+")
    return base, float(semis or 0)


def split_sentences(text: str) -> list[str]:
    """Même découpe que splitSentences() dans src/audio/voiceKey.ts."""
    return [t for t in re.split(r"(?<=[.!?])\s+", text.strip()) if t]


def trim(samples: np.ndarray, sr: int, threshold: float = 0.01, pad: float = 0.08) -> np.ndarray:
    """Retire les silences de début et de fin (garde une courte marge)."""
    idx = np.flatnonzero(np.abs(samples) > threshold)
    if idx.size == 0:
        return samples
    p = int(pad * sr)
    return samples[max(0, idx[0] - p): min(len(samples), idx[-1] + p)]


def normalize(samples: np.ndarray) -> np.ndarray:
    """Même volume pour toutes les phrases et toutes les voix, sans saturation."""
    voiced = samples[np.abs(samples) > 0.01]
    if voiced.size == 0:
        return samples
    rms = float(np.sqrt(np.mean(voiced ** 2)))
    gain = 10 ** (TARGET_RMS_DB / 20) / rms
    peak = float(np.max(np.abs(samples))) * gain
    limit = 10 ** (PEAK_DB / 20)
    if peak > limit:
        gain *= limit / peak
    return (samples * gain).astype(np.float32)


def render_sentence(kokoro: Kokoro, text: str, voice: str) -> tuple[np.ndarray, int]:
    """Voix rajeunie : on fait parler plus lentement, puis on rééchantillonne. La hauteur et le
    timbre montent ensemble (conduit vocal plus petit) et le débit revient à SPEED."""
    base, semis = parse_voice(voice)
    factor = 2 ** (semis / 12)
    samples, sr = kokoro.create(text, voice=base, speed=SPEED / factor, lang=lang_of(base))
    if semis:
        n = int(len(samples) / factor)
        samples = np.interp(np.linspace(0, len(samples) - 1, n), np.arange(len(samples)), samples).astype(np.float32)
    return trim(samples, sr), sr


def render(kokoro: Kokoro, text: str, voice: str) -> tuple[np.ndarray, int]:
    """Une réplique : chaque phrase dite séparément, avec une pause nette entre elles."""
    parts: list[np.ndarray] = []
    sr = 24000
    for i, sentence in enumerate(split_sentences(text)):
        samples, sr = render_sentence(kokoro, sentence, voice)
        if i:
            parts.append(np.zeros(int(SENTENCE_PAUSE * sr), dtype=np.float32))
        parts.append(samples)
    return normalize(np.concatenate(parts)), sr


def file_name(voice: str, spoken: str) -> str:
    h = hashlib.sha1(f"{RENDER_VERSION}|{voice}|{spoken}".encode("utf-8")).hexdigest()[:12]
    return f"{h}.mp3"


def main() -> None:
    lines = json.loads((HERE / "lines.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(HERE / "models" / "kokoro-v1.0.onnx"), str(HERE / "models" / "voices-v1.0.bin"))

    clips: dict[str, str] = {}
    wanted: set[str] = set()
    made = skipped = 0
    t0 = time.time()
    for i, e in enumerate(lines, 1):
        name = file_name(e["voice"], e["spoken"])
        clips[e["key"]] = f"audio/voice/{name}"
        if name in wanted:
            continue
        wanted.add(name)
        path = OUT / name
        if path.exists():
            skipped += 1
            continue
        samples, sr = render(kokoro, e["spoken"], e["voice"])
        sf.write(path, samples, sr, format="MP3")
        made += 1
        if made % 25 == 0:
            print(f"[{i}/{len(lines)}] {made} créés ({time.time() - t0:.0f} s)", flush=True)

    removed = 0
    for f in OUT.glob("*.mp3"):
        if f.name not in wanted:
            f.unlink()
            removed += 1

    MANIFEST.write_text(json.dumps({"version": 1, "clips": dict(sorted(clips.items()))}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    size = sum(f.stat().st_size for f in OUT.glob("*.mp3")) / 1e6
    print(f"terminé : {made} créés, {skipped} déjà présents, {removed} supprimés, {len(wanted)} fichiers, {size:.1f} Mo, {time.time() - t0:.0f} s")


if __name__ == "__main__":
    sys.exit(main())
