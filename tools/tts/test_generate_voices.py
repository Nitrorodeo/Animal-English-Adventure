"""Tests du générateur de voix : tools/tts/.venv/Scripts/python -m unittest tools/tts/test_generate_voices.py"""
import sys
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


if __name__ == "__main__":
    unittest.main()
