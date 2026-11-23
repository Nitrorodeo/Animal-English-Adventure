"""Génère les enregistrements Kokoro de toutes les phrases du jeu.

Usage : npm run voices          (exporte d'abord tools/tts/lines.json depuis le code du jeu)
        npm run voices:plan     compte seulement : rien n'est généré, déplacé ni écrit
Entrée : tools/tts/lines.json  [{voice, key, spoken}]
Sorties :
  public/audio/voice/<empreinte>.mp3   un fichier par couple (voix, texte parlé)
  src/content/voiceManifest.json       {version, clips: {clé: chemin}}
  tools/tts/archive/<empreinte>.mp3    voix qui ne servent plus (jamais effacées, hors du site)
  tools/tts/archive/index.json         {empreinte: {archived, voice?, spoken?}}
Incrémental (consigne du parent, 2026-11-23 : « Une phrase inchangée ne doit jamais être régénérée.
Ne supprime pas définitivement les fichiers audio devenus inutilisés. Archive-les. ») :
  - un fichier déjà présent n'est pas régénéré ;
  - une phrase qui revient est reprise de l'archive au lieu d'être régénérée ;
  - un fichier qui ne sert plus est déplacé dans l'archive, jamais effacé.
Tout tourne en local, sans internet, une fois le modèle placé dans tools/tts/models/.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import shutil
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "public" / "audio" / "voice"
MANIFEST = ROOT / "src" / "content" / "voiceManifest.json"
ARCHIVE = HERE / "archive"
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


@dataclass
class Plan:
    """Ce qu'une génération ferait, calculé sans rien toucher."""

    clips: dict[str, str] = field(default_factory=dict)
    # empreinte -> (voix, texte parlé)
    wanted: dict[str, tuple[str, str]] = field(default_factory=dict)
    present: list[str] = field(default_factory=list)
    restore: list[str] = field(default_factory=list)
    render: list[str] = field(default_factory=list)
    archive: list[str] = field(default_factory=list)


def make_plan(lines: list[dict], out_dir: Path, archive_dir: Path) -> Plan:
    plan = Plan()
    for e in lines:
        name = file_name(e["voice"], e["spoken"])
        plan.clips[e["key"]] = f"audio/voice/{name}"
        if name in plan.wanted:
            continue  # même voix, même texte : un seul fichier (pas de doublon)
        plan.wanted[name] = (e["voice"], e["spoken"])
        if (out_dir / name).exists():
            plan.present.append(name)
        elif (archive_dir / name).exists():
            plan.restore.append(name)
        else:
            plan.render.append(name)
    if out_dir.exists():
        plan.archive = sorted(f.name for f in out_dir.glob("*.mp3") if f.name not in plan.wanted)
    return plan


def load_index(archive_dir: Path) -> dict:
    p = archive_dir / "index.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def archive_unused(plan: Plan, out_dir: Path, archive_dir: Path, known: dict[str, tuple[str, str]] | None = None, today: str | None = None) -> int:
    """Déplace dans l'archive les voix qui ne servent plus ; n'efface jamais un son unique."""
    if not plan.archive:
        return 0
    archive_dir.mkdir(parents=True, exist_ok=True)
    index = load_index(archive_dir)
    today = today or datetime.date.today().isoformat()
    for name in plan.archive:
        src, dst = out_dir / name, archive_dir / name
        if not dst.exists():
            shutil.move(src, dst)
        elif dst.read_bytes() == src.read_bytes():
            src.unlink()  # copie identique déjà archivée
        else:
            shutil.move(src, archive_dir / f"{name[:-4]}.{today}.mp3")
        entry: dict = {"archived": today}
        if known and name in known:
            entry["voice"], entry["spoken"] = known[name]
        index[name] = {**index.get(name, {}), **entry}
    (archive_dir / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    return len(plan.archive)


def restore_from_archive(plan: Plan, out_dir: Path, archive_dir: Path) -> int:
    """Une phrase revenue reprend sa voix archivée : pas de nouvelle génération."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in plan.restore:
        shutil.copy2(archive_dir / name, out_dir / name)
    return len(plan.restore)


def describe(plan: Plan) -> str:
    return (
        f"{len(plan.wanted)} voix utiles : {len(plan.present)} déjà présentes, "
        f"{len(plan.restore)} reprises de l'archive, {len(plan.render)} à générer ; "
        f"{len(plan.archive)} à archiver (jamais effacées)"
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Génère les voix du jeu (incrémental, avec archive).")
    parser.add_argument("--plan", action="store_true", help="compte seulement : ne génère, ne déplace et n'écrit rien")
    opts = parser.parse_args(argv)
    lines = json.loads((HERE / "lines.json").read_text(encoding="utf-8"))
    plan = make_plan(lines, OUT, ARCHIVE)
    print(describe(plan), flush=True)
    if opts.plan:
        for name in plan.render[:40]:
            voice, spoken = plan.wanted[name]
            print(f"  à générer  {name}  {voice}  {spoken}")
        if len(plan.render) > 40:
            print(f"  … et {len(plan.render) - 40} autres")
        return

    OUT.mkdir(parents=True, exist_ok=True)
    restored = restore_from_archive(plan, OUT, ARCHIVE)
    t0 = time.time()
    made = 0
    if plan.render:
        kokoro = Kokoro(str(HERE / "models" / "kokoro-v1.0.onnx"), str(HERE / "models" / "voices-v1.0.bin"))
        for name in plan.render:
            voice, spoken = plan.wanted[name]
            samples, sr = render(kokoro, spoken, voice)
            sf.write(OUT / name, samples, sr, format="MP3")
            made += 1
            if made % 25 == 0:
                print(f"[{made}/{len(plan.render)}] créés ({time.time() - t0:.0f} s)", flush=True)

    archived = archive_unused(plan, OUT, ARCHIVE)

    MANIFEST.write_text(json.dumps({"version": 1, "clips": dict(sorted(plan.clips.items()))}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    size = sum(f.stat().st_size for f in OUT.glob("*.mp3")) / 1e6
    print(f"terminé : {made} créés, {restored} repris de l'archive, {len(plan.present)} déjà présents, {archived} archivés, {len(plan.wanted)} fichiers, {size:.1f} Mo, {time.time() - t0:.0f} s")


if __name__ == "__main__":
    sys.exit(main())
