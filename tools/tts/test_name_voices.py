"""Tests de la voix du prénom : tools/tts/.venv/Scripts/python -m unittest tools/tts/test_name_voices.py"""
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import name_voices as n  # noqa: E402


def fake_phonemize(text, lang):
    """Phonèmes factices lisibles : « [langue:texte] » (la ponctuation seule reste telle quelle)."""
    if all(c in n.PUNCT for c in text):
        return text
    return f"{lang[:2]}:{text.lower()}"


class FakeKokoro:
    def __init__(self):
        self.calls = []

    def create(self, text, voice, speed, lang, is_phonemes=False):
        self.calls.append((text, voice, round(speed, 3), lang, is_phonemes))
        t = np.linspace(0, 1, 24000, dtype=np.float32)
        return (0.05 * np.sin(2 * np.pi * 220 * t)).astype(np.float32), 24000


class NameVoicesTest(unittest.TestCase):
    def test_clean_removes_language_switches_and_unknown_symbols(self):
        self.assertEqual(n.clean_phonemes("(en)nˈəʊʌ(fr)"), "nˈəʊʌ")
        self.assertEqual(n.clean_phonemes("lˈɛˈˈanˈa"), "lˈɛˈanˈa")
        self.assertEqual(n.clean_phonemes("ʒˈɑ̃ 😀"), "ʒˈɑ̃")

    def test_name_language_follows_the_mode(self):
        self.assertEqual(n.name_lang("fr", "bf_emma+5"), "fr-fr")
        self.assertEqual(n.name_lang("spelled", "af_bella"), "fr-fr")
        self.assertEqual(n.name_lang("en", "af_bella"), "en-us")
        self.assertEqual(n.name_lang("en", "bf_isabella"), "en-gb")

    def test_spelling_replaces_the_name_only_in_spelled_mode(self):
        self.assertEqual(n.name_phonemes(fake_phonemize, "Nina", "fr", "Nee nah", "af_bella"), "fr:nina")
        self.assertEqual(n.name_phonemes(fake_phonemize, "Nina", "spelled", "Nee nah", "af_bella"), "fr:nee nah")

    def test_sentence_keeps_english_around_the_name(self):
        self.assertEqual(n.sentence_phonemes(fake_phonemize, "Hello, {name}!", "NAME", "en-us"), "en:hello, NAME!")
        self.assertEqual(n.sentence_phonemes(fake_phonemize, "{name}!", "NAME", "en-us"), "NAME!")
        self.assertEqual(n.sentence_phonemes(fake_phonemize, "My name is {name}.", "NAME", "en-gb"), "en:my name is NAME.")
        self.assertEqual(n.sentence_phonemes(fake_phonemize, "{name} is here!", "NAME", "en-gb"), "NAME en:is here!")

    def test_only_sentences_with_the_name_use_phonemes(self):
        r = n.Renderer(FakeKokoro(), fake_phonemize, "Nina", "fr", None)
        self.assertEqual(r.spoken("Hello, {name}! Do you want to play?", "af_bella"), [("en:hello, fr:nina!", True), ("Do you want to play?", False)])

    def test_render_uses_the_same_young_voice_as_the_game(self):
        k = FakeKokoro()
        r = n.Renderer(k, fake_phonemize, "Nina", "fr", None)
        samples, sr = r.render("{name}! Can we play?", "bf_emma+5")
        self.assertEqual(sr, 24000)
        self.assertEqual([c[1] for c in k.calls], ["bf_emma", "bf_emma"])
        self.assertEqual([c[4] for c in k.calls], [True, False])
        self.assertLess(k.calls[0][2], n.g.SPEED)  # voix rajeunie : on parle plus lentement avant de rééchantillonner
        self.assertLess(len(samples), 2 * 24000 + int(n.g.SENTENCE_PAUSE * 24000))

    def test_file_name_changes_with_the_pronunciation(self):
        fr = n.Renderer(FakeKokoro(), fake_phonemize, "Nina", "fr", None)
        en = n.Renderer(FakeKokoro(), fake_phonemize, "Nina", "en", None)
        self.assertNotEqual(fr.file_name("Hello, {name}!", "af_bella"), en.file_name("Hello, {name}!", "af_bella"))
        self.assertEqual(fr.file_name("Hello, {name}!", "af_bella"), fr.file_name("Hello, {name}!", "af_bella"))

    def test_entries_keep_lines_for_the_player_with_one_name(self):
        lines = [
            {"voice": "a", "key": "a|Hello, {name}!", "player": True},
            {"voice": "a", "key": "a|Hi! I'm {name}!"},  # un bébé dit son propre prénom : pas pour la joueuse
            {"voice": "a", "key": "a|Hello!"},
            {"voice": "a", "key": "a|{name} and {name}!", "player": True},
        ]
        self.assertEqual([e["key"] for e in n.name_entries(lines)], ["a|Hello, {name}!"])
        self.assertEqual(n.key_text("bf_emma+5|{name}! Hi|there"), "{name}! Hi|there")


if __name__ == "__main__":
    unittest.main()
