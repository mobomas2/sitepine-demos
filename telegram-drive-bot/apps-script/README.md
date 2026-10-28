# 🅖 مسیر بدون Cloud Console: Google Apps Script

اگر در Google Cloud Console بن شده‌ای (`Multiple Google services … unavailable`)، راه OAuth / Service Account بسته است. اما **Apps Script** یک راه کاملاً متفاوت است:

| | مسیر پایتون (`bot.py`) | ✅ مسیر Apps Script |
|---|---|---|
| Google Cloud Console | لازم است (بن شده‌ای → ❌) | **لازم نیست** |
| OAuth client / refresh token | لازم است | **لازم نیست** |
| سرور / VPS / Docker | لازم است | **لازم نیست** |
| هزینه | سرور | **رایگان** |
| محدودیت | — | سهمیه روزانه Apps Script (پایین توضیح داده شده) |

اسکریپت داخل خود گوگل اجرا می‌شود، با اجازه‌ی همان اکانتی که لاگین هستی، فایل را از تلگرام می‌گیرد و در درایو می‌گذارد.

> **دو نسخه از همان کد:** [`Code.ascii.gs`](Code.ascii.gs) (کاملاً ASCII، برای paste بی‌دردسر) و [`Code.gs`](Code.gs) (با کامنت فارسی).
> اگر خطای `SyntaxError` گرفتی، نسخه ASCII را بچسبان — هر دو با ۱۲ تست یکسان تست شده‌اند.

---

## 🔴 اول از همه: توکن ربات را عوض کن

توکنی که فرستادی (`8621978100:AAH...`) **لو رفته** است (در چت عمومی نوشته شد). هر کسی با آن می‌تواند جای تو ربات را کنترل کند.

1. در تلگرام به **@BotFather** برو
2. `/mybots` → `@T2GD2Tbot` → **API Token** → **Revoke current token**
3. توکن جدید را فقط در Apps Script بگذار (مرحله ۳ پایین) — نه در چت، نه در گیت‌هاب

> اگر قبلاً کسی با آن توکن webhook ست کرده باشد، با همین `action=setup` پایین بازنویسی می‌شود.

---

## 🚀 راه‌اندازی در ۶ مرحله (حدود ۵ دقیقه)

### ۱. پروژه بساز

برو به **<https://script.google.com>** → **New project** (با همان اکانت گوگلی که درایو دارد).

### ۲. کد را بگذار

اول **همه چیز** را در ادیتور انتخاب کن (Ctrl+A) و **پاک کن** (Delete)، بعد یکی از این دو فایل را کامل بچسبان:

| فایل | چه وقت |
|---|---|
| [`Code.ascii.gs`](Code.ascii.gs) | ✅ **پیشنهادی** — کاملاً ASCII؛ اگر خطای `SyntaxError` گرفتی از این استفاده کن (فارسی‌ها به `\uXXXX` تبدیل شده‌اند، خروجی ربات همچنان فارسی است) |
| [`Code.gs`](Code.gs) | همان کد با کامنت‌های فارسی (خوش‌خوان‌تر) |

بعد Ctrl+S بزن. اسم پروژه را مثلاً `Telegram→Drive` بگذار.

**چک سریع:** خط اول باید `/**` باشد و خط آخر `}`. اگر خط اول چیزی مثل `[Code.gs](...)` یا متن دیگری بود، پاکش کن.

### ۳. توکن و تنظیمات

**⚙️ Project Settings** (آیکن چرخ‌دنده، ستون چپ) → پایین صفحه → **Script Properties** → **Add property**:

| Property | Value |
|---|---|
| `BOT_TOKEN` | توکن **جدید** ربات |

> چرا اینجا و نه داخل کد؟ چون Script Properties جدا از کد ذخیره می‌شود و امن‌تر است.

اگر خواستی پوشه مقصد، سکرت و بقیه چیزها را هم اینجا نگه داری، در بالای `Code.gs` بخش `CONFIG` را پر کن:

```js
FOLDER_ID: '',                       // آیدی پوشه مقصد؛ خالی = ریشه درایو
WEBHOOK_SECRET: 'change-this-...',   // یک رشته تصادفی طولانی
ALLOWED_USER_IDS: [],                // بعداً آیدی خودت را اضافه کن
SUBFOLDER_MODE: 'date',              // هر روز یک پوشه 2026-10-28
TEXT_MODE: 'doc',                    // متن‌ها سند گوگل
MAX_UPLOAD_MB: 19,
TIMEZONE: 'Asia/Tehran'
```

آیدی پوشه = آن تکه آخر آدرس پوشه درایو: `https://drive.google.com/drive/folders/`**`1AbCd...`**

### ۴. Deploy → Web app

**Deploy** (بالا راست) → **New deployment** → آیکن چرخ‌دنده → **Web app**:

| فیلد | مقدار |
|---|---|
| Description | `v1` |
| **Execute as** | **Me (your@gmail.com)** ← مهم: فایل باید با اکانت خودت در درایو برود |
| **Who has access** | **Anyone** ← مهم: تلگرام باید بتواند POST کند |

**Deploy** → لینک **Web app URL** را کپی کن (شبیه `https://script.google.com/macros/s/AKfy.../exec`).

اولین بار گوگل اجازه می‌خواهد:
**Authorize access** → اکانت خودت → «Google hasn't verified this app» → **Advanced** → **Go to Telegram→Drive (unsafe)** → **Allow**

این پیام عادی است چون اسکریپت را خودت نوشتی؛ دسترسی درایو و درخواست به تلگرام (`script.external_request`) را تأیید می‌کند.

**تست سریع قبل از ادامه:** بالای ادیتور، از منوی کشویی توابع **`checkSetup`** را انتخاب کن → **Run**. در **Execution log** باید ببینی:

```
✅ token OK → @T2GD2Tbot
✅ folder OK → My Drive | https://drive.google.com/...
webhook url → https://script.google.com/macros/s/.../exec
```

### ۵. Webhook را ست کن

در مرورگر این آدرس را باز کن (SECRET همان مقدار `WEBHOOK_SECRET` در `CONFIG` است):

```
<WEB_APP_URL>?k=YOUR_SECRET&action=setup
```

باید ببینی:

```
✅ webhook ست شد
ربات: @T2GD2Tbot
webhook: https://script.google.com/macros/s/.../exec?k=YOUR_SECRET
نتیجه تلگرام: {"ok":true,...}
```

> چرا `?k=SECRET`؟ چون دسترسی Web app روی «Anyone» است؛ این سکرت جلوی آپلود غریبه‌ها را می‌گیرد. یک رشته طولانی و تصادفی بگذار.

### ۶. تست

در تلگرام به **@T2GD2Tbot** برو:
- `/start` → باید خوش‌آمد + لینک پوشه مقصد بیاید
- `/id` → آیدی عددی‌ات را بگیر و در `ALLOWED_USER_IDS` بگذار (Deploy دوباره → مرحله ۴/۵)
- یک متن، یک عکس، یک PDF، و یک آلبوم ۳ عکسی بفرست → هرکدام باید `✅ ذخیره شد` با لینک بدهند

---

## 🧰 چیزهایی که باید بدانی

**بعد از هر تغییر کد، Deploy لازم است:**
Deploy → **Manage deployments** → مداد ✏️ → Version: **New version** → Deploy.
(اگر فقط ذخیره کنی، نسخه قبلی همان‌طور اجرا می‌شود.)

**دستورهای ربات:** `/start` `/help` `/id` `/folder`

**چه چیزهایی ذخیره می‌شوند:** متن (Google Doc)، عکس، فایل، ویدیو، گیف، موزیک، ویس، ویدیو-نوت، استیکر. آلبوم چند عکسی → همه ذخیره، یک پیام جمع‌بندی.

**سهمیه‌ها (حساب Gmail معمولی، روزانه):**

| مورد | سقف |
|---|---|
| تماس‌های UrlFetch (≈ هر فایل ۲ تماس) | ۲۰٬۰۰۰ در روز |
| زمان اجرا | ۹۰ دقیقه در روز |
| هر اجرا | حداکثر ۶ دقیقه |
| حجم هر فایل | ۱۹MB (سقف خود Bot API تلگرام) |

یعنی روزی چند هزار فایل کوچک مشکلی ندارد؛ اگر بیشتر شد، باید سراغ سرور/VPS بروی.

**اگر خواستی از VPS استفاده کنی:** همان `bot.py` در پوشه بالاست، ولی به Cloud Console نیاز دارد که برای تو بسته است — پس فعلاً همین Apps Script بهترین گزینه است.

---

## 🩺 عیب‌یابی

| علامت | علت / راه‌حل |
|---|---|
| ربات جواب نمی‌دهد | `?k=SECRET&action=info` را باز کن و `pending_update_count` و `last_error_message` را ببین. اگر `last_error` هست، Deploy با دسترسی **Anyone** را چک کن |
| `❌ توکن ربات درست نیست` | مقدار `BOT_TOKEN` در Script Properties غلط/قدیمی است (توکن revoke‌شده) |
| پیام می‌آید ولی فایل ذخیره نمی‌شود | Executions (ستون چپ) → آخرین اجرا → لاگ خطا |
| `Authorization required` در لاگ | مرحله ۴ را دوباره انجام بده و Allow کن |
| `⚠️ پوشه مقصد پیدا نشد` | `FOLDER_ID` غلط است یا با این اکانت دسترسی ندارد |
| `⚠️ سهمیه روزانه … پر شد` | فردا ادامه می‌دهد؛ یا حجم آپلود را کمتر کن |
| `SyntaxError: Invalid or unexpected token line: 1` | کد ناقص/آلوده کپی شده. Ctrl+A → Delete → کل [`Code.ascii.gs`](Code.ascii.gs) را بچسبان (بدون هیچ متن اضافه‌ای در خط اول) |
| `Unexpected identifier` یا خطای عجیب در خطی که متن فارسی دارد | نسخه ASCII را استفاده کن؛ کاراکترهای راست‌به‌چپ در کپی/پیست خراب می‌شوند |
| بعد از تغییر کد اثری ندید | باید **New version** در Manage deployments بزنی |
| اجرا با `Exceeded maximum execution time` قطع شد | فایل خیلی بزرگ/کند بود؛ `MAX_UPLOAD_MB` را کمتر کن |
| خطای `Conflict: can't use getUpdates method while webhook is active` | یعنی جای دیگری `bot.py` با همین توکن در حال اجراست؛ آن را ببند (این اسکریپت webhook استفاده می‌کند) |

---

## 🧪 تست بدون گوگل

منطق اسکریپت با mock تست می‌شود (نیاز به Node.js):

```bash
node apps-script/test_local.js
# 11/11 passed
```

پوشش: بررسی سکرت، ذخیره متن/عکس/سند، پاک‌سازی نام فایل، رد فایل بزرگ، `/id`، `/start`، آلبوم، ربات خصوصی، ست شدن webhook.

---

## ❓ اگر خود script.google.com هم بن بود

لینک `script.google.com` را باز کن و یک پروژه خالی بساز؛ اگر همان پیام «خدمات در دسترس نیست» را دیدی، Apps Script هم بسته است. در این حالت دو راه می‌ماند:

1. **اکانت گوگل دیگری** (کاری/دوم) که با این محدودیت مواجه نیست — کد و مراحل عیناً همان است.
2. **عوض کردن مقصد فایل**: به‌جای گوگل درایو، روی S3/Cloudflare R2/Nextcloud یا حتی چت «Saved Messages» خودت ذخیره کنیم. بگو تا نسخه‌اش را بسازم.
