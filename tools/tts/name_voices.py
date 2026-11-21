"""
Voix du prénom de la joueuse : les phrases du jeu qui contiennent {name}, dites avec SON prénom.

Lancé par le serveur du jeu sur l'ordinateur (tools/names/namePlugin.mjs), jamais par la tablette.
Le prénom n'est pas écrit en anglais « à l'aveugle » : on choisit comment il se prononce.

  - fr      : à la française (espeak fr-fr), le cas le plus courant ;
  - en      : à l'anglaise ;
  - spelled : comme le parent l'écrit pour l'oreille (« Ma-é-la »), lu à la française.

La phrase anglaise autour du prénom est phonétisée en anglais, le prénom avec sa propre
prononciation, puis Kokoro dit l'ensemble (is_phonemes=True). Mêmes voix, même débit, même volume
que tools/tts/generate_voices.py.

  python name_voices.py preview  --name Maëla [--spelling Ma-é-la] --out DIR
      → DIR/<mode>.mp3 (« Hello, Maëla! » par la maman) et un JSON {mode: fichier} sur la sortie
  python name_voices.py generate --name Maëla --mode fr [--spelling …] --lines lines.json --tag T --out DIR
      → DIR/<hash>.mp3, DIR/progress.json pendant le travail, DIR/manifest.json à la fin

Tests : tools/tts/.venv/Scripts/python -m unittest tools/tts/test_name_voices.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import generate_voices as g  # noqa: E402

NAME_TOKEN = "{name}"
MODES = ("fr", "en", "spelled")
PREVIEW_TEXT = "Hello, {name}!"
PREVIEW_VOICE = "af_bella"  # la maman (VOICE_OF_ROLE.mother)

# Symboles que Kokoro sait dire (vocabulaire du modèle v1.0) : tout autre caractère est retiré.
VOCAB = set(
    "!\"(),.:;?AIOQSTWYabcdefhijklmnopqrstuvwxyzæçðøŋœɐɑɒɔɕɖəɚɛɜɟɡɣɤɥɨɪɯɰɲɳɴɸɹɻɽɾʁʂʃʈʊʋʌʎʒʔʝʣʤʥʦʧʨʰʲˈˌː̃βθχᵊᵝᵻ—“”…→↓↗↘ꭧ "
)
PUNCT = set("!?.,;:…")


def clean_phonemes(ph: str) -> str:
    """Retire les bascules de langue d'espeak (« (en)…(fr) ») et les symboles inconnus de Kokoro."""
    ph = re.sub(r"\([a-z]{2}(-[a-z]+)?\)", "", ph)
    ph = "".join(c for c in ph if c in VOCAB)
    ph = re.sub(r"ˈ{2,}", "ˈ", ph)
    return re.sub(r"\s+", " ", ph).strip()


def name_lang(mode: str, voice: str) -> str:
    """Langue d'espeak pour le prénom : la voix anglaise de la réplique, ou le français."""
    return g.lang_of(g.parse_voice(voice)[0]) if mode == "en" else "fr-fr"


def name_phonemes(phonemize, name: str, mode: str, spelling: str | None, voice: str) -> str:
    source = spelling if mode == "spelled" and spelling else name
    ph = clean_phonemes(phonemize(source, name_lang(mode, voice)))
    return ph.strip(" " + "".join(PUNCT))


def sentence_phonemes(phonemize, sentence: str, name_ph: str, lang: str) -> str:
    """« Hello, {name}! » → phonèmes anglais de « Hello, » + prénom + « ! »."""
    before, _, after = sentence.partition(NAME_TOKEN)
    pb = clean_phonemes(phonemize(before.strip(), lang)) if before.strip() else ""
    pa = clean_phonemes(phonemize(after.strip(), lang)) if after.strip() else ""
    out = (pb + " " if pb else "") + name_ph
    if pa:
        out += pa if after[:1] in PUNCT else " " + pa
    return out


class Renderer:
    """Rendu d'une réplique où le prénom est dit avec sa prononciation choisie."""

    def __init__(self, kokoro, phonemize, name: str, mode: str, spelling: str | None):
        self.kokoro, self.phonemize = kokoro, phonemize
        self.name, self.mode, self.spelling = name, mode, spelling

    def spoken(self, text: str, voice: str) -> list[tuple[str, bool]]:
        """Phrases à dire : (texte ou phonèmes, True si ce sont des phonèmes)."""
        base = g.parse_voice(voice)[0]
        lang = g.lang_of(base)
        out = []
        for s in g.split_sentences(text):
            if NAME_TOKEN in s:
                nph = name_phonemes(self.phonemize, self.name, self.mode, self.spelling, voice)
                out.append((sentence_phonemes(self.phonemize, s, nph, lang), True))
            else:
                out.append((s, False))
        return out

    def render(self, text: str, voice: str) -> tuple[np.ndarray, int]:
        base, semis = g.parse_voice(voice)
        factor = 2 ** (semis / 12)
        parts: list[np.ndarray] = []
        sr = 24000
        for i, (s, is_ph) in enumerate(self.spoken(text, voice)):
            samples, sr = self.kokoro.create(s, voice=base, speed=g.SPEED / factor, lang=g.lang_of(base), is_phonemes=is_ph)
            if semis:
                n = int(len(samples) / factor)
                samples = np.interp(np.linspace(0, len(samples) - 1, n), np.arange(len(samples)), samples).astype(np.float32)
            if i:
                parts.append(np.zeros(int(g.SENTENCE_PAUSE * sr), dtype=np.float32))
            parts.append(g.trim(samples, sr))
        return g.normalize(np.concatenate(parts)), sr

    def file_name(self, text: str, voice: str) -> str:
        sig = json.dumps(self.spoken(text, voice), ensure_ascii=False)
        h = hashlib.sha1(f"{g.RENDER_VERSION}|{voice}|{sig}".encode("utf-8")).hexdigest()[:12]
        return f"{h}.mp3"


def name_entries(lines: list[dict]) -> list[dict]:
    """Phrases adressées à la joueuse (« player », voir src/audio/voiceCatalog.ts), prénom dit une fois."""
    return [e for e in lines if e.get("player") and e["key"].count(NAME_TOKEN) == 1]


def key_text(key: str) -> str:
    """« voix|texte » → texte."""
    return key.split("|", 1)[1]


def load_kokoro():
    from kokoro_onnx import Kokoro
    from kokoro_onnx.tokenizer import Tokenizer

    kokoro = Kokoro(str(HERE / "models" / "kokoro-v1.0.onnx"), str(HERE / "models" / "voices-v1.0.bin"))
    tok = Tokenizer()
    return kokoro, tok.phonemize


def write_json(path: Path, data) -> None:
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    tmp.replace(path)


def preview(args, kokoro, phonemize) -> dict:
    import soundfile as sf

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    files = {}
    for mode in MODES:
        if mode == "spelled" and not args.spelling:
            continue
        r = Renderer(kokoro, phonemize, args.name, mode, args.spelling)
        samples, sr = r.render(PREVIEW_TEXT, PREVIEW_VOICE)
        sf.write(out / f"{mode}.mp3", samples, sr, format="MP3")
        files[mode] = f"{mode}.mp3"
    return files


def generate(args, kokoro, phonemize) -> dict:
    import soundfile as sf

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    entries = name_entries(json.loads(Path(args.lines).read_text(encoding="utf-8")))
    r = Renderer(kokoro, phonemize, args.name, args.mode, args.spelling)
    clips: dict[str, str] = {}
    for i, e in enumerate(entries):
        text = key_text(e["key"])
        name = r.file_name(text, e["voice"])
        if not (out / name).exists():
            samples, sr = r.render(text, e["voice"])
            sf.write(out / name, samples, sr, format="MP3")
        clips[e["key"]] = name
        if i % 5 == 0:
            write_json(out / "progress.json", {"done": i, "total": len(entries)})
    manifest = {"tag": args.tag, "name": args.name, "mode": args.mode, "spelling": args.spelling, "clips": clips}
    write_json(out / "manifest.json", manifest)
    (out / "progress.json").unlink(missing_ok=True)
    return {"clips": len(clips)}


def main(argv=None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("action", choices=["preview", "generate"])
    p.add_argument("--name", required=True)
    p.add_argument("--mode", choices=MODES, default="fr")
    p.add_argument("--spelling")
    p.add_argument("--lines")
    p.add_argument("--tag", default="")
    p.add_argument("--out", required=True)
    args = p.parse_args(argv)
    kokoro, phonemize = load_kokoro()
    result = preview(args, kokoro, phonemize) if args.action == "preview" else generate(args, kokoro, phonemize)
    print(json.dumps(result, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
