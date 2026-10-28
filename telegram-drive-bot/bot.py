#!/usr/bin/env python3
"""
ربات تلگرام → گوگل درایو
هر چیزی که برای ربات بفرستی (متن، عکس، فایل، ویدیو، ویس...) در گوگل درایو ذخیره می‌شود.

اجرا:  python bot.py
"""

from __future__ import annotations

import asyncio
import html
import logging
import mimetypes
import re
import sys
from dataclasses import dataclass
from datetime import datetime

from telegram import LinkPreviewOptions, Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from telegram.request import HTTPXRequest

from config import ConfigError, Settings, load_settings
from drive import DriveError, DriveUploader, UploadedFile

logging.basicConfig(
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    level=logging.INFO,
)
logging.getLogger("httpx").setLevel(logging.WARNING)
log = logging.getLogger("tgdrive")

ALBUM_WINDOW = 2.5  # ثانیه: صبر می‌کنیم بقیه عکس‌های یک آلبوم هم برسند

_UNSAFE = re.compile(r'[\\/:*?"<>|\x00-\x1f]')


# --------------------------------------------------------------------- مدل‌ها
@dataclass
class Task:
    kind: str
    filename: str
    mimetype: str
    file_id: str | None = None
    file_size: int | None = None
    text: str | None = None
    caption: str = ""


@dataclass
class Result:
    ok: bool
    label: str
    link: str = ""


def safe_name(name: str, fallback: str) -> str:
    name = _UNSAFE.sub("_", (name or "").strip()).strip(" .")
    if not name:
        return fallback
    if len(name) > 180:
        stem, dot, ext = name.rpartition(".")
        if dot and len(ext) <= 10:
            name = stem[: 180 - len(ext) - 1] + "." + ext
        else:
            name = name[:180]
    return name


def guess_mime(filename: str, fallback: str = "application/octet-stream") -> str:
    return mimetypes.guess_type(filename)[0] or fallback


def human_size(num: int | None) -> str:
    if not num:
        return ""
    size = float(num)
    for unit in ("بایت", "کیلوبایت", "مگابایت", "گیگابایت"):
        if size < 1024 or unit == "گیگابایت":
            return f"{size:.0f} {unit}" if unit == "بایت" else f"{size:.1f} {unit}"
        size /= 1024
    return ""


def extract(msg, stamp: str) -> Task | None:  # noqa: ANN001
    """پیام تلگرام را به یک Task قابل آپلود تبدیل می‌کند."""
    caption = (msg.caption or "").strip()

    if msg.text and not msg.text.startswith("/"):
        return Task(
            kind="text",
            filename=f"note_{stamp}.txt",
            mimetype="text/plain",
            text=msg.text,
        )

    if msg.photo:
        biggest = msg.photo[-1]
        return Task(
            kind="photo",
            filename=f"photo_{stamp}.jpg",
            mimetype="image/jpeg",
            file_id=biggest.file_id,
            file_size=biggest.file_size,
            caption=caption,
        )

    if msg.document:
        name = safe_name(msg.document.file_name or "", f"file_{stamp}")
        return Task(
            kind="file",
            filename=name,
            mimetype=msg.document.mime_type or guess_mime(name),
            file_id=msg.document.file_id,
            file_size=msg.document.file_size,
            caption=caption,
        )

    if msg.video:
        name = safe_name(msg.video.file_name or "", f"video_{stamp}.mp4")
        return Task(
            kind="video",
            filename=name,
            mimetype=msg.video.mime_type or guess_mime(name, "video/mp4"),
            file_id=msg.video.file_id,
            file_size=msg.video.file_size,
            caption=caption,
        )

    if msg.animation:
        name = safe_name(msg.animation.file_name or "", f"animation_{stamp}.mp4")
        return Task(
            kind="animation",
            filename=name,
            mimetype=msg.animation.mime_type or guess_mime(name, "video/mp4"),
            file_id=msg.animation.file_id,
            file_size=msg.animation.file_size,
            caption=caption,
        )

    if msg.audio:
        name = safe_name(msg.audio.file_name or "", f"audio_{stamp}.mp3")
        return Task(
            kind="audio",
            filename=name,
            mimetype=msg.audio.mime_type or guess_mime(name, "audio/mpeg"),
            file_id=msg.audio.file_id,
            file_size=msg.audio.file_size,
            caption=caption,
        )

    if msg.voice:
        return Task(
            kind="voice",
            filename=f"voice_{stamp}.ogg",
            mimetype=msg.voice.mime_type or "audio/ogg",
            file_id=msg.voice.file_id,
            file_size=msg.voice.file_size,
            caption=caption,
        )

    if msg.video_note:
        return Task(
            kind="video_note",
            filename=f"videonote_{stamp}.mp4",
            mimetype="video/mp4",
            file_id=msg.video_note.file_id,
            file_size=msg.video_note.file_size,
        )

    if msg.sticker:
        sticker = msg.sticker
        ext = "tgs" if sticker.is_animated else ("webm" if sticker.is_video else "webp")
        return Task(
            kind="sticker",
            filename=f"sticker_{stamp}.{ext}",
            mimetype=sticker.mime_type or guess_mime(f"x.{ext}"),
            file_id=sticker.file_id,
            file_size=sticker.file_size,
        )

    return None


KIND_EMOJI = {
    "text": "📝",
    "photo": "🖼",
    "file": "📄",
    "video": "🎬",
    "animation": "🎞",
    "audio": "🎵",
    "voice": "🎤",
    "video_note": "⭕️",
    "sticker": "🩷",
}


# ---------------------------------------------------------------- آپلود
async def store(context: ContextTypes.DEFAULT_TYPE, task: Task) -> Result:
    settings: Settings = context.bot_data["settings"]
    drive: DriveUploader = context.bot_data["drive"]

    subfolder = None
    if settings.subfolder_mode == "date":
        subfolder = datetime.now(settings.tz).strftime("%Y-%m-%d")

    description = task.caption

    if task.kind == "text":
        body = task.text or ""
        as_doc = settings.text_mode == "doc"
        name = f"note_{datetime.now(settings.tz):%Y-%m-%d_%H-%M-%S}"
        if not as_doc:
            name += ".txt"
        uploaded: UploadedFile = await asyncio.to_thread(
            drive.upload,
            body.encode("utf-8"),
            name,
            "text/plain; charset=utf-8",
            description=description or body[:800],
            subfolder=subfolder,
            as_google_doc=as_doc,
        )
        return Result(True, uploaded.name, uploaded.link)

    if not task.file_id:
        return Result(False, "این نوع پیام پشتیبانی نمی‌شود.")

    if task.file_size and task.file_size > settings.max_upload_mb * 1024 * 1024:
        return Result(
            False,
            f"فایل بزرگ‌تر از {settings.max_upload_mb} مگابایت است "
            "(محدودیت خود تلگرام برای ربات‌ها).",
        )

    tg_file = await context.bot.get_file(task.file_id)
    data = bytes(await tg_file.download_as_bytearray())

    uploaded = await asyncio.to_thread(
        drive.upload,
        data,
        task.filename,
        task.mimetype,
        description=task.caption,
        subfolder=subfolder,
    )
    return Result(True, uploaded.name, uploaded.link)


# ---------------------------------------------------------------- آلبوم‌ها
def _line(result: Result) -> str:
    if not result.ok:
        return f"⚠️ {html.escape(result.label)}"
    return f'• <a href="{html.escape(result.link)}">{html.escape(result.label)}</a>'


async def _flush_album(context: ContextTypes.DEFAULT_TYPE, chat_id: int, gid: str) -> None:
    await asyncio.sleep(ALBUM_WINDOW)
    buffer: list[Result | None] = _ALBUMS.pop(gid, [])
    _ALBUM_TASKS.pop(gid, None)
    items = [r if r is not None else Result(False, "ناموفق") for r in buffer]
    if not items:
        return
    ok_count = sum(1 for r in items if r.ok)
    header = f"✅ {ok_count} فایل در گوگل درایو ذخیره شد" if ok_count else "⚠️ هیچ‌کدام ذخیره نشد"
    text = header + "\n\n" + "\n".join(_line(r) for r in items)
    try:
        await context.bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=ParseMode.HTML,
            link_preview_options=LinkPreviewOptions(is_disabled=True),
        )
    except Exception:  # noqa: BLE001
        log.exception("ارسال نتیجه آلبوم شکست خورد")


_ALBUMS: dict[str, list[Result | None]] = {}
_ALBUM_TASKS: dict[str, asyncio.Task] = {}


# ---------------------------------------------------------------- دسترسی
def is_allowed(settings: Settings, user_id: int | None) -> bool:
    if not settings.allowed_user_ids:
        return True
    return user_id is not None and user_id in settings.allowed_user_ids


# ---------------------------------------------------------------- هندلرها
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    settings: Settings = context.bot_data["settings"]
    drive: DriveUploader = context.bot_data["drive"]
    user = update.effective_user
    me = await context.bot.get_me()

    try:
        folder = await asyncio.to_thread(drive.root_folder)
        folder_line = f'📁 مقصد: <a href="{html.escape(folder.link)}">{html.escape(folder.name)}</a>'
    except DriveError as exc:
        folder_line = f"⚠️ دسترسی به درایو مشکل دارد:\n<code>{html.escape(str(exc))}</code>"

    text = (
        f"سلام {html.escape(user.first_name or 'دوست من')} 👋\n"
        f"من هر چیزی را که بفرستی در گوگل درایو ذخیره می‌کنم.\n\n"
        f"{folder_line}\n\n"
        "کافی است بفرستی:\n"
        "📝 متن (به‌صورت سند/فایل متنی ذخیره می‌شود)\n"
        "🖼 عکس، 🎬 ویدیو، 🎵 موزیک، 🎤 ویس، 📄 هر فایلی\n\n"
        f"🆔 آیدی عددی تو: <code>{user.id}</code>\n"
        f"🤖 ربات: @{me.username}\n\n"
        "دستورها: /folder لینک پوشه • /id آیدی من • /help راهنما"
    )
    await update.message.reply_text(
        text, parse_mode=ParseMode.HTML, link_preview_options=LinkPreviewOptions(is_disabled=True)
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await cmd_start(update, context)


async def cmd_id(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    chat = update.effective_chat
    await update.message.reply_text(
        f"آیدی کاربر: <code>{user.id}</code>\nآیدی چت: <code>{chat.id}</code>" if chat else f"آیدی کاربر: <code>{user.id}</code>",
        parse_mode=ParseMode.HTML,
    )


async def cmd_folder(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    drive: DriveUploader = context.bot_data["drive"]
    try:
        folder = await asyncio.to_thread(drive.root_folder)
    except DriveError as exc:
        await update.message.reply_text(f"⚠️ {exc}")
        return
    await update.message.reply_text(
        f'📁 <a href="{html.escape(folder.link)}">{html.escape(folder.name)}</a>',
        parse_mode=ParseMode.HTML,
    )


async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = update.effective_message
    user = update.effective_user
    if msg is None or user is None:
        return

    settings: Settings = context.bot_data["settings"]
    if not is_allowed(settings, user.id):
        await msg.reply_text(
            "⛔️ این ربات خصوصی است.\n"
            f"آیدی عددی تو: {user.id}\n"
            "این آیدی را در ALLOWED_USER_IDS فایل .env اضافه کن."
        )
        return

    stamp = datetime.now(settings.tz).strftime("%Y-%m-%d_%H-%M-%S")
    task = extract(msg, stamp)
    if task is None:
        await msg.reply_text("🤔 این نوع پیام را نمی‌توانم ذخیره کنم.")
        return

    gid = msg.media_group_id
    slot: int | None = None
    if gid:
        buffer = _ALBUMS.setdefault(gid, [])
        slot = len(buffer)
        buffer.append(None)
        if gid not in _ALBUM_TASKS:
            _ALBUM_TASKS[gid] = asyncio.create_task(
                _flush_album(context, msg.chat_id, gid)
            )
    else:
        try:
            await msg.chat.send_action(ChatAction.UPLOAD_DOCUMENT)
        except Exception:  # noqa: BLE001
            pass

    try:
        result = await store(context, task)
    except DriveError as exc:
        log.error("DriveError: %s", exc)
        result = Result(False, str(exc))
    except Exception as exc:  # noqa: BLE001
        log.exception("خطای غیرمنتظره در آپلود")
        result = Result(False, f"خطای غیرمنتظره: {exc}")

    if gid and slot is not None:
        _ALBUMS[gid][slot] = result
        return

    if result.ok:
        await msg.reply_text(
            f"✅ ذخیره شد\n"
            f"{KIND_EMOJI.get(task.kind, '📄')} <a href=\"{html.escape(result.link)}\">"
            f"{html.escape(result.label)}</a>",
            parse_mode=ParseMode.HTML,
            link_preview_options=LinkPreviewOptions(is_disabled=True),
        )
    else:
        await msg.reply_text(f"⚠️ {result.label}")


async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    log.error("خطا در پردازش آپدیت", exc_info=context.error)


# ---------------------------------------------------------------- main
def main() -> None:
    try:
        settings = load_settings()
    except ConfigError as exc:
        print(f"❌ تنظیمات ناقص است: {exc}", file=sys.stderr)
        raise SystemExit(1) from None

    request = HTTPXRequest(
        connect_timeout=20, read_timeout=120, write_timeout=120, pool_timeout=20
    )
    application: Application = (
        ApplicationBuilder().token(settings.bot_token).request(request).build()
    )
    application.bot_data["settings"] = settings
    application.bot_data["drive"] = DriveUploader(settings)

    application.add_handler(CommandHandler(["start", "help"], cmd_start))
    application.add_handler(CommandHandler("id", cmd_id))
    application.add_handler(CommandHandler("folder", cmd_folder))
    application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, on_message)
    )
    application.add_handler(
        MessageHandler(
            (filters.PHOTO | filters.Document.ALL | filters.VIDEO | filters.AUDIO
             | filters.VOICE | filters.VIDEO_NOTE | filters.ANIMATION | filters.Sticker.ALL)
            & ~filters.COMMAND,
            on_message,
        )
    )
    application.add_error_handler(on_error)

    log.info("ربات بالا آمد. منتظر پیام هستم...")
    application.run_polling(
        allowed_updates=Update.ALL_TYPES, drop_pending_updates=False
    )


if __name__ == "__main__":
    main()
