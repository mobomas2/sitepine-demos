#!/usr/bin/env python3
"""
ساخت نسخه شخصی کد Apps Script با توکن داخل خودش.

    python apps-script/make_personal.py '123456:AAH...' [--secret tgdrive2026]

خروجی: apps-script/Code.personal.gs  (در .gitignore است و commit نمی‌شود)

چرا؟ چون کاربر این نسخه را کامل کپی می‌کند و فقط یک تابع را Run می‌کند؛
نه آدرس، نه سکرت، نه دیپلوی لازم است.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "Code.template.gs"
OUT = BASE / "Code.personal.gs"


def esc_update_token(text: str, token: str) -> str:
    """فقط خط واقعی CONFIG را عوض می‌کند (نه توضیحات بالای آن)."""
    old = "BOT_TOKEN: 'PUT-YOUR-NEW-BOT-TOKEN-HERE',"
    if old not in text:
        raise SystemExit("خط جای‌نگهدار BOT_TOKEN در Code.template.gs پیدا نشد.")
    return text.replace(old, f"BOT_TOKEN: '{token}',", 1)


def esc_update_secret(text: str, secret: str) -> str:
    old = "WEBHOOK_SECRET: 'change-this-to-a-long-random-string',"
    if old not in text:
        raise SystemExit("خط جای‌نگهدار WEBHOOK_SECRET در Code.template.gs پیدا نشد.")
    return text.replace(old, f"WEBHOOK_SECRET: '{secret}',", 1)


def run_me_once_block() -> str:
    """تابع اول فایل؛ ادیتور معمولاً همین را انتخاب‌شده نشان می‌دهد."""
    lines = [
        "/**",
        " * ==================================================================",
        " *  ✅ فقط همین یک تابع را اجرا کن:  RUN_ME_ONCE  →  Run",
        " *     هیچ آدرس، سکرت یا دیپلوی جدیدی لازم نیست.",
        " * ==================================================================",
        " */",
        "function RUN_ME_ONCE() {",
        "  var out = [];",
        "  out.push('=== ۱) وضعیت قبل از شروع ===');",
        "  out.push(statusNow());",
        "  out.push('');",
        "  out.push('=== ۲) روشن کردن حالت Polling ===');",
        "  out.push(setupPollingNow());",
        "  out.push('');",
        "  out.push('=== ۳) وضعیت بعد از شروع ===');",
        "  out.push(statusNow());",
        "  out.push('');",
        "  out.push('✅ تمام شد. حالا در تلگرام به ربات پیام بده (تا ۱ دقیقه جواب می‌دهد).');",
        "  out.push('برای تست فوری: تابع pollOnce را Run کن.');",
        "  var report = out.join('\\n');",
        "  Logger.log(report);",
        "  return report;",
        "}",
        "",
    ]
    return "\n".join(lines)


def escape_non_ascii(text: str) -> str:
    out = []
    for ch in text:
        o = ord(ch)
        if o <= 126:
            out.append(ch)
        elif o > 0xFFFF:
            o -= 0x10000
            out.append("\\u%04X\\u%04X" % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)))
        else:
            out.append("\\u%04X" % o)
    return "".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(description="ساخت کد شخصی با توکن داخلش")
    parser.add_argument("token", help="توکن ربات از BotFather")
    parser.add_argument("--secret", default="tgdrive2026", help="مقدار WEBHOOK_SECRET")
    args = parser.parse_args()

    token = args.token.strip()
    if not re.fullmatch(r"\d{6,}:[A-Za-z0-9_-]{20,}", token):
        print("⚠️ قالب توکن معمولاً شبیه 8621978100:AAG... است؛ ادامه می‌دهم ولی چکش کن.", file=sys.stderr)

    text = SRC.read_text(encoding="ascii")
    text = esc_update_token(text, token)
    text = esc_update_secret(text, args.secret)

    block = escape_non_ascii(run_me_once_block())

    # بعد از بلوک هدر (اولین */) تابع را می‌گذاریم تا اولین تابع فایل باشد
    idx = text.find("*/")
    if idx == -1:
        raise SystemExit("هدر فایل پیدا نشد.")
    idx += 2
    text = text[:idx] + "\n\n" + block + text[idx:]

    header_note = (
        "// ============================================================\n"
        "//  PERSONAL BUILD - token already filled in.\n"
        "//  Just paste this whole file, press Ctrl+S, choose\n"
        "//  RUN_ME_ONCE from the function dropdown and press Run.\n"
        "//  Keep this file private: it contains your bot token.\n"
        "// ============================================================\n\n"
    )
    final = header_note + text

    if not final.isascii():
        raise SystemExit("خروجی ASCII نیست!")

    OUT.write_text(final, encoding="ascii")
    print(f"✅ ساخته شد: {OUT}")
    print(f"   حجم: {len(final)} بایت | توکن: {token[:10]}…{token[-4:]}")
    print("   این فایل در .gitignore است و پوش نمی‌شود.")


if __name__ == "__main__":
    main()
