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
  // توکن ربات از @BotFather
  // 🔐 بهتر است اینجا خالی بگذاری و توکن را در
  //    Project Settings ⚙️ → Script Properties → Add property
  //    با نام BOT_TOKEN و همان مقدار ذخیره کنی.
  BOT_TOKEN: '',

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

/** توکن از CONFIG یا از Script Properties خوانده می‌شود. */
function token_() {
  var t = CONFIG.BOT_TOKEN || PROPS.getProperty('BOT_TOKEN');
  if (!t) {
    throw new Error('BOT_TOKEN تنظیم نشده: در Script Properties با نام BOT_TOKEN ذخیره کن.');
  }
  return String(t).trim();
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

    // اگر پاسخ کند باشد، تلگرام همان آپدیت را دوباره می‌فرستد؛
    // با این کلید از ذخیره دوباره فایل جلوگیری می‌کنیم.
    if (update.update_id && seenBefore_('u' + update.update_id)) {
      return jsonOut_({ ok: true, note: 'duplicate' });
    }

    var msg = update.message || update.channel_post;
    if (!msg) return jsonOut_({ ok: true, note: 'ignored' });

    // از پاسخ سریع به تلگرام مطمئن می‌شویم (تایم‌اوت ۶۰ ثانیه‌ای تلگرام)
    handleMessage_(msg);
    return jsonOut_({ ok: true });
  } catch (err) {
    console.error('doPost failed: ' + err + '\n' + (err.stack || ''));
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (CONFIG.WEBHOOK_SECRET && p.k !== CONFIG.WEBHOOK_SECRET) {
    return textOut_('forbidden');
  }

  var action = p.action || 'ping';

  if (action === 'setup') {
    var me = tg_('getMe', {});
    if (!me || !me.ok) {
      return textOut_('❌ توکن ربات درست نیست یا ست نشده.\n' + JSON.stringify(me));
    }
    var url = ScriptApp.getService().getUrl() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
    tg_('deleteWebhook', { drop_pending_updates: false });
    var res = tg_('setWebhook', {
      url: url,
      allowed_updates: ['message', 'channel_post'],
      max_connections: 1
    });
    return textOut_(
      '✅ webhook ست شد\n\n' +
      'ربات: @' + ((me.result && me.result.username) || '?') + '\n' +
      'webhook: ' + url + '\n' +
      'نتیجه تلگرام: ' + JSON.stringify(res) + '\n\n' +
      'الان در تلگرام به ربات /start بده.'
    );
  }

  if (action === 'delete') {
    return textOut_(JSON.stringify(tg_('deleteWebhook', { drop_pending_updates: false }), null, 2));
  }

  if (action === 'info') {
    var info = tg_('getWebhookInfo', {});
    var me = tg_('getMe', {});
    return textOut_('me: ' + JSON.stringify(me) + '\n\nwebhookInfo: ' + JSON.stringify(info, null, 2));
  }

  return textOut_(
    'ربات فعال است.\n' +
    'برای ست کردن webhook: ?k=SECRET&action=setup\n' +
    'وضعیت: ?k=SECRET&action=info'
  );
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
      'دستورها: /folder لینک پوشه · /id آیدی من');
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
