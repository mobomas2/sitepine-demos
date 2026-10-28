/**
 * ==================================================================
 *  TELEGRAM -> GOOGLE DRIVE  .  SINGLE FILE PROJECT  .  v1.0
 *  Everything is in this one file. No other files, no deploy, no URL.
 *
 *  1) select the function  START  in the dropdown, press Run, Allow
 *  2) that is all - send anything to the bot, it lands in My Drive
 * ==================================================================
 *
 *  Functions: START (run once) . POLL (one round now) . STATUS . STOP
 */

var BOT_TOKEN  = '8621978100' +
                 ':' +
                 'AAG8JxpjmdRKzDVWNxmkK2-Uk27tR2BGNFU';
var TIMEZONE   = 'Asia/Tehran';
var FOLDER_ID  = '';            // empty = My Drive root
var BY_DATE    = true;          // true = subfolder 2026-10-28
var TEXT_MODE  = 'doc';         // 'doc' = Google Doc, 'txt' = plain text
var MAX_MB     = 19;
var ALLOWED    = [];            // e.g. [123456789]; empty = everyone
var VERSION    = 'single-1.0';

var API = 'https://api.telegram.org/bot' + BOT_TOKEN;


// ================================================================
//  1) START  -  run this once
// ================================================================
function START() {
  var log = [];
  function say(s) { log.push(s); Logger.log(s); }

  say('=== \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u0631\u0628\u0627\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u2192 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648 ===');
  say('\u0646\u0633\u062E\u0647: ' + VERSION);

  say('\u06F1) \u062A\u0633\u062A \u062A\u0648\u06A9\u0646...');
  var me = tg('getMe', {});
  if (!me || !me.ok) {
    say('\u274C \u062A\u0648\u06A9\u0646 \u0642\u0628\u0648\u0644 \u0646\u0634\u062F: ' + JSON.stringify(me));
    say('   \u062A\u0648\u06A9\u0646 \u0631\u0627 \u062F\u0631 @BotFather \u0628\u0631\u0631\u0633\u06CC/Revoke \u06A9\u0646.');
    return log.join('\n');
  }
  say('   \u2705 \u0631\u0628\u0627\u062A: @' + me.result.username);

  say('\u06F2) \u0628\u0631\u0631\u0633\u06CC \u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0647 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648...');
  var f = rootFolder();
  say('   \u2705 \u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F: ' + f.getName());
  say('   ' + f.getUrl());

  say('\u06F3) \u062D\u0630\u0641 webhook (\u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u062D\u0627\u0644\u062A polling)...');
  say('   ' + JSON.stringify(tg('deleteWebhook', { drop_pending_updates: false })));

  say('\u06F4) \u0646\u0635\u0628 \u062A\u0631\u06CC\u06AF\u0631 \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647...');
  var all = ScriptApp.getProjectTriggers();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'POLL') ScriptApp.deleteTrigger(all[i]);
  }
  ScriptApp.newTrigger('POLL').timeBased().everyMinutes(1).create();
  say('   \u2705 \u062A\u0631\u06CC\u06AF\u0631 \u0646\u0635\u0628 \u0634\u062F (\u062A\u0639\u062F\u0627\u062F: ' + countTriggers() + ')');

  say('\u06F5) \u067E\u0631\u062F\u0627\u0632\u0634 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u0645\u0639\u0644\u0642...');
  var n = POLL();
  say('   \u2705 ' + n + ' \u067E\u06CC\u0627\u0645 \u067E\u0631\u062F\u0627\u0632\u0634 \u0634\u062F');

  say('');
  say('\uD83C\uDF89 \u062A\u0645\u0627\u0645 \u0634\u062F. \u0647\u0645\u06CC\u0646 \u062D\u0627\u0644\u0627 \u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0628\u0647 \u0631\u0628\u0627\u062A \u067E\u06CC\u0627\u0645 \u0628\u062F\u0647.');
  say('   \u062A\u0627 \u06F1 \u062F\u0642\u06CC\u0642\u0647 \u062C\u0648\u0627\u0628 \u0645\u06CC\u200C\u062F\u0647\u062F (\u067E\u0627\u0633\u062E \u0641\u0648\u0631\u06CC: \u062A\u0627\u0628\u0639 POLL \u0631\u0627 Run \u06A9\u0646).');
  say('   \u0641\u0627\u06CC\u0644\u200C\u0647\u0627 \u062F\u0631: My Drive' + (BY_DATE ? ' / \u067E\u0648\u0634\u0647 \u062A\u0627\u0631\u06CC\u062E \u0627\u0645\u0631\u0648\u0632' : ''));
  return log.join('\n');
}


// ================================================================
//  2) POLL  -  runs every minute (installed by START)
// ================================================================
function POLL() {
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) { Logger.log('POLL: \u0627\u062C\u0631\u0627\u06CC \u0647\u0645\u200C\u0632\u0645\u0627\u0646\u060C \u0631\u062F \u0634\u062F'); return 0; }

  var done = 0;
  try {
    var offset = Number(props.getProperty('OFFSET') || 0);
    var req = { timeout: 0, limit: 20, allowed_updates: ['message', 'channel_post'] };
    if (offset) req.offset = offset;

    var res = tg('getUpdates', req);
    if (!res || !res.ok) {
      Logger.log('POLL: getUpdates \u062E\u0637\u0627 \u2192 ' + JSON.stringify(res));
      if (res && res.error_code === 409) tg('deleteWebhook', {});
      return 0;
    }

    var ups = res.result || [];
    if (!ups.length) { Logger.log('POLL: \u067E\u06CC\u0627\u0645 \u062C\u062F\u06CC\u062F\u06CC \u0646\u06CC\u0633\u062A (offset=' + offset + ')'); return 0; }

    // \u06AF\u0631\u0648\u0647\u200C\u0628\u0646\u062F\u06CC \u0622\u0644\u0628\u0648\u0645\u200C\u0647\u0627: \u0639\u06A9\u0633\u200C\u0647\u0627\u06CC \u06CC\u06A9 \u0622\u0644\u0628\u0648\u0645 \u0628\u0627 \u0647\u0645 \u067E\u0631\u062F\u0627\u0632\u0634 \u0645\u06CC\u200C\u0634\u0648\u0646\u062F
    var groups = {}, order = [];
    for (var i = 0; i < ups.length; i++) {
      var u = ups[i];
      offset = Math.max(offset, Number(u.update_id) + 1);
      var m = u.message || u.channel_post;
      if (!m) continue;
      var g = m.media_group_id;
      var key = g ? ('g:' + g) : ('m:' + u.update_id);
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(m);
    }

    for (var k = 0; k < order.length; k++) {
      var items = groups[order[k]];
      try {
        if (items.length === 1) { handleOne(items[0]); done++; }
        else { handleAlbum(items); done += items.length; }
      } catch (e) {
        Logger.log('POLL \u062E\u0637\u0627\u06CC \u067E\u0631\u062F\u0627\u0632\u0634: ' + e);
      }
    }

    props.setProperty('OFFSET', String(offset));
    Logger.log('POLL: ' + ups.length + ' \u062F\u0631\u06CC\u0627\u0641\u062A\u060C ' + done + ' \u067E\u0631\u062F\u0627\u0632\u0634\u060C offset=' + offset);
  } finally {
    lock.releaseLock();
  }
  return done;
}


// ================================================================
//  3) STATUS / 4) STOP
// ================================================================
function STATUS() {
  var props = PropertiesService.getScriptProperties();
  var out = [];
  out.push('\u0646\u0633\u062E\u0647: ' + VERSION);
  var me = tg('getMe', {});
  out.push('\u062A\u0648\u06A9\u0646: ' + (me && me.ok ? '\u2705 @' + me.result.username : '\u274C ' + JSON.stringify(me)));
  try { out.push('\u067E\u0648\u0634\u0647: \u2705 ' + rootFolder().getName()); }
  catch (e) { out.push('\u067E\u0648\u0634\u0647: \u274C ' + e); }
  out.push('\u062A\u0631\u06CC\u06AF\u0631 POLL: ' + countTriggers());
  out.push('offset: ' + (props.getProperty('OFFSET') || '(\u062E\u0627\u0644\u06CC)'));
  var info = tg('getWebhookInfo', {});
  if (info && info.ok) {
    out.push('webhook: ' + (info.result.url || '(\u062D\u0630\u0641 \u0634\u062F\u0647 \u2705)'));
    out.push('pending: ' + (info.result.pending_update_count || 0));
    out.push('last_error: ' + (info.result.last_error_message || '\u0646\u062F\u0627\u0631\u062F \u2705'));
  }
  out.push('\u0622\u062E\u0631\u06CC\u0646 \u0622\u067E\u062F\u06CC\u062A: ' + (props.getProperty('LAST') || '(\u0647\u06CC\u0686)'));
  var report = out.join('\n');
  Logger.log(report);
  return report;
}

function STOP() {
  var all = ScriptApp.getProjectTriggers();
  var rm = 0;
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'POLL') { ScriptApp.deleteTrigger(all[i]); rm++; }
  }
  var out = '\u062A\u0631\u06CC\u06AF\u0631\u0647\u0627\u06CC \u062D\u0630\u0641\u200C\u0634\u062F\u0647: ' + rm + '\n\u067E\u0627\u0633\u062E \u062A\u0644\u06AF\u0631\u0627\u0645: ' +
            JSON.stringify(tg('deleteWebhook', { drop_pending_updates: true }));
  Logger.log(out);
  return out;
}


// ================================================================
//  \u067E\u0631\u062F\u0627\u0632\u0634 \u067E\u06CC\u0627\u0645
// ================================================================
function handleOne(msg) {
  var chatId = msg.chat && msg.chat.id;
  if (!chatId) return;

  remember(msg);

  if (msg.text && msg.text.charAt(0) === '/') return command(msg, chatId);

  if (!allowed(msg.from && msg.from.id)) {
    return send(chatId, '\u26D4\uFE0F \u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u062E\u0635\u0648\u0635\u06CC \u0627\u0633\u062A.\n\u0622\u06CC\u062F\u06CC \u0639\u062F\u062F\u06CC \u062A\u0648: <code>' +
      (msg.from && msg.from.id) + '</code>');
  }

  var stamp = now('yyyy-MM-dd_HH-mm-ss');
  var sub = BY_DATE ? now('yyyy-MM-dd') : null;

  if (msg.text) return saveText(msg.text, stamp, sub, chatId);

  var item = mediaOf(msg, stamp);
  if (!item) return send(chatId, '\uD83E\uDD14 \u0627\u06CC\u0646 \u0646\u0648\u0639 \u067E\u06CC\u0627\u0645 \u0631\u0627 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0645 \u0630\u062E\u06CC\u0631\u0647 \u06A9\u0646\u0645.');

  try {
    var file = upload(item, sub, msg.caption);
    send(chatId, '\u2705 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F\n' + icon(item.kind) +
      ' <a href="' + file.getUrl() + '">' + esc(file.getName()) + '</a>');
  } catch (e) {
    send(chatId, '\u26A0\uFE0F ' + esc(e));
  }
}

function handleAlbum(items) {
  var chatId = items[0].chat && items[0].chat.id;
  if (!chatId) return;
  remember(items[0]);

  if (!allowed(items[0].from && items[0].from.id)) {
    return send(chatId, '\u26D4\uFE0F \u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u062E\u0635\u0648\u0635\u06CC \u0627\u0633\u062A.');
  }

  var stamp = now('yyyy-MM-dd_HH-mm-ss');
  var sub = BY_DATE ? now('yyyy-MM-dd') : null;
  var caption = items[0].caption || '';
  var lines = [], ok = 0;

  for (var i = 0; i < items.length; i++) {
    var item = mediaOf(items[i], stamp + '_' + (i + 1));
    if (!item) continue;
    try {
      var file = upload(item, sub, items[i].caption || caption);
      ok++;
      lines.push('\u2022 <a href="' + file.getUrl() + '">' + esc(file.getName()) + '</a>');
    } catch (e) {
      lines.push('\u26A0\uFE0F ' + esc(e));
    }
  }

  var header = ok ? '\u2705 ' + ok + ' \u0641\u0627\u06CC\u0644 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F' : '\u26A0\uFE0F \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F';
  send(chatId, header + '\n\n' + lines.join('\n'));
}

function upload(item, sub, caption) {
  if (item.size && item.size > MAX_MB * 1024 * 1024) {
    throw new Error('\u0641\u0627\u06CC\u0644 \u0628\u0632\u0631\u06AF\u200C\u062A\u0631 \u0627\u0632 ' + MAX_MB + ' \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A \u0627\u0633\u062A (\u0633\u0642\u0641 \u062A\u0644\u06AF\u0631\u0627\u0645).');
  }

  var bytes = download(item.fileId);
  var file = createFileSafe(targetFolder(sub), bytes, item.mime, item.name);

  if (caption) { try { file.setDescription(caption.slice(0, 1000)); } catch (ignore) {} }
  return file;
}

/**
 * MIME \u0631\u0627 \u062A\u0645\u06CC\u0632 \u0645\u06CC\u200C\u06A9\u0646\u062F.
 * DriveApp \u0628\u0627 \u0647\u0631 \u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 (\u062E\u0627\u0644\u06CC\u060C \u06CC\u0627 \u0686\u06CC\u0632\u06CC \u0645\u062B\u0644 \u00AB; charset=\u2026\u00BB \u06CC\u0627 \u0646\u0648\u0639 \u06AF\u0648\u06AF\u0644)
 * \u062E\u0637\u0627\u06CC \u00ABInvalid argument: file.contentType\u00BB \u0645\u06CC\u200C\u062F\u0647\u062F.
 */
function safeMime(mime) {
  var m = String(mime || '').split(';')[0].trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/.test(m)) return 'application/octet-stream';
  if (m.indexOf('vnd.google-apps') !== -1) return 'application/octet-stream';
  return m;
}

/**
 * \u0633\u0627\u062E\u062A \u0641\u0627\u06CC\u0644 \u0628\u0627 \u0686\u0646\u062F \u0645\u0633\u06CC\u0631 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646:
 *   \u06F1) \u0628\u0627 MIME \u0627\u0635\u0644\u06CC
 *   \u06F2) \u0628\u0627 application/octet-stream
 *   \u06F3) \u0628\u0627 octet-stream \u0648 \u067E\u0633\u0648\u0646\u062F .bin
 * \u0627\u06CC\u0646\u200C\u0637\u0648\u0631 \u0647\u0631 \u0641\u0627\u06CC\u0644\u06CC (\u0639\u06A9\u0633 \u0627\u06CC\u0646\u0633\u062A\u0627\u06AF\u0631\u0627\u0645\u060C \u0648\u06CC\u062F\u06CC\u0648\u060C \u0633\u0646\u062F \u0639\u062C\u06CC\u0628) \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.
 */
function createFileSafe(folder, bytes, mime, name) {
  if (!bytes || !bytes.length) {
    throw new Error('\u0641\u0627\u06CC\u0644 \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u062E\u0627\u0644\u06CC \u0631\u0633\u06CC\u062F (\u062F\u0648\u0628\u0627\u0631\u0647 \u0628\u0641\u0631\u0633\u062A).');
  }
  var fileName = cleanName(name);
  var attempts = [
    { mime: safeMime(mime), name: fileName },
    { mime: 'application/octet-stream', name: fileName },
    { mime: 'application/octet-stream', name: fileName.replace(/\.[^.]{0,6}$/, '') + '.bin' }
  ];

  var lastErr = null;
  for (var i = 0; i < attempts.length; i++) {
    try {
      return folder.createFile(Utilities.newBlob(bytes, attempts[i].mime, attempts[i].name));
    } catch (e) {
      lastErr = e;
      Logger.log('createFile \u062A\u0644\u0627\u0634 ' + (i + 1) + ' \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F (' + attempts[i].mime + '): ' + e);
    }
  }
  throw new Error('\u0630\u062E\u06CC\u0631\u0647 \u0641\u0627\u06CC\u0644 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F: ' + lastErr);
}

function saveText(text, stamp, sub, chatId) {
  var folder = targetFolder(sub);
  var name = 'note_' + stamp;

  // \u06F1) \u0641\u0627\u06CC\u0644 \u0645\u062A\u0646\u06CC \u0633\u0627\u062F\u0647
  if (TEXT_MODE === 'txt') {
    try {
      var txt = folder.createFile(name + '.txt', text, MimeType.PLAIN_TEXT);
      return send(chatId, '\u2705 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F\n\uD83D\uDCDD <a href="' + txt.getUrl() + '">' +
        esc(txt.getName()) + '</a>');
    } catch (e) {
      return send(chatId, '\u26A0\uFE0F ' + esc(e));
    }
  }

  // \u06F2) \u0633\u0646\u062F \u06AF\u0648\u06AF\u0644 \u2014 \u0628\u0627\u06CC\u062F \u0628\u0627 DocumentApp \u0633\u0627\u062E\u062A\u0647 \u0634\u0648\u062F\u060C \u0646\u0647 createFile(\u2026, GOOGLE_DOCS)
  try {
    var doc = DocumentApp.create(name);
    doc.getBody().setText(text);
    doc.saveAndClose();
    var file = DriveApp.getFileById(doc.getId());
    file.moveTo(folder);
    return send(chatId, '\u2705 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F\n\uD83D\uDCDD <a href="' + file.getUrl() + '">' +
      esc(file.getName()) + '</a>');
  } catch (e) {
    // \u067E\u0634\u062A\u06CC\u0628\u0627\u0646: \u0641\u0627\u06CC\u0644 \u0645\u062A\u0646\u06CC \u0633\u0627\u062F\u0647
    try {
      var alt = folder.createFile(name + '.txt', text, MimeType.PLAIN_TEXT);
      return send(chatId, '\u2705 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F (\u0628\u0647\u200C\u0635\u0648\u0631\u062A \u0641\u0627\u06CC\u0644 \u0645\u062A\u0646\u06CC)\n\uD83D\uDCDD <a href="' + alt.getUrl() +
        '">' + esc(alt.getName()) + '</a>');
    } catch (e2) {
      return send(chatId, '\u26A0\uFE0F ' + esc(e));
    }
  }
}

function command(msg, chatId) {
  var cmd = msg.text.split(/\s+/)[0].replace(/@.*$/, '').toLowerCase();

  if (cmd === '/ping') return send(chatId, '\uD83C\uDFD3 pong \u2014 \u0631\u0628\u0627\u062A \u0632\u0646\u062F\u0647 \u0627\u0633\u062A.');
  if (cmd === '/id') return send(chatId,
    '\u0622\u06CC\u062F\u06CC \u0686\u062A: <code>' + chatId + '</code>\n\u0622\u06CC\u062F\u06CC \u062A\u0648: <code>' + (msg.from && msg.from.id) + '</code>');

  if (cmd === '/folder') {
    var f = rootFolder();
    return send(chatId, '\uD83D\uDCC1 <a href="' + f.getUrl() + '">' + esc(f.getName()) + '</a>');
  }

  if (cmd === '/start' || cmd === '/help') {
    var me = tg('getMe', {}) || {};
    var uname = (me.result && me.result.username) || '';
    var root = rootFolder();
    return send(chatId,
      '\u0633\u0644\u0627\u0645 \uD83D\uDC4B\n\u0647\u0631 \u0686\u06CC\u0632\u06CC \u0628\u0631\u0627\u06CC\u0645 \u0628\u0641\u0631\u0633\u062A\u06CC \u062F\u0631 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u0645.\n\n' +
      '\uD83D\uDCC1 \u0645\u0642\u0635\u062F: <a href="' + root.getUrl() + '">' + esc(root.getName()) + '</a>\n\n' +
      '\uD83D\uDCDD \u0645\u062A\u0646 (\u0633\u0646\u062F \u06AF\u0648\u06AF\u0644) \u00B7 \uD83D\uDDBC \u0639\u06A9\u0633 \u00B7 \uD83D\uDCC4 \u0641\u0627\u06CC\u0644 \u00B7 \uD83C\uDFAC \u0648\u06CC\u062F\u06CC\u0648 \u00B7 \uD83C\uDFB5 \u0645\u0648\u0632\u06CC\u06A9 \u00B7 \uD83C\uDFA4 \u0648\u06CC\u0633\n' +
      '\uD83D\uDDBC \u0686\u0646\u062F \u0639\u06A9\u0633 \u0628\u0627 \u0647\u0645 (\u0622\u0644\u0628\u0648\u0645) \u0647\u0645 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0645\u06CC\u200C\u0634\u0648\u062F.\n\n' +
      '\uD83C\uDD94 \u0622\u06CC\u062F\u06CC \u062A\u0648: <code>' + (msg.from && msg.from.id) + '</code>\n' +
      '\uD83E\uDD16 \u0631\u0628\u0627\u062A: @' + esc(uname) + '\n\n' +
      '\u062F\u0633\u062A\u0648\u0631\u0647\u0627: /folder \u00B7 /id \u00B7 /ping');
  }

  return send(chatId, '\u062F\u0633\u062A\u0648\u0631 \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647. \u0628\u0646\u0648\u06CC\u0633 /help');
}


// ================================================================
//  \u0627\u0628\u0632\u0627\u0631\u0647\u0627
// ================================================================
function mediaOf(msg, stamp) {
  if (msg.photo && msg.photo.length) {
    var p = msg.photo[msg.photo.length - 1];
    return { kind: 'photo', fileId: p.file_id, size: p.file_size,
             name: 'photo_' + stamp + '.jpg', mime: 'image/jpeg' };
  }
  if (msg.document) return { kind: 'file', fileId: msg.document.file_id,
    size: msg.document.file_size,
    name: clean(msg.document.file_name || ('file_' + stamp)),
    mime: msg.document.mime_type || 'application/octet-stream' };
  if (msg.video) return { kind: 'video', fileId: msg.video.file_id,
    size: msg.video.file_size,
    name: clean(msg.video.file_name || ('video_' + stamp + '.mp4')),
    mime: msg.video.mime_type || 'video/mp4' };
  if (msg.audio) return { kind: 'audio', fileId: msg.audio.file_id,
    size: msg.audio.file_size,
    name: clean(msg.audio.file_name || ('audio_' + stamp + '.mp3')),
    mime: msg.audio.mime_type || 'audio/mpeg' };
  if (msg.voice) return { kind: 'voice', fileId: msg.voice.file_id,
    size: msg.voice.file_size, name: 'voice_' + stamp + '.ogg',
    mime: msg.voice.mime_type || 'audio/ogg' };
  if (msg.video_note) return { kind: 'note', fileId: msg.video_note.file_id,
    size: msg.video_note.file_size, name: 'videonote_' + stamp + '.mp4',
    mime: 'video/mp4' };
  if (msg.animation) return { kind: 'gif', fileId: msg.animation.file_id,
    size: msg.animation.file_size,
    name: clean(msg.animation.file_name || ('animation_' + stamp + '.mp4')),
    mime: msg.animation.mime_type || 'video/mp4' };
  if (msg.sticker) {
    var st = msg.sticker;
    return { kind: 'sticker', fileId: st.file_id, size: st.file_size,
      name: 'sticker_' + stamp + (st.is_animated ? '.tgs' : (st.is_video ? '.webm' : '.webp')),
      mime: st.mime_type || 'application/octet-stream' };
  }
  return null;
}

function download(fileId) {
  var info = tg('getFile', { file_id: fileId });
  if (!info || !info.ok) throw new Error('\u06AF\u0631\u0641\u062A\u0646 \u0641\u0627\u06CC\u0644 \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F');
  var path = info.result.file_path;
  if (!path) throw new Error('\u0641\u0627\u06CC\u0644 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A (\u0628\u0627\u0644\u0627\u06CC \u06F2\u06F0MB\u061F)');

  var res = UrlFetchApp.fetch(API + '/' + path, { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) {
    throw new Error('\u062F\u0627\u0646\u0644\u0648\u062F \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0646\u0627\u0645\u0648\u0641\u0642: HTTP ' + res.getResponseCode());
  }
  return res.getContent();   // byte[] \u2014 blob \u0631\u0627 \u062E\u0648\u062F\u0645\u0627\u0646 \u0628\u0627 MIME \u062A\u0645\u06CC\u0632 \u0645\u06CC\u200C\u0633\u0627\u0632\u06CC\u0645
}

function rootFolder() {
  return FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID) : DriveApp.getRootFolder();
}

function targetFolder(name) {
  var root = rootFolder();
  if (!name) return root;
  var it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

function tg(method, payload) {
  var res = UrlFetchApp.fetch(API + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });
  var body;
  try { body = JSON.parse(res.getContentText()); }
  catch (e) { body = { ok: false, raw: res.getContentText() }; }
  if (res.getResponseCode() >= 400) Logger.log(method + ' \u2192 ' + res.getContentText());
  return body;
}

function send(chatId, html) {
  return tg('sendMessage', {
    chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true
  });
}

function remember(msg) {
  try {
    PropertiesService.getScriptProperties().setProperty('LAST',
      new Date().toISOString() + ' | chat=' + (msg.chat && msg.chat.id) +
      ' | ' + (msg.text ? 'text' : 'media'));
  } catch (ignore) {}
}

function allowed(userId) {
  if (!ALLOWED || !ALLOWED.length) return true;
  return ALLOWED.map(String).indexOf(String(userId)) !== -1;
}

function countTriggers() {
  var all = ScriptApp.getProjectTriggers();
  var n = 0;
  for (var i = 0; i < all.length; i++) if (all[i].getHandlerFunction() === 'POLL') n++;
  return n;
}

function now(fmt) { return Utilities.formatDate(new Date(), TIMEZONE, fmt); }

function cleanName(n) { return clean(n); }

function clean(n) {
  var s = String(n || '').replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^[ .]+/, '').trim();
  return s || ('file_' + new Date().getTime());
}

function icon(kind) {
  return { photo: '\uD83D\uDDBC', file: '\uD83D\uDCC4', video: '\uD83C\uDFAC', audio: '\uD83C\uDFB5', voice: '\uD83C\uDFA4',
           note: '\u2B55\uFE0F', gif: '\uD83C\uDF9E', sticker: '\uD83E\uDE77' }[kind] || '\uD83D\uDCC4';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
