/**
 * ============================================================================
 *  ربات تلگرام → گوگل درایو، کاملاً داخل Google Apps Script
 *  بدون Google Cloud Console، بدون سرور، بدون OAuth client
 *  (مناسب اکانت‌هایی که در Cloud Console بن شده‌اند)
 * ============================================================================
 *
 *  مراحل راه‌اندازی (کاملش در README.md همین پوشه):
 *   1) script.google.com → New project
 *   2) کل این فایل را جایگزین کد نمونه کن
 *   3) چهار مقدار پایین (CONFIG) را پر کن
 *   4) Deploy → New deployment → Web app → Execute as: Me، Who has access: Anyone
 *   5) URL را باز کن:  <WEB_APP_URL>?k=<WEBHOOK_SECRET>&action=setup
 *      (خودش webhook تلگرام را ست می‌کند)
 */

// ============================ CONFIG =======================================
var CONFIG = {
  // 🔑 توکن ربات از @BotFather را بین دو کوتیشن اینجا بگذار:
  //    BOT_TOKEN: '8621978100:AAH...',
  //    (یا اینجا را خالی بگذار و در Project Settings ⚙️ → Script Properties
  //     با نام BOT_TOKEN ذخیره کن)
  BOT_TOKEN: 'PUT-YOUR-NEW-BOT-TOKEN-HERE',

  // آیدی پوشه مقصد در گوگل درایو (بعد از /folders/ در آدرس پوشه)
  // خالی بگذار → در ریشه درایو ذخیره می‌شود
  FOLDER_ID: '',

  // یک رشته تصادفی طولانی. داخل آدرس webhook می‌رود تا کسی دیگری نتواند
  // برای اسکریپت تو آپلود کند. عوضش کن!
  WEBHOOK_SECRET: 'change-this-to-a-long-random-string',

  // فقط این کاربرهای تلگرام اجازه آپلود دارند. خالی = همه.
  // آیدی عددی خودت را بعد از راه‌اندازی با /id از ربات بگیر و اینجا بگذار.
  ALLOWED_USER_IDS: [],

  // 'date' → زیرپوشه تاریخ‌دار (2026-10-28) | 'none' → همه در پوشه اصلی
  SUBFOLDER_MODE: 'date',

  // 'doc' → متن‌ها سند گوگل می‌شوند | 'txt' → فایل .txt
  TEXT_MODE: 'doc',

  // سقف حجم فایل (مگابایت). سقف دانلود Bot API = ۲۰
  MAX_UPLOAD_MB: 19,

  // منطقه زمانی نام پوشه/فایل
  TIMEZONE: 'Asia/Tehran'
};
// ===========================================================================

var API = 'https://api.telegram.org/bot';
var PROPS = PropertiesService.getScriptProperties();

/** true اگر این کلید قبلاً پردازش شده باشد (ضد تکرار شدن آپلود). */
function seenBefore_(key) {
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get(key)) return true;
    cache.put(key, '1', 21600); // ۶ ساعت
  } catch (ignore) {
    // اگر کش در دسترس نبود، کار را متوقف نمی‌کنیم
  }
  return false;
}

/**
 * توکن فعلی، یا '' اگر هنوز جای‌گذاری نشده باشد.
 * اول CONFIG.BOT_TOKEN، بعد Script Properties. مقدار نمونه نادیده گرفته می‌شود.
 */
function currentToken_() {
  var candidates = [CONFIG.BOT_TOKEN, PROPS.getProperty('BOT_TOKEN')];
  for (var i = 0; i < candidates.length; i++) {
    var t = String(candidates[i] || '').trim().replace(/^['"]+|['"]+$/g, '');
    if (!t) continue;
    if (/^(PUT|PASTE|YOUR|توکن)/i.test(t)) continue;   // placeholder
    if (t.indexOf('...') !== -1) continue;             // 123456:AAH...
    if (t.length < 20) continue;                       // خیلی کوتاه → توکن نیست
    return t;
  }
  return '';
}

/** توکن یا خطای واضح. */
function token_() {
  var t = currentToken_();
  if (!t) {
    throw new Error(
      'توکن ربات تنظیم نشده. در بالای کد، BOT_TOKEN را جایگزین کن ' +
      "مثلاً BOT_TOKEN: '123456:AAH...'  (یا در Script Properties با نام BOT_TOKEN ذخیره کن)"
    );
  }
  return t;
}

// ---------------------------------------------------------------- ورودی‌ها
function doPost(e) {
  try {
    var params = (e && e.parameter) || {};
    if (CONFIG.WEBHOOK_SECRET && params.k !== CONFIG.WEBHOOK_SECRET) {
      return jsonOut_({ ok: false, error: 'forbidden' });
    }
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: true, note: 'empty' });
    }

    var update = JSON.parse(e.postData.contents);
    var note = processUpdate_(update);
    return jsonOut_({ ok: true, note: note });
  } catch (err) {
    console.error('doPost failed: ' + err + '\n' + (err.stack || ''));
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/**
 * یک آپدیت تلگرام را پردازش می‌کند (هم از webhook، هم از action=replay).
 * خروجی: 'done' | 'duplicate' | 'ignored'
 */
function processUpdate_(update) {
  // ردپای آخرین آپدیت دریافتی — برای عیب‌یابی (action=diag)
  try {
    PROPS.setProperty('LAST_UPDATE', JSON.stringify({
      update_id: update.update_id || 0,
      at: new Date().toISOString(),
      has_message: !!(update.message || update.channel_post)
    }));
  } catch (ignore) {}

  // اگر پاسخ کند باشد، تلگرام همان آپدیت را دوباره می‌فرستد؛
  // با این کلید از ذخیره دوباره فایل جلوگیری می‌کنیم.
  if (update.update_id && seenBefore_('u' + update.update_id)) {
    return 'duplicate';
  }

  var msg = update.message || update.channel_post;
  if (!msg) return 'ignored';

  handleMessage_(msg);
  return 'done';
}

function doGet(e) {
  // هیچ‌وقت خطا پرت نمی‌کنیم؛ همیشه یک صفحه متنی می‌دهیم تا «صفحه سفید» نبینیم.
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || 'ping').toLowerCase();

    // 1) سکرت
    if (CONFIG.WEBHOOK_SECRET && p.k !== CONFIG.WEBHOOK_SECRET) {
      return page_('⛔️ دسترسی ندارید', [
        'در آدرس، مقدار k باید برابر WEBHOOK_SECRET باشد.',
        'درست: ' + deployUrl_() + '?k=YOUR_SECRET&action=setup',
        'WEBHOOK_SECRET فعلی: ' + (CONFIG.WEBHOOK_SECRET || '(خالی)')
      ]);
    }

    // 2) توکن
    if (!currentToken_()) {
      return page_('🔑 توکن تلگرام تنظیم نشده', [
        'این اسکریپت جای توکن را از تو نمی‌پرسد؛ باید یک‌بار در کد بگذاری:',
        '',
        "۱) بالای فایل، این خط را پیدا کن:   BOT_TOKEN: 'PUT-YOUR-NEW-BOT-TOKEN-HERE'",
        "۲) جایش بنویس:                     BOT_TOKEN: '8621978100:AAH...'  (توکن واقعی بین دو کوتیشن)",
        '۳) Ctrl+S ذخیره کن',
        '۴) Deploy → Manage deployments → ✏️ → Version: New version → Deploy',
        '۵) همین صفحه را رفرش کن',
        '',
        'راه دوم (بدون تغییر کد): ⚙️ Project Settings → Script Properties →',
        'Add property → Name: BOT_TOKEN ، Value: توکن',
        '',
        '⛔️ اگر توکن لو رفته، اول در @BotFather → /mybots → API Token → Revoke توکن جدید بگیر.'
      ]);
    }

    // 3) اکشن‌ها
    if (action === 'setup') {
      var me = tg_('getMe', {});
      if (!me || !me.ok) {
        return page_('❌ توکن درست نیست', [
          'تلگرام این توکن را قبول نکرد:',
          JSON.stringify(me),
          '',
          'اگر توکن را Revoke کرده‌ای، مقدار جدید را بگذار و New version دیپلوی کن.',
          'توجه: فاصله اضافه، کوتیشن اضافه یا نقل‌قول فارسی، توکن را خراب می‌کند.'
        ]);
      }

      var url = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
      tg_('deleteWebhook', { drop_pending_updates: false });
      var res = tg_('setWebhook', {
        url: url,
        allowed_updates: ['message', 'channel_post'],
        max_connections: 1
      });

      return page_('✅ webhook ست شد', [
        'ربات: @' + ((me.result && me.result.username) || '?'),
        'webhook: ' + url,
        'پاسخ تلگرام: ' + JSON.stringify(res),
        '',
        'الان در تلگرام به ربات /start بده.',
        'اگر جواب نداد، همین آدرس را با action=info باز کن.'
      ]);
    }

    if (action === 'info') {
      return page_('📊 وضعیت ربات', [
        'getMe: ' + JSON.stringify(tg_('getMe', {})),
        '',
        'webhookInfo: ' + JSON.stringify(tg_('getWebhookInfo', {}), null, 2)
      ]);
    }

    if (action === 'delete') {
      return page_('🗑 webhook حذف شد', [
        JSON.stringify(tg_('deleteWebhook', { drop_pending_updates: false }))
      ]);
    }

    if (action === 'diag' || action === 'info') {
      return page_('🩺 تشخیص وضعیت', diagLines_());
    }

    if (action === 'replay') {
      return page_('♻️ بازپخش پیام‌های معلق', replayLines_(p));
    }

    if (action === 'sendtest') {
      if (!p.chat) {
        return page_('📨 تست ارسال', [
          'این آدرس را با آیدی چت باز کن:',
          deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=sendtest&chat=123456789',
          '',
          'آیدی چت را از داخل تلگرام (با ربات @userinfobot) بگیر.'
        ]);
      }
      var sent = tg_('sendMessage', { chat_id: p.chat, text: '✅ تست موفق بود — ربات می‌تواند پیام بفرستد.' });
      return page_(sent && sent.ok ? '✅ ارسال تست موفق بود' : '❌ ارسال تست ناموفق بود', [
        'chat_id: ' + p.chat,
        'پاسخ تلگرام: ' + JSON.stringify(sent)
      ]);
    }

    if (action === 'startpolling') {
      return page_('🔄 حالت Polling روشن شد', startPolling_());
    }

    if (action === 'stoppolling') {
      return page_('⏹ حالت Polling خاموش شد', stopPolling_());
    }

    if (action === 'pollnow') {
      pollOnce();
      return page_('🔄 یک اجرای Polling انجام شد', diagLines_());
    }

    if (action === 'posttest') {
      return page_('📮 تست POST از بیرون', postTestLines_());
    }

    // 4) ping / پیش‌فرض: گزارش کامل وضعیت
    var lines = ['آدرس این اسکریپت: ' + deployUrl_(), ''];

    var me = tg_('getMe', {});
    if (me && me.ok) {
      lines.push('✅ توکن: درست → @' + ((me.result && me.result.username) || '?'));
    } else {
      lines.push('❌ توکن: تلگرام قبول نکرد → ' + JSON.stringify(me));
    }

    try {
      var folder = targetFolder_(null);
      lines.push('✅ پوشه مقصد: ' + folder.getName() + ' → ' + folder.getUrl());
    } catch (ferr) {
      lines.push('❌ پوشه مقصد: ' + ferr);
    }

    var info = tg_('getWebhookInfo', {});
    lines.push('وضعیت webhook: ' + JSON.stringify(info));

    lines.push('');
    lines.push('مرحله بعد:');
    lines.push('اگر webhook ست نشده → ' + deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=setup');
    lines.push('در تلگرام: /start و /id');

    return page_('🤖 ربات تلگرام → گوگل درایو', lines);
  } catch (err) {
    return page_('❌ خطا', [
      String(err),
      '',
      'این متن را برایم بفرست تا دقیق بگویم مشکل کجاست.'
    ]);
  }
}

// ============================ حالت Polling ============================
/**
 * اگر گوگل اجازه ندهد web app عمومی باشد (پاسخ 302 به تلگرام)،
 * ربات را می‌توان بدون webhook هم چرخاند: هر ۱ دقیقه خود Apps Script
 * از تلگرام می‌پرسد «پیام جدیدی داری؟». برای این کار به دسترسی عمومی
 * هیچ نیازی نیست.
 */

/** نصب تریگر هر ۱ دقیقه برای pollOnce. */
function installPolling_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pollOnce') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('pollOnce').timeBased().everyMinutes(1).create();
}

/** حذف تریگرهای polling. */
function removePolling_() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pollOnce') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  return removed;
}

function pollingTriggersCount_() {
  var triggers = ScriptApp.getProjectTriggers();
  var n = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pollOnce') n++;
  }
  return n;
}

function startPolling_() {
  var lines = [];

  // در حالت polling نباید webhook فعال باشد (وگرنه getUpdates خطای 409 می‌دهد)
  var del = tg_('deleteWebhook', { drop_pending_updates: false });
  lines.push('webhook حذف شد: ' + JSON.stringify(del));

  installPolling_();
  lines.push('✅ تریگر هر ۱ دقیقه نصب شد.');

  // یک اجرای فوری تا منتظر دقیقه بعد نمانیم
  var processed = pollOnce();
  lines.push('اجرای فوری: ' + processed + ' پیام پردازش شد.');

  lines.push('');
  lines.push('از این به بعد هر ۱ دقیقه پیام‌های جدید خودکار پردازش می‌شوند');
  lines.push('(حداکثر ~۱ دقیقه تأخیر). برای تست: ' + deployUrl_() + '?k=' +
             (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=pollnow');
  lines.push('برای برگشت به حالت webhook: ' + deployUrl_() + '?k=' +
             (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=stoppolling');
  return lines;
}

function stopPolling_() {
  var removed = removePolling_();
  var res = tg_('setWebhook', {
    url: deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET),
    allowed_updates: ['message', 'channel_post'],
    max_connections: 1
  });
  return ['تریگرهای حذف‌شده: ' + removed, 'webhook دوباره ست شد: ' + JSON.stringify(res)];
}

/**
 * یک بار getUpdates می‌زند و همه پیام‌های جدید را پردازش می‌کند.
 * offset در Script Properties نگه داشته می‌شود.
 */
function pollOnce() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 0;   // اجرای هم‌زمان جلوگیری

  var processed = 0;
  try {
    var offset = Number(PROPS.getProperty('TG_OFFSET') || 0);
    var payload = { timeout: 0, limit: 20, allowed_updates: ['message', 'channel_post'] };
    if (offset) payload.offset = offset;

    var res = tg_('getUpdates', payload);
    if (!res || !res.ok) {
      if (res && res.error_code === 409) {
        // webhook هنوز فعال است
        tg_('deleteWebhook', { drop_pending_updates: false });
      }
      return 0;
    }

    var updates = res.result || [];
    for (var i = 0; i < updates.length; i++) {
      var u = updates[i];
      try {
        if (processUpdate_(u) === 'done') processed++;
      } catch (err) {
        console.error('poll processUpdate: ' + err);
      }
      offset = Math.max(offset, Number(u.update_id) + 1);
    }

    if (updates.length) PROPS.setProperty('TG_OFFSET', String(offset));
  } finally {
    lock.releaseLock();
  }
  return processed;
}

/**
 * به خود همین web app یک POST می‌زند (بدون دنبال کردن ریدایرکت) تا ببینیم
 * تلگرام چه کدی می‌گیرد. کد 302 یعنی گوگل به صفحه لاگین ریدایرکت می‌کند
 * و همان چیزی است که تلگرام گزارش می‌کند: "Wrong response ... 302 Found".
 */
function postTestLines_() {
  var url = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
  var lines = ['POST → ' + url, ''];

  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ update_id: 0, _selftest: true }),
      followRedirects: false,
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    var headers = {};
    try { headers = res.getAllHeaders() || {}; } catch (ignore) {}

    lines.push('کد پاسخ: ' + code);

    if (code === 200) {
      lines.push('');
      lines.push('✅ عالی: POST بدون ریدایرکت جواب می‌دهد؛ تلگرام هم باید بتواند پیام بفرستد.');
      lines.push('اگر باز هم ربات ساکت است: action=setup و بعد action=diag را بزن.');
    } else if (code === 301 || code === 302 || code === 303 || code === 307) {
      lines.push('Location: ' + (headers['Location'] || headers['location'] || '(نامشخص)'));
      lines.push('');
      lines.push('❌ گوگل POST را ریدایرکت می‌کند؛ تلگرام ریدایرکت را دنبال نمی‌کند،');
      lines.push('   پس همین است علت «Wrong response from the webhook: 302 Found».');
      lines.push('');
      lines.push('درستش کن:');
      lines.push('۱) Deploy → Manage deployments → ✏️ (مداد)');
      lines.push('۲) Execute as: Me (ایمیل خودت)');
      lines.push('۳) Who has access: Anyone  ← نه «Anyone with Google account» و نه «Only myself»');
      lines.push('۴) Version: New version → Deploy');
      lines.push('۵) بعد این را باز کن: ' + deployUrl_() + '?k=' +
                 (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=setup');
      lines.push('۶) و بعد: ' + url + '&action=replay');
    } else if (code === 401 || code === 403) {
      lines.push('');
      lines.push('❌ دسترسی بسته است (کاربر ناشناس اجازه ندارد).');
      lines.push('در Manage deployments مقدار Who has access را روی Anyone بگذار و New version کن.');
    } else {
      lines.push('');
      lines.push('پاسخ غیرمنتظره. سرآیندها: ' + JSON.stringify(headers));
      lines.push('متن: ' + String(res.getContentText()).slice(0, 300));
    }
  } catch (err) {
    lines.push('❌ خطا در تست: ' + err);
  }

  return lines;
}

/** خطوط گزارش کامل وضعیت (اکشن diag). */
function diagLines_() {
  var lines = [];
  lines.push('آدرس این اسکریپت: ' + deployUrl_());
  lines.push('');

  // توکن
  if (!currentToken_()) {
    lines.push('❌ توکن: تنظیم نشده (بالای کد BOT_TOKEN را پر کن)');
  } else {
    var me = tg_('getMe', {});
    lines.push(me && me.ok
      ? '✅ توکن: درست → @' + ((me.result && me.result.username) || '?')
      : '❌ توکن: تلگرام قبول نکرد → ' + JSON.stringify(me));
  }

  // پوشه
  try {
    var folder = targetFolder_(null);
    lines.push('✅ پوشه مقصد: ' + folder.getName() + ' → ' + folder.getUrl());
  } catch (ferr) {
    lines.push('❌ پوشه مقصد: ' + ferr);
  }

  // webhook
  var info = tg_('getWebhookInfo', {});
  lines.push('');
  if (info && info.ok) {
    var r = info.result || {};
    lines.push('webhook url: ' + (r.url || '(ست نشده!)'));
    lines.push('pending_update_count: ' + (r.pending_update_count || 0));
    if (r.last_error_message) {
      lines.push('⛔️ last_error_message: ' + r.last_error_message + '  (در ' + (r.last_error_date || '?') + ')');
      if (String(r.last_error_message).indexOf('302') !== -1) {
        lines.push('   ↗ گوگل به تلگرام ریدایرکت می‌دهد (دسترسی عمومی web app بسته است).');
        lines.push('   دو راه: (۱) Who has access = Anyone در Manage deployments');
        lines.push('   یا (۲) همین حالا حالت Polling را روشن کن:');
        lines.push('   ' + deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=startpolling');
      }
    } else {
      lines.push('last_error_message: ندارد ✅');
    }
  } else {
    lines.push('❌ خواندن وضعیت webhook شکست خورد: ' + JSON.stringify(info));
  }

  // آیا webhook روی همین سکرت است؟
  var expected = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
  if (info && info.ok && info.result && info.result.url) {
    lines.push('');
    lines.push(info.result.url === expected
      ? '✅ آدرس webhook با تنظیمات فعلی یکی است'
      : '⚠️ آدرس webhook با تنظیمات فعلی یکی نیست. این را باز کن: ' + expected + '&action=setup');
  }

  // حالت polling
  var pcount = pollingTriggersCount_();
  lines.push('');
  lines.push(pcount
    ? '🔄 حالت Polling فعال است (' + pcount + ' تریگر هر ۱ دقیقه) → webhook لازم نیست'
    : 'حالت Polling فعال نیست (ربات به webhook تکیه دارد)');
  var off = PROPS.getProperty('TG_OFFSET');
  if (off) lines.push('آخرین offset پردازش‌شده: ' + off);

  // heartbeat
  var last = PROPS.getProperty('LAST_UPDATE');
  lines.push('');
  lines.push(last
    ? '📥 آخرین آپدیت دریافتی: ' + last
    : '📥 هنوز هیچ آپدیتی از تلگرام نرسیده (یعنی webhook یا دسترسی Anyone مشکل دارد)');

  lines.push('');
  lines.push('اگر پیام‌های معلق داری: ' + deployUrl_() + '?k=' +
             (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=replay');
  return lines;
}

/**
 * پیام‌هایی که تلگرام هنوز تحویل نداده را می‌گیرد، پردازش می‌کند
 * (فایل‌ها را ذخیره می‌کند) و webhook را دوباره ست می‌کند.
 */
function replayLines_(p) {
  var limit = Math.min(Number(p.limit) || 20, 100);
  var lines = [];

  tg_('deleteWebhook', { drop_pending_updates: false });
  var res = tg_('getUpdates', {
    timeout: 0,
    limit: limit,
    allowed_updates: ['message', 'channel_post']
  });

  if (!res || !res.ok) {
    return ['❌ getUpdates شکست خورد: ' + JSON.stringify(res)];
  }

  var updates = res.result || [];
  lines.push('تعداد پیام معلق: ' + updates.length);

  var done = 0;
  var lastId = 0;
  for (var i = 0; i < updates.length; i++) {
    var u = updates[i];
    lastId = Math.max(lastId, Number(u.update_id) || 0);
    try {
      var r = processUpdate_(u);
      lines.push('• update ' + u.update_id + ' → ' + r);
      if (r === 'done') done++;
    } catch (err) {
      lines.push('⚠️ update ' + u.update_id + ' خطا: ' + err);
    }
  }

  // تأیید دریافت (تا دوباره تحویل داده نشوند)
  if (lastId) {
    tg_('getUpdates', { offset: lastId + 1, timeout: 0, limit: 1 });
    lines.push('offset تأیید شد: ' + (lastId + 1));
  }

  // ست کردن دوباره webhook
  var url = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
  var setRes = tg_('setWebhook', {
    url: url,
    allowed_updates: ['message', 'channel_post'],
    max_connections: 1
  });

  lines.push('');
  lines.push('پردازش‌شده: ' + done);
  lines.push('webhook دوباره ست شد: ' + JSON.stringify(setRes));
  lines.push('url: ' + url);
  return lines;
}

/** آدرس همین web app (روی نسخه دیپلوی‌شده). */
function deployUrl_() {
  try {
    return ScriptApp.getService().getUrl() || '(بعد از Deploy مشخص می‌شود)';
  } catch (e) {
    return '(بعد از Deploy مشخص می‌شود)';
  }
}

/** صفحه متنی ساده (به‌جای صفحه سفید). */
function page_(title, lines) {
  var body = '=== ' + title + ' ===\n\n' + (lines || []).join('\n');
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.TEXT);
}

// ---------------------------------------------------------------- بررسی سریع
/**
 * بعد از paste و ذخیره، این تابع را از منوی انتخاب تابع بالا انتخاب کن و Run بزن.
 * نتیجه در Execution log می‌آید: صحت توکن، دسترسی به پوشه، آدرس webhook.
 */
function checkSetup() {
  var out = [];

  try {
    var me = tg_('getMe', {});
    out.push(me && me.ok
      ? '✅ token OK → @' + ((me.result && me.result.username) || '?')
      : '❌ token FAIL → ' + JSON.stringify(me));
  } catch (err) {
    out.push('❌ token ERROR → ' + err);
  }

  try {
    var folder = targetFolder_(null);
    out.push('✅ folder OK → ' + folder.getName() + ' | ' + folder.getUrl());
  } catch (err2) {
    out.push('❌ folder ERROR → ' + err2);
  }

  try {
    out.push('webhook url → ' + ScriptApp.getService().getUrl());
  } catch (err3) {
    out.push('webhook url → (بعد از Deploy نمایش داده می‌شود)');
  }

  out.push('ALLOWED_USER_IDS → ' + JSON.stringify(CONFIG.ALLOWED_USER_IDS || []));

  var report = out.join('\n');
  Logger.log(report);
  return report;
}

// ---------------------------------------------------------------- مسیریابی
function handleMessage_(msg) {
  var user = msg.from || {};
  var chatId = msg.chat && msg.chat.id;
  if (!chatId) return;

  if (msg.text && msg.text.charAt(0) === '/') {
    return handleCommand_(msg, chatId, user);
  }

  if (!isAllowed_(user.id)) {
    sendMessage_(chatId,
      '⛔️ این ربات خصوصی است.\nآیدی عددی تو: <code>' + user.id + '</code>\n' +
      'این آیدی را در ALLOWED_USER_IDS اسکریپت اضافه کن.');
    return;
  }

  var stamp = formatStamp_();
  var subfolder = CONFIG.SUBFOLDER_MODE === 'date' ? formatDate_() : null;

  // متن ساده
  if (msg.text) {
    try {
      var saved = saveText_(msg.text, stamp, subfolder);
      sendMessage_(chatId, '✅ ذخیره شد\n📝 <a href="' + esc_(saved.url) + '">' + esc_(saved.name) + '</a>');
    } catch (err) {
      sendMessage_(chatId, '⚠️ ' + esc_(friendlyError_(err)));
    }
    return;
  }

  var item = extractItem_(msg, stamp);
  if (!item) {
    sendMessage_(chatId, '🤔 این نوع پیام را نمی‌توانم ذخیره کنم.');
    return;
  }

  if (msg.media_group_id) {
    return handleAlbum_(msg.media_group_id, chatId, item, subfolder);
  }

  try {
    var file = saveItem_(item, subfolder);
    sendMessage_(chatId,
      '✅ ذخیره شد\n' + emojiFor_(item.kind) + ' <a href="' + esc_(file.url) + '">' + esc_(file.name) + '</a>');
  } catch (err) {
    sendMessage_(chatId, '⚠️ ' + esc_(friendlyError_(err)));
  }
}

function handleCommand_(msg, chatId, user) {
  var cmd = msg.text.split(/\s+/)[0].replace(/@.*$/, '').toLowerCase();

  if (cmd === '/ping') {
    sendMessage_(chatId, '🏓 pong — ربات زنده است.\nچت آیدی: <code>' + chatId + '</code>');
    return;
  }

  if (cmd === '/id') {
    sendMessage_(chatId, 'آیدی کاربر: <code>' + user.id + '</code>\nآیدی چت: <code>' + chatId + '</code>');
    return;
  }

  if (cmd === '/folder') {
    var folder = targetFolder_(null);
    sendMessage_(chatId, '📁 <a href="' + esc_(folder.getUrl()) + '">' + esc_(folder.getName()) + '</a>');
    return;
  }

  if (cmd === '/start' || cmd === '/help') {
    var me = tg_('getMe', {}) || {};
    var username = (me.result && me.result.username) || '';
    var root = targetFolder_(null);
    sendMessage_(chatId,
      'سلام ' + esc_(user.first_name || 'دوست من') + ' 👋\n' +
      'هر چیزی برایم بفرستی در گوگل درایو ذخیره می‌کنم.\n\n' +
      '📁 مقصد: <a href="' + esc_(root.getUrl()) + '">' + esc_(root.getName()) + '</a>\n\n' +
      '📝 متن (سند گوگل) · 🖼 عکس · 🎬 ویدیو · 🎵 موزیک · 🎤 ویس · 📄 فایل\n\n' +
      '🆔 آیدی تو: <code>' + user.id + '</code>\n' +
      '🤖 ربات: @' + esc_(username) + '\n\n' +
      'دستورها: /folder لینک پوشه · /id آیدی من · /ping تست');
    return;
  }

  sendMessage_(chatId, 'دستور ناشناخته. بنویس /help');
}

function isAllowed_(userId) {
  var list = CONFIG.ALLOWED_USER_IDS || [];
  if (!list.length) return true;
  return list.map(String).indexOf(String(userId)) !== -1;
}

// ---------------------------------------------------------------- آلبوم‌ها
/**
 * تلگرام هر عکس آلبوم را در یک آپدیت جدا می‌فرستد. اینجا:
 *  ۱) هر آیتم را در Script Properties کنار بقیه اعضای همان آلبوم می‌گذاریم
 *  ۲) کمی صبر می‌کنیم تا بقیه برسند
 *  ۳) اولین اکیزکیوشنی که بیدار شد، همه را آپلود می‌کند و یک پیام می‌فرستد
 */
function handleAlbum_(groupId, chatId, item, subfolder) {
  var key = 'album_' + groupId;
  var lock = LockService.getScriptLock();

  lock.waitLock(30000);
  try {
    var raw = PROPS.getProperty(key);
    var album = raw ? JSON.parse(raw) : { items: [], flushed: false };
    if (album.flushed) {
      // آلبوم قبلاً جمع‌بندی شده؛ آیتم دیررس را جدا ذخیره می‌کنیم
      album = { items: [], flushed: false };
      PROPS.deleteProperty(key);
    }
    album.items.push(item);
    PROPS.setProperty(key, JSON.stringify(album));
  } finally {
    lock.releaseLock();
  }

  Utilities.sleep(3000); // صبر برای رسیدن بقیه عکس‌های همان آلبوم

  flushAlbum_(key, chatId, subfolder);
}

/**
 * همه آیتم‌های یک آلبوم را برمی‌دارد و آپلود می‌کند.
 * فقط یک اجرا می‌تواند برنده شود (پرچم flushed) → یک پیام جمع‌بندی.
 */
function flushAlbum_(key, chatId, subfolder) {
  var toUpload = null;
  var lock = LockService.getScriptLock();

  lock.waitLock(30000);
  try {
    var fresh = PROPS.getProperty(key);
    if (!fresh) return;
    var data = JSON.parse(fresh);
    if (data.flushed) return;
    data.flushed = true;
    toUpload = data.items;
    PROPS.deleteProperty(key);
  } finally {
    lock.releaseLock();
  }

  if (!toUpload || !toUpload.length) return;

  var lines = [];
  var okCount = 0;
  for (var i = 0; i < toUpload.length; i++) {
    try {
      var f = saveItem_(toUpload[i], subfolder);
      okCount++;
      lines.push('• <a href="' + esc_(f.url) + '">' + esc_(f.name) + '</a>');
    } catch (err) {
      lines.push('⚠️ ' + esc_(friendlyError_(err)));
    }
  }

  var header = okCount
    ? '✅ ' + okCount + ' فایل در گوگل درایو ذخیره شد'
    : '⚠️ هیچ‌کدام ذخیره نشد';
  sendMessage_(chatId, header + '\n\n' + lines.join('\n'));
}

// ---------------------------------------------------------------- استخراج
function extractItem_(msg, stamp) {
  if (msg.photo && msg.photo.length) {
    return {
      kind: 'photo',
      fileId: msg.photo[msg.photo.length - 1].file_id,
      size: msg.photo[msg.photo.length - 1].file_size,
      name: 'photo_' + stamp + '.jpg',
      mime: 'image/jpeg',
      caption: msg.caption || ''
    };
  }
  if (msg.document) {
    var dn = msg.document.file_name || 'file_' + stamp;
    return {
      kind: 'file',
      fileId: msg.document.file_id,
      size: msg.document.file_size,
      name: safeName_(dn, 'file_' + stamp),
      mime: msg.document.mime_type || guessMime_(dn),
      caption: msg.caption || ''
    };
  }
  if (msg.video) {
    return {
      kind: 'video',
      fileId: msg.video.file_id,
      size: msg.video.file_size,
      name: safeName_(msg.video.file_name || 'video_' + stamp + '.mp4', 'video_' + stamp + '.mp4'),
      mime: msg.video.mime_type || 'video/mp4',
      caption: msg.caption || ''
    };
  }
  if (msg.audio) {
    return {
      kind: 'audio',
      fileId: msg.audio.file_id,
      size: msg.audio.file_size,
      name: safeName_(msg.audio.file_name || 'audio_' + stamp + '.mp3', 'audio_' + stamp + '.mp3'),
      mime: msg.audio.mime_type || 'audio/mpeg',
      caption: msg.caption || ''
    };
  }
  if (msg.voice) {
    return {
      kind: 'voice',
      fileId: msg.voice.file_id,
      size: msg.voice.file_size,
      name: 'voice_' + stamp + '.ogg',
      mime: msg.voice.mime_type || 'audio/ogg',
      caption: msg.caption || ''
    };
  }
  if (msg.video_note) {
    return {
      kind: 'video_note',
      fileId: msg.video_note.file_id,
      size: msg.video_note.file_size,
      name: 'videonote_' + stamp + '.mp4',
      mime: 'video/mp4',
      caption: ''
    };
  }
  if (msg.animation) {
    return {
      kind: 'animation',
      fileId: msg.animation.file_id,
      size: msg.animation.file_size,
      name: safeName_(msg.animation.file_name || 'animation_' + stamp + '.mp4', 'animation_' + stamp + '.mp4'),
      mime: msg.animation.mime_type || 'video/mp4',
      caption: msg.caption || ''
    };
  }
  if (msg.sticker) {
    var st = msg.sticker;
    var ext = st.is_animated ? 'tgs' : (st.is_video ? 'webm' : 'webp');
    return {
      kind: 'sticker',
      fileId: st.file_id,
      size: st.file_size,
      name: 'sticker_' + stamp + '.' + ext,
      mime: st.mime_type || 'application/octet-stream',
      caption: ''
    };
  }
  return null;
}

// ---------------------------------------------------------------- ذخیره
function saveItem_(item, subfolder) {
  if (item.size && item.size > CONFIG.MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error('فایل بزرگ‌تر از ' + CONFIG.MAX_UPLOAD_MB + ' مگابایت است (سقف Bot API تلگرام).');
  }

  var blob = downloadTelegramFile_(item.fileId, item.name, item.mime);
  var folder = targetFolder_(subfolder);
  var file = folder.createFile(blob.setName(item.name));
  if (item.caption) {
    try { file.setDescription(item.caption.slice(0, 1000)); } catch (ignore) {}
  }
  return { name: file.getName(), url: file.getUrl(), id: file.getId() };
}

function saveText_(text, stamp, subfolder) {
  var folder = targetFolder_(subfolder);
  var name = 'note_' + stamp;
  var file;
  if (CONFIG.TEXT_MODE === 'txt') {
    file = folder.createFile(name + '.txt', text, MimeType.PLAIN_TEXT);
  } else {
    file = folder.createFile(name, text, MimeType.GOOGLE_DOCS);
  }
  return { name: file.getName(), url: file.getUrl(), id: file.getId() };
}

function downloadTelegramFile_(fileId, name, mime) {
  var info = tg_('getFile', { file_id: fileId });
  if (!info || !info.ok) {
    throw new Error('گرفتن فایل از تلگرام شکست خورد: ' + JSON.stringify(info));
  }
  var path = info.result.file_path;
  if (!path) throw new Error('file_path برنگشت (فایل بزرگ‌تر از ۲۰MB است؟)');

  var res = UrlFetchApp.fetch(API + token_() + '/' + path, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('دانلود از تلگرام ناموفق بود (HTTP ' + res.getResponseCode() + ')');
  }
  return res.getBlob().setContentType(mime || 'application/octet-stream');
}

function targetFolder_(subfolderName) {
  var root = CONFIG.FOLDER_ID
    ? DriveApp.getFolderById(CONFIG.FOLDER_ID)
    : DriveApp.getRootFolder();

  if (!subfolderName) return root;

  var it = root.getFoldersByName(subfolderName);
  if (it.hasNext()) return it.next();
  return root.createFolder(subfolderName);
}

// ---------------------------------------------------------------- تلگرام
function tg_(method, payload) {
  var res = UrlFetchApp.fetch(API + token_() + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  var body;
  try { body = JSON.parse(res.getContentText()); } catch (err) { body = { ok: false, raw: res.getContentText() }; }
  if (code >= 400) {
    console.error(method + ' → HTTP ' + code + ' ' + res.getContentText());
  }
  return body;
}

function sendMessage_(chatId, html) {
  return tg_('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

// ---------------------------------------------------------------- کمکی‌ها
function formatDate_() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function formatStamp_() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd_HH-mm-ss');
}

function safeName_(name, fallback) {
  var n = String(name || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^[ .]+/, '').trim();
  if (!n) return fallback;
  if (n.length > 180) {
    var dot = n.lastIndexOf('.');
    if (dot > 0 && n.length - dot <= 10) {
      n = n.slice(0, 170) + n.slice(dot);
    } else {
      n = n.slice(0, 180);
    }
  }
  return n;
}

function guessMime_(name) {
  var ext = String(name || '').split('.').pop().toLowerCase();
  var map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', pdf: 'application/pdf', zip: 'application/zip',
    txt: 'text/plain', json: 'application/json', csv: 'text/csv',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', mp4: 'video/mp4', mov: 'video/quicktime',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return map[ext] || 'application/octet-stream';
}

function emojiFor_(kind) {
  var map = {
    photo: '🖼', file: '📄', video: '🎬', audio: '🎵',
    voice: '🎤', video_note: '⭕️', animation: '🎞', sticker: '🩷'
  };
  return map[kind] || '📄';
}

function friendlyError_(err) {
  var s = String(err && err.message ? err.message : err);
  if (s.indexOf('Service invoked too many times') !== -1 || s.indexOf('exceeded') !== -1) {
    return 'سهمیه روزانه Apps Script پر شد. فردا دوباره امتحان کن (یا فایل کمتری آپلود کن).';
  }
  if (s.indexOf('No item with the given ID') !== -1) {
    return 'پوشه مقصد پیدا نشد؛ FOLDER_ID را چک کن.';
  }
  return s;
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function textOut_(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT);
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
