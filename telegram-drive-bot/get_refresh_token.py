#!/usr/bin/env python3
"""
یک‌بار اجرا کن تا GOOGLE_REFRESH_TOKEN به دست بیاید.

پیش‌نیاز: فایل client_secrets.json از Google Cloud Console
(توضیح کامل در README.md، بخش «گرفتن دسترسی گوگل»).

    python get_refresh_token.py
    python get_refresh_token.py --save        # مستقیم داخل .env بنویس
    python get_refresh_token.py --no-browser  # برای سرور (لینک را خودت باز کن)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/drive"]
BASE_DIR = Path(__file__).resolve().parent


def update_env(env_path: Path, values: dict[str, str]) -> None:
    text = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
    for key, value in values.items():
        line = f"{key}={value}"
        pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
        if pattern.search(text):
            text = pattern.sub(line, text)
        else:
            if text and not text.endswith("\n"):
                text += "\n"
            text += line + "\n"
    env_path.write_text(text, encoding="utf-8")
    print(f"\n✅ مقادیر در {env_path} ذخیره شد.")


def main() -> None:
    parser = argparse.ArgumentParser(description="گرفتن refresh token گوگل درایو")
    parser.add_argument(
        "--client-secrets",
        default=str(BASE_DIR / "client_secrets.json"),
        help="مسیر فایل OAuth client (نوع Desktop app)",
    )
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--no-browser", action="store_true", help="مرورگر را خودکار باز نکن")
    parser.add_argument("--save", action="store_true", help="نتیجه را در .env بنویس")
    args = parser.parse_args()

    secrets_path = Path(args.client_secrets)
    if not secrets_path.exists():
        print(
            f"❌ فایل {secrets_path} پیدا نشد.\n"
            "از Google Cloud Console → APIs & Services → Credentials →\n"
            "Create credentials → OAuth client ID → Desktop app بساز و JSON را دانلود کن.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    flow = InstalledAppFlow.from_client_secrets_file(str(secrets_path), SCOPES)

    print("مرورگر باز می‌شود؛ با همان اکانت گوگلی که درایو دارد وارد شو و اجازه بده.")
    print("اگر روی سرور هستی، از --no-browser استفاده کن و لینک را روی سیستم خودت باز کن")
    print("(یا با ssh -L 8080:localhost:8080 tunnel بزن).\n")

    creds = flow.run_local_server(
        port=args.port,
        open_browser=not args.no_browser,
        access_type="offline",
        prompt="consent",
        authorization_prompt_message="این لینک را باز کن و اجازه بده:\n{url}\n",
    )

    if not creds.refresh_token:
        print(
            "❌ refresh token برنگشت. یک‌بار دسترسی اپ را در\n"
            "https://myaccount.google.com/permissions حذف کن و دوباره اجرا کن.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    client_id = creds.client_id or flow.client_config.get("client_id", "")
    client_secret = creds.client_secret or flow.client_config.get("client_secret", "")

    values = {
        "GOOGLE_CLIENT_ID": client_id,
        "GOOGLE_CLIENT_SECRET": client_secret,
        "GOOGLE_REFRESH_TOKEN": creds.refresh_token,
    }

    print("\n" + "=" * 60)
    for key, value in values.items():
        print(f"{key}={value}")
    print("=" * 60)
    print("\nاین سه خط را در فایل .env بگذار (یا با --save دوباره اجرا کن).")

    if args.save:
        update_env(BASE_DIR / ".env", values)

    # خلاصه‌ای برای بررسی سریع
    (BASE_DIR / "token_debug.json").write_text(
        json.dumps({"client_id": client_id, "scopes": creds.scopes}, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
