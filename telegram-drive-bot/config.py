"""خواندن تنظیمات از فایل .env"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class ConfigError(RuntimeError):
    pass


def _int_set(raw: str) -> frozenset[int]:
    ids: set[int] = set()
    for chunk in raw.replace(";", ",").split(","):
        chunk = chunk.strip()
        if chunk:
            try:
                ids.add(int(chunk))
            except ValueError:
                raise ConfigError(f"ALLOWED_USER_IDS نامعتبر است: {chunk!r}") from None
    return frozenset(ids)


@dataclass(frozen=True)
class Settings:
    bot_token: str
    drive_folder_id: str
    allowed_user_ids: frozenset[int]
    subfolder_mode: str
    text_mode: str
    max_upload_mb: int
    tz: ZoneInfo
    client_id: str
    client_secret: str
    refresh_token: str
    service_account_file: str

    @property
    def use_service_account(self) -> bool:
        return bool(self.service_account_file)


def load_settings() -> Settings:
    token = os.getenv("BOT_TOKEN", "").strip()
    folder_id = os.getenv("DRIVE_FOLDER_ID", "").strip()

    missing = [
        name
        for name, value in (("BOT_TOKEN", token), ("DRIVE_FOLDER_ID", folder_id))
        if not value
    ]
    if missing:
        raise ConfigError(
            f"این مقادیر در فایل .env خالی هستند: {', '.join(missing)}"
        )

    service_account_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "").strip()
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN", "").strip()

    if not service_account_file and not (client_id and client_secret and refresh_token):
        raise ConfigError(
            "احراز هویت گوگل تنظیم نشده. یا GOOGLE_SERVICE_ACCOUNT_FILE را پر کن، "
            "یا سه مقدار GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN را "
            "(با اجرای get_refresh_token.py به دست می‌آیند)."
        )

    subfolder_mode = os.getenv("SUBFOLDER_MODE", "date").strip().lower() or "none"
    if subfolder_mode not in {"date", "none"}:
        raise ConfigError("SUBFOLDER_MODE باید date یا none باشد.")

    text_mode = os.getenv("TEXT_MODE", "doc").strip().lower() or "doc"
    if text_mode not in {"doc", "txt"}:
        raise ConfigError("TEXT_MODE باید doc یا txt باشد.")

    try:
        max_upload_mb = max(1, int(os.getenv("MAX_UPLOAD_MB", "19")))
    except ValueError:
        raise ConfigError("MAX_UPLOAD_MB باید عدد باشد.") from None

    try:
        tz = ZoneInfo(os.getenv("TZ", "Asia/Tehran").strip() or "Asia/Tehran")
    except Exception:  # noqa: BLE001 - منطقه زمانی نامعتبر
        tz = ZoneInfo("UTC")

    return Settings(
        bot_token=token,
        drive_folder_id=folder_id,
        allowed_user_ids=_int_set(os.getenv("ALLOWED_USER_IDS", "")),
        subfolder_mode=subfolder_mode,
        text_mode=text_mode,
        max_upload_mb=max_upload_mb,
        tz=tz,
        client_id=client_id,
        client_secret=client_secret,
        refresh_token=refresh_token,
        service_account_file=service_account_file,
    )
