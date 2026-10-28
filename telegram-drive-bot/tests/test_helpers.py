"""تست‌های سریع بدون تماس با تلگرام/گوگل:  python -m unittest discover tests"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bot  # noqa: E402
from drive import _quote  # noqa: E402

STAMP = "2026-10-28_12-00-00"


def ns(**kwargs):
    base = dict(
        text=None, caption=None, photo=None, document=None, video=None, audio=None,
        voice=None, video_note=None, animation=None, sticker=None,
    )
    base.update(kwargs)
    return SimpleNamespace(**base)


class SafeNameTest(unittest.TestCase):
    def test_strips_path_separators_and_leading_dots(self):
        self.assertEqual(bot.safe_name("../../etc/passwd", "f"), "_.._etc_passwd")
        self.assertNotIn("/", bot.safe_name("a/b/c.txt", "f"))

    def test_keeps_extension_when_truncating(self):
        name = bot.safe_name("a" * 500 + ".pdf", "f")
        self.assertTrue(name.endswith(".pdf"))
        self.assertLessEqual(len(name), 180)

    def test_empty_uses_fallback(self):
        self.assertEqual(bot.safe_name("   ", "fallback.txt"), "fallback.txt")


class ExtractTest(unittest.TestCase):
    def test_text_message(self):
        task = bot.extract(ns(text="سلام دنیا"), STAMP)
        self.assertEqual(task.kind, "text")
        self.assertEqual(task.text, "سلام دنیا")

    def test_photo_uses_largest_size(self):
        small = SimpleNamespace(file_id="s", file_size=100)
        big = SimpleNamespace(file_id="b", file_size=900)
        task = bot.extract(ns(photo=[small, big], caption="توضیح"), STAMP)
        self.assertEqual(task.file_id, "b")
        self.assertEqual(task.mimetype, "image/jpeg")
        self.assertEqual(task.caption, "توضیح")

    def test_document_keeps_name(self):
        doc = SimpleNamespace(file_id="d", file_name="گزارش.pdf", mime_type=None, file_size=10)
        task = bot.extract(ns(document=doc), STAMP)
        self.assertEqual(task.filename, "گزارش.pdf")
        self.assertEqual(task.mimetype, "application/pdf")

    def test_voice(self):
        voice = SimpleNamespace(file_id="v", mime_type="audio/ogg", file_size=10)
        self.assertEqual(bot.extract(ns(voice=voice), STAMP).filename, f"voice_{STAMP}.ogg")

    def test_sticker_animated(self):
        sticker = SimpleNamespace(
            file_id="s", mime_type=None, file_size=1, is_animated=True, is_video=False
        )
        self.assertTrue(bot.extract(ns(sticker=sticker), STAMP).filename.endswith(".tgs"))

    def test_unsupported(self):
        self.assertIsNone(bot.extract(ns(), STAMP))


class FilterTest(unittest.TestCase):
    def test_allowed(self):
        settings = SimpleNamespace(allowed_user_ids=frozenset({7}))
        self.assertTrue(bot.is_allowed(settings, 7))
        self.assertFalse(bot.is_allowed(settings, 8))
        self.assertFalse(bot.is_allowed(settings, None))

    def test_open_when_empty(self):
        settings = SimpleNamespace(allowed_user_ids=frozenset())
        self.assertTrue(bot.is_allowed(settings, 123))


class DriveQueryTest(unittest.TestCase):
    def test_quote(self):
        self.assertEqual(_quote("it's"), "it\\'s")


if __name__ == "__main__":
    unittest.main()
