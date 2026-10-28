# 🤖 ربات تلگرام → گوگل درایو

رباتی که **هر چیزی** برایش بفرستی — متن، عکس، فایل، ویدیو، ویس، استیکر، آلبوم — را در گوگل درایو ذخیره می‌کند و لینک فایل را در تلگرام برایت می‌فرستد.

مخصوص ربات تو: **@T2GD2Tbot**

---

## ⚡️ راه‌اندازی سریع (۵ دقیقه)

```bash
cd telegram-drive-bot
python3 -m venv .venv
source .venv/bin/activate          # ویندوز: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # سپس فایل .env را باز کن و پر کن
python get_refresh_token.py --save # دسترسی گوگل را یک‌بار بده
python bot.py                      # ربات روشن می‌شود
```

بعد در تلگرام به @T2GD2Tbot برو، `/start` بزن و هر چیزی بفرست. تمام.

> ⚠️ توکن ربات را **هیچ‌جا** ننویس: نه در چت، نه در گیت‌هاب، نه در اسکرین‌شات. فقط داخل فایل `.env` (که در `.gitignore` هست).

---

## 🔑 مرحله ۱ — توکن تلگرام

تو داری؛ همان چیزی که @BotFather داد:

```
123456789:AAH...xxxxxxxxxxxxxxxxxxxxxx
```

در `.env` بگذار:

```env
BOT_TOKEN=123456789:AAH...xxxxxxxxxxxxxxxxxxxxxx
```

اگر توکن جایی لو رفت، در @BotFather → `/mybots` → ربات → **API Token → Revoke** بزن و توکن جدید بگیر.

---

## 📁 مرحله ۲ — ساخت پوشه در گوگل درایو و آیدی آن

1. در Google Drive یک پوشه بساز، مثلاً `Telegram Uploads`.
2. پوشه را باز کن؛ آدرسش این شکلی است:
   `https://drive.google.com/drive/folders/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz012345`**
3. آن تکه آخر (بعد از `folders/`) همان `DRIVE_FOLDER_ID` است.

```env
DRIVE_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz012345
```

---

## 🔐 مرحله ۳ — دسترسی گوگل (مهم‌ترین قسمت)

گوگل دو راه می‌دهد. برای **اکانت شخصی Gmail** راه اول را برو؛ سرویس‌اکانت روی Gmail شخصی کار نمی‌کند (فضای درایو ندارد → خطای 403).

### راه اول: OAuth2 (پیشنهادی برای Gmail)

**۳.۱** برو به <https://console.cloud.google.com/> و یک پروژه بساز (مثلاً `tg-drive-bot`).

**۳.۲** منوی ☰ → **APIs & Services → Library** → جستجو کن **Google Drive API** → **Enable**.

**۳.۳** منوی ☰ → **APIs & Services → OAuth consent screen**:
- User type: **External** → Create
- App name: هر چیزی، مثلاً `telegram drive bot`
- Your email: ایمیل خودت
- Scopes: لازم نیست چیزی اضافه کنی؛ ذخیره کن
- **Test users**: ایمیل گوگل خودت را اضافه کن (وگرنه خطای `access_denied` می‌گیری)
- Publishing status را روی **Testing** بگذار — برای استفاده شخصی کافی است. (در حالت Testing، refresh token حدوداً هر ۷ روز منقضی می‌شود؛ اگر آزاردهنده بود، روی **Publish app** بزن تا دائمی شود. برای اپ شخصی، حالت Testing بدون publish هم برای شروع خوب است و باید هر هفته یک‌بار `get_refresh_token.py` را دوباره اجرا کنی.)

**۳.۴** منوی ☰ → **APIs & Services → Credentials → + Create credentials → OAuth client ID**:
- Application type: **Desktop app**
- Create → **Download JSON**

فایل دانلودشده را به اسم `client_secrets.json` کنار `bot.py` بگذار.

**۳.۵** توکن را بگیر:

```bash
python get_refresh_token.py --save
```

مرورگر باز می‌شود → با **همان اکانتی** که پوشه درایو مال اوست وارد شو → اجازه بده.
سه مقدار `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` خودکار در `.env` نوشته می‌شوند.

> اگر روی سرور بدون مرورگر هستی: `--no-browser` بزن، لینک چاپ‌شده را روی لپ‌تاپ خودت باز کن، یا `ssh -L 8080:localhost:8080 user@server` بزن و `--port 8080` را همان‌طور پیش‌فرض بگذار.
>
> اگر خطای `403: access_denied` گرفتی: ایمیلت در Test users نیست.
> اگر `refresh_token` برنگشت: برو به <https://myaccount.google.com/permissions> → دسترسی اپ را حذف کن → دوباره اجرا کن.

### راه دوم: Service Account (فقط Google Workspace / Shared Drive)

1. در Google Cloud: **APIs & Services → Credentials → Create credentials → Service account** → بساز.
2. داخل سرویس‌اکانت: **Keys → Add key → Create new key → JSON** → دانلود کن، اسمش را `service_account.json` بگذار.
3. در Google Drive: پوشه را با ایمیل سرویس‌اکانت (چیزی مثل `xxx@proj.iam.gserviceaccount.com`) **share** کن با دسترسی **Editor**. ← بدون این مرحله ۴۰۳ می‌گیری.
4. در `.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_FILE=service_account.json
   ```

---

## 🧪 تست

```bash
# بررسی اینکه همه‌چیز سر جایش است (بدون تماس با تلگرام)
python -m unittest discover -s tests -t .

# شروع ربات
python bot.py
```

لاگ موفق شبیه این است:

```
INFO | ربات بالا آمد. منتظر پیام هستم...
```

در تلگرام:
- `/start` → خوش‌آمد + لینک پوشه مقصد (اگر لینک نیامد یعنی دسترسی گوگل مشکل دارد)
- یک متن، یک عکس و یک PDF بفرست → باید `✅ ذخیره شد` با لینک بیاید.

---

## ⚙️ تنظیمات `.env`

| کلید | توضیح |
|---|---|
| `BOT_TOKEN` | توکن @BotFather |
| `DRIVE_FOLDER_ID` | آیدی پوشه مقصد |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` | از `get_refresh_token.py` |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | جایگزین سه مقدار بالا |
| `ALLOWED_USER_IDS` | اگر پر شود، فقط این آیدی‌ها می‌توانند آپلود کنند — آیدی خودت را با `/id` بگیر. **اگر ربات عمومی است این را پر کن**، وگرنه هر کسی می‌تواند درایوت را پر کند. |
| `SUBFOLDER_MODE` | `date` → هر روز یک پوشه `2026-10-28` می‌سازد. `none` → همه در پوشه اصلی |
| `TEXT_MODE` | `doc` → متن‌ها سند گوگل می‌شوند. `txt` → فایل `.txt` |
| `MAX_UPLOAD_MB` | سقف حجم فایل (پیش‌فرض ۱۹؛ سقف خود تلگرام برای دانلود ربات‌ها ۲۰ مگابایت است) |
| `TZ` | منطقه زمانی نام پوشه/فایل |

---

## 📋 چه چیزهایی پشتیبانی می‌شود

| فرستاده | ذخیره به‌صورت |
|---|---|
| متن | Google Doc (یا `.txt`) با تاریخ |
| عکس (تکی و آلبوم) | `.jpg` با بالاترین کیفیت موجود + caption در توضیحات |
| فایل/سند | با نام و نوع اصلی خودش |
| ویدیو، گیف | `.mp4` |
| موزیک، ویس، ویدیو-نوت | `.mp3` / `.ogg` / `.mp4` |
| استیکر | `.webp` / `.webm` / `.tgs` |

آلبوم (چند عکس هم‌زمان) → همه در درایو آپلود می‌شوند و **یک** پیام با لیست لینک‌ها می‌آید.

---

## 🚀 اجرای دائمی

### Docker (ساده‌ترین)

```bash
docker compose up -d --build
docker compose logs -f
```

اگر سرویس‌اکانت داری، خط `volumes:` را در `docker-compose.yml` از حالت کامنت دربیاور.

### systemd روی VPS

```bash
sudo mkdir -p /opt/telegram-drive-bot
sudo cp -r . /opt/telegram-drive-bot
cd /opt/telegram-drive-bot && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
sudo cp telegram-drive-bot.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now telegram-drive-bot
journalctl -u telegram-drive-bot -f
```

قبلش داخل `/opt/telegram-drive-bot/.env` را کامل کن و `User=www-data` را با یوزر خودت عوض کن.
(همچنین می‌توانی روی Railway / Fly.io / Render به‌عنوان Worker اجرا کنی — فقط `.env` را در Secrets بگذار و `client_secrets.json`/`service_account.json` را به‌عنوان فایل سری mount کن.)

---

## 🧩 چطور کار می‌کند (برای فهمیدن/تغییر دادن)

```
bot.py            هندلرهای تلگرام: /start /id /folder + همه پیام‌ها
  ├─ extract()    پیام تلگرام → Task (نام فایل، mimetype، file_id یا متن)
  ├─ store()      دانلود فایل از تلگرام (get_file) → آپلود به درایو
  └─ آلبوم‌ها      2.5 ثانیه صبر می‌کند تا بقیه عکس‌های گروه برسند، یک پیام جمع‌بندی می‌فرستد
drive.py          هر تماس با Google Drive API: auth، ساخت زیرپوشه، آپلود
config.py         خواندن و اعتبارسنجی .env
get_refresh_token.py  گرفتن refresh token (یک‌بار)
tests/            تست‌ها بدون نیاز به تلگرام/گوگل
```

نکات پیاده‌سازی که ممکن است لازم شود:

- **آپلودها در thread جدا** (`asyncio.to_thread`) اجرا می‌شوند تا ربات هنگام آپلود فایل بزرگ قفل نشود.
- فایل‌های بزرگ‌تر از ۴ مگابایت به‌صورت **resumable** آپلود می‌شوند.
- نام فایل‌ها پاک‌سازی می‌شوند (`/`, `..`, کاراکترهای کنترلی) تا از مسیرهای عجیب جلوگیری شود.
- کش پوشه‌ها در حافظه است؛ هر روز فقط یک‌بار کوئری «پوشه هست؟» زده می‌شود.

---

## 🩺 عیب‌یابی

| خطا | علت / راه‌حل |
|---|---|
| `این مقادیر در فایل .env خالی هستند` | `.env` را نساختی یا `cp .env.example .env` نزدی |
| `به پوشه درایو دسترسی ندارم ... 404/403` | `DRIVE_FOLDER_ID` غلط است، یا پوشه با اکانت/سرویس‌اکانت share نشده |
| `403` هنگام آپلود | فضای درایو پر است، یا دسترسی پوشه فقط Viewer است (Editor لازم است) |
| `access_denied` در مرورگر | ایمیلی که وارد شد در **Test users** نیست |
| `refresh token برنگشت` | دسترسی قبلی اپ را در myaccount.google.com/permissions حذف کن و دوباره بگیر |
| `Conflict: terminated by other getUpdates` | ربات همین حالا جای دیگری در حال اجراست (دو نسخه هم‌زمان) — یکی را ببند |
| `فایل بزرگ‌تر از ۱۹ مگابایت است` | محدودیت Bot API تلگرام برای دانلود ربات‌ها ۲۰MB است؛ برای فایل‌های بزرگ‌تر باید از سرور محلی Bot API یا لینک مستقیم استفاده کنی |
| عکس آلبوم فقط یکی ذخیره شد | `ALBUM_WINDOW` در `bot.py` را کمی زیاد کن (مثلاً ۴ ثانیه) |
| ربات جواب نمی‌دهد | توکن را چک کن، سرور به `api.telegram.org` دسترسی دارد؟ |

---

## 🔒 امنیت — سه نکته

1. `.env`, `client_secrets.json`, `service_account.json` را **هرگز** commit یا به کسی نده (در `.gitignore` هستند).
2. `ALLOWED_USER_IDS` را برای ربات شخصی پر کن.
3. اگر فایل درایو حساس است، پوشه را با کسی share نکن و در `drive.py` می‌توانی `anyone` permission را غیرفعال نگه داری (پیش‌فرض: فقط خودت دسترسی داری؛ لینک‌ها برای دیگران باز نمی‌شود مگر share کنی).
