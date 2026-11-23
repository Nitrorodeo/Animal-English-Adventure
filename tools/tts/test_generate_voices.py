"""Tests du générateur de voix : tools/tts/.venv/Scripts/python -m unittest tools/tts/test_generate_voices.py"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_voices as g  # noqa: E402


class FakeKokoro:
    """Rend 1 s de son par phrase, à 24 kHz, en notant la vitesse demandée."""

    def __init__(self):
        self.calls = []

    def create(self, text, voice, speed, lang):
        self.calls.append((text, voice, speed, lang))
        t = np.linspace(0, 1, 24000, dtype=np.float32)
        return (0.05 * np.sin(2 * np.pi * 220 * t)).astype(np.float32), 24000


class GenerateVoicesTest(unittest.TestCase):
    def test_parse_voice(self):
        self.assertEqual(g.parse_voice("bf_emma+5"), ("bf_emma", 5.0))
        self.assertEqual(g.parse_voice("bm_daniel"), ("bm_daniel", 0.0))

    def test_split_like_the_game(self):
        self.assertEqual(g.split_sentences("Hello! I'm Leo. Where is… the water?"), ["Hello!", "I'm Leo.", "Where is… the water?"])

    def test_slow_speed_for_all_voices(self):
        k = FakeKokoro()
        g.render(k, "Hello!", "bm_daniel")
        g.render(k, "Hi!", "bf_emma+5")
        self.assertAlmostEqual(k.calls[0][2], g.SPEED)
        self.assertLess(g.SPEED, 0.95)
        # voix rajeunie : on parle encore plus lentement avant de rééchantillonner
        self.assertAlmostEqual(k.calls[1][2], g.SPEED / 2 ** (5 / 12))
        self.assertEqual(k.calls[1][3], "en-gb")

    def test_pause_between_sentences(self):
        one, sr = g.render(FakeKokoro(), "Hello!", "bm_daniel")
        two, _ = g.render(FakeKokoro(), "Hello! Hello!", "bm_daniel")
        self.assertAlmostEqual(len(two) - 2 * len(one), int(g.SENTENCE_PAUSE * sr), delta=2)

    def test_louder_and_never_clipped(self):
        out, _ = g.render(FakeKokoro(), "Hello!", "bm_daniel")
        voiced = out[np.abs(out) > 0.01]
        rms_db = 20 * np.log10(np.sqrt(np.mean(voiced ** 2)))
        self.assertGreater(rms_db, -20)  # l'entrée était à ≈ -29 dB
        self.assertLessEqual(np.max(np.abs(out)), 10 ** (g.PEAK_DB / 20) + 1e-6)


class ArchiveTest(unittest.TestCase):
    """Consigne du parent (2026-11-23) : jamais régénérer une phrase inchangée, jamais effacer une voix."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.out, self.arc = root / "voice", root / "archive"
        self.out.mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def put(self, folder, voice, spoken, data=b"son"):
        folder.mkdir(exist_ok=True)
        name = g.file_name(voice, spoken)
        (folder / name).write_bytes(data)
        return name

    def test_unchanged_line_is_never_rendered_again(self):
        kept = self.put(self.out, "bm_daniel", "Hello!")
        plan = g.make_plan([{"voice": "bm_daniel", "key": "k1", "spoken": "Hello!"}, {"voice": "bf_emma", "key": "k2", "spoken": "Find Daddy!"}], self.out, self.arc)
        self.assertEqual(plan.present, [kept])
        self.assertEqual(plan.render, [g.file_name("bf_emma", "Find Daddy!")])
        self.assertEqual(plan.archive, [])

    def test_same_voice_same_text_makes_one_file(self):
        lines = [{"voice": "bm_daniel", "key": k, "spoken": "Hello!"} for k in ("a", "b", "c")]
        plan = g.make_plan(lines, self.out, self.arc)
        self.assertEqual(len(plan.render), 1)
        self.assertEqual(len(set(plan.clips.values())), 1)

    def test_unused_voice_is_archived_not_deleted(self):
        old = self.put(self.out, "bm_daniel", "Old line.", b"ancien")
        plan = g.make_plan([], self.out, self.arc)
        self.assertEqual(plan.archive, [old])
        self.assertTrue((self.out / old).exists(), "le plan seul ne déplace rien")
        self.assertEqual(g.archive_unused(plan, self.out, self.arc, today="2026-11-23"), 1)
        self.assertFalse((self.out / old).exists())
        self.assertEqual((self.arc / old).read_bytes(), b"ancien")
        index = json.loads((self.arc / "index.json").read_text(encoding="utf-8"))
        self.assertEqual(index[old]["archived"], "2026-11-23")

    def test_returning_line_comes_back_from_archive(self):
        name = self.put(self.arc, "bf_emma", "Where is Mommy?", b"archive")
        plan = g.make_plan([{"voice": "bf_emma", "key": "k", "spoken": "Where is Mommy?"}], self.out, self.arc)
        self.assertEqual(plan.restore, [name])
        self.assertEqual(plan.render, [])
        g.restore_from_archive(plan, self.out, self.arc)
        self.assertEqual((self.out / name).read_bytes(), b"archive")
        self.assertTrue((self.arc / name).exists(), "l'archive garde sa copie")

    def test_archive_never_overwrites_a_different_sound(self):
        name = self.put(self.arc, "bm_daniel", "Bye!", b"premier")
        self.put(self.out, "bm_daniel", "Bye!", b"second")
        plan = g.make_plan([], self.out, self.arc)
        g.archive_unused(plan, self.out, self.arc, today="2026-11-23")
        self.assertEqual((self.arc / name).read_bytes(), b"premier")
        self.assertEqual((self.arc / f"{name[:-4]}.2026-11-23.mp3").read_bytes(), b"second")

    def test_plan_mode_touches_nothing(self):
        old = self.put(self.out, "bm_daniel", "Old.")
        lines = Path(self.tmp.name) / "lines.json"
        lines.write_text(json.dumps([{"voice": "bm_daniel", "key": "k", "spoken": "New!"}]), encoding="utf-8")
        before = sorted(p.name for p in self.out.iterdir())
        orig = (g.HERE, g.OUT, g.ARCHIVE, g.MANIFEST)
        try:
            g.HERE, g.OUT, g.ARCHIVE, g.MANIFEST = Path(self.tmp.name), self.out, self.arc, Path(self.tmp.name) / "manifest.json"
            g.main(["--plan"])
        finally:
            g.HERE, g.OUT, g.ARCHIVE, g.MANIFEST = orig
        self.assertEqual(sorted(p.name for p in self.out.iterdir()), before)
        self.assertTrue((self.out / old).exists())
        self.assertFalse(self.arc.exists())
        self.assertFalse((Path(self.tmp.name) / "manifest.json").exists())

    def test_script_has_no_deletion_of_unused_voices(self):
        src = (Path(g.__file__)).read_text(encoding="utf-8")
        self.assertNotIn("f.unlink()", src, "les voix inutilisées sont archivées, jamais effacées")


if __name__ == "__main__":
    unittest.main()
