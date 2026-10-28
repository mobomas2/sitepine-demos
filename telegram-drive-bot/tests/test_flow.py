"""تست جریان کامل پیام با درایو تقلبی (بدون تماس با تلگرام/گوگل)."""

from __future__ import annotations

import asyncio
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bot  # noqa: E402
from drive import UploadedFile  # noqa: E402


class FakeDrive:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def upload(self, data, name, mimetype, *, description="", subfolder=None, as_google_doc=False):
        self.calls.append(
            dict(
                data=data,
                name=name,
                mimetype=mimetype,
                description=description,
                subfolder=subfolder,
                as_google_doc=as_google_doc,
            )
        )
        return UploadedFile(id="1", name=name, link="https://drive.google.com/x")


class FakeBot:
    async def get_file(self, file_id):
        return SimpleNamespace(download_as_bytearray=self._bytes)

    async def _bytes(self, *args):
        return bytearray(b"binary-data")


class FakeChat:
    async def send_action(self, *args, **kwargs):
        return True


def make_context(settings, drive):
    return SimpleNamespace(bot_data={"settings": settings, "drive": drive}, bot=FakeBot())


def make_settings(**overrides):
    base = dict(
        allowed_user_ids=frozenset(),
        subfolder_mode="date",
        text_mode="doc",
        max_upload_mb=19,
        tz=bot.datetime.now().astimezone().tzinfo,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def run(coro):
    return asyncio.run(coro)


class FlowTest(unittest.TestCase):
    def _message(self, replies, **fields):
        async def reply_text(text, **kwargs):
            replies.append((text, kwargs))

        base = dict(
            text=None,
            caption=None,
            photo=None,
            document=None,
            video=None,
            audio=None,
            voice=None,
            video_note=None,
            animation=None,
            sticker=None,
            media_group_id=None,
            chat_id=5,
            chat=FakeChat(),
            reply_text=reply_text,
        )
        base.update(fields)
        return SimpleNamespace(**base)

    def _update(self, msg, user_id=1):
        return SimpleNamespace(
            effective_message=msg,
            effective_user=SimpleNamespace(id=user_id, first_name="Ali"),
        )

    def test_text_goes_to_drive_as_google_doc(self):
        replies: list = []
        drive = FakeDrive()
        settings = make_settings()
        ctx = make_context(settings, drive)
        msg = self._message(replies, text="سلام")
        run(bot.on_message(self._update(msg), ctx))

        self.assertEqual(len(drive.calls), 1)
        call = drive.calls[0]
        self.assertTrue(call["as_google_doc"])
        self.assertEqual(call["data"].decode(), "سلام")
        self.assertRegex(call["subfolder"], r"^\d{4}-\d{2}-\d{2}$")
        self.assertIn("✅", replies[0][0])
        self.assertIn("drive.google.com", replies[0][0])

    def test_text_as_plain_txt(self):
        drive = FakeDrive()
        ctx = make_context(make_settings(text_mode="txt", subfolder_mode="none"), drive)
        run(bot.on_message(self._update(self._message([], text="hi")), ctx))
        self.assertFalse(drive.calls[0]["as_google_doc"])
        self.assertTrue(drive.calls[0]["name"].endswith(".txt"))
        self.assertIsNone(drive.calls[0]["subfolder"])

    def test_photo_upload(self):
        drive = FakeDrive()
        ctx = make_context(make_settings(), drive)
        photo = [SimpleNamespace(file_id="p", file_size=1000)]
        run(bot.on_message(self._update(self._message([], photo=photo, caption="cat")), ctx))
        self.assertEqual(drive.calls[0]["mimetype"], "image/jpeg")
        self.assertEqual(drive.calls[0]["description"], "cat")

    def test_private_bot_blocks_stranger(self):
        replies: list = []
        drive = FakeDrive()
        ctx = make_context(make_settings(allowed_user_ids=frozenset({42})), drive)
        run(bot.on_message(self._update(self._message(replies, text="x"), user_id=7), ctx))
        self.assertEqual(drive.calls, [])
        self.assertIn("⛔️", replies[0][0])

    def test_oversize_file_rejected(self):
        replies: list = []
        drive = FakeDrive()
        ctx = make_context(make_settings(max_upload_mb=1), drive)
        doc = SimpleNamespace(file_id="d", file_name="big.zip", mime_type=None, file_size=5 * 1024 * 1024)
        run(bot.on_message(self._update(self._message(replies, document=doc)), ctx))
        self.assertEqual(drive.calls, [])
        self.assertIn("مگابایت", replies[0][0])


if __name__ == "__main__":
    unittest.main()
