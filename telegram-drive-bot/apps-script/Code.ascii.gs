/**
 * ================================================================
 *  TELEGRAM -> GOOGLE DRIVE  (ASCII-SAFE BUILD)   v polling-2026-10-28
 *
 *  THIS FILE IS 100% PLAIN ASCII (Persian text is \uXXXX escaped),
 *  so copy/paste can never break the syntax.
 *
 *  IF THE BOT IS SILENT (telegram says: 302 Found):
 *     In the editor choose the function  setupPollingNow  and press Run.
 *     That is all - no URL, no secret, no public access needed.
 *
 *  Normal (webhook) mode: <WEB_APP_URL>?k=SECRET&action=setup
 *  Debug:  &action=diag | &action=posttest | &action=replay
 *          &action=pollnow | &action=stoppolling
 *          &action=sendtest&chat=CHAT_ID
 *
 *  Generated from Code.gs - keep the two in sync.
 * ================================================================
 */
/**
 * ============================================================================
 *  \u0631\u0628\u0627\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u2192 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648\u060C \u06A9\u0627\u0645\u0644\u0627\u064B \u062F\u0627\u062E\u0644 Google Apps Script
 *  \u0628\u062F\u0648\u0646 Google Cloud Console\u060C \u0628\u062F\u0648\u0646 \u0633\u0631\u0648\u0631\u060C \u0628\u062F\u0648\u0646 OAuth client
 *  (\u0645\u0646\u0627\u0633\u0628 \u0627\u06A9\u0627\u0646\u062A\u200C\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u062F\u0631 Cloud Console \u0628\u0646 \u0634\u062F\u0647\u200C\u0627\u0646\u062F)
 * ============================================================================
 *
 *  \u0645\u0631\u0627\u062D\u0644 \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC (\u06A9\u0627\u0645\u0644\u0634 \u062F\u0631 README.md \u0647\u0645\u06CC\u0646 \u067E\u0648\u0634\u0647):
 *   1) script.google.com \u2192 New project
 *   2) \u06A9\u0644 \u0627\u06CC\u0646 \u0641\u0627\u06CC\u0644 \u0631\u0627 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u06A9\u062F \u0646\u0645\u0648\u0646\u0647 \u06A9\u0646
 *   3) \u0686\u0647\u0627\u0631 \u0645\u0642\u062F\u0627\u0631 \u067E\u0627\u06CC\u06CC\u0646 (CONFIG) \u0631\u0627 \u067E\u0631 \u06A9\u0646
 *   4) Deploy \u2192 New deployment \u2192 Web app \u2192 Execute as: Me\u060C Who has access: Anyone
 *   5) URL \u0631\u0627 \u0628\u0627\u0632 \u06A9\u0646:  <WEB_APP_URL>?k=<WEBHOOK_SECRET>&action=setup
 *      (\u062E\u0648\u062F\u0634 webhook \u062A\u0644\u06AF\u0631\u0627\u0645 \u0631\u0627 \u0633\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F)
 */

// ============================ CONFIG =======================================
var CONFIG = {
  // \uD83D\uDD11 \u062A\u0648\u06A9\u0646 \u0631\u0628\u0627\u062A \u0627\u0632 @BotFather \u0631\u0627 \u0628\u06CC\u0646 \u062F\u0648 \u06A9\u0648\u062A\u06CC\u0634\u0646 \u0627\u06CC\u0646\u062C\u0627 \u0628\u06AF\u0630\u0627\u0631:
  //    BOT_TOKEN: '8621978100:AAH...',
  //    (\u06CC\u0627 \u0627\u06CC\u0646\u062C\u0627 \u0631\u0627 \u062E\u0627\u0644\u06CC \u0628\u06AF\u0630\u0627\u0631 \u0648 \u062F\u0631 Project Settings \u2699\uFE0F \u2192 Script Properties
  //     \u0628\u0627 \u0646\u0627\u0645 BOT_TOKEN \u0630\u062E\u06CC\u0631\u0647 \u06A9\u0646)
  BOT_TOKEN: 'PUT-YOUR-NEW-BOT-TOKEN-HERE',

  // \u0622\u06CC\u062F\u06CC \u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F \u062F\u0631 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648 (\u0628\u0639\u062F \u0627\u0632 /folders/ \u062F\u0631 \u0622\u062F\u0631\u0633 \u067E\u0648\u0634\u0647)
  // \u062E\u0627\u0644\u06CC \u0628\u06AF\u0630\u0627\u0631 \u2192 \u062F\u0631 \u0631\u06CC\u0634\u0647 \u062F\u0631\u0627\u06CC\u0648 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F
  FOLDER_ID: '',

  // \u06CC\u06A9 \u0631\u0634\u062A\u0647 \u062A\u0635\u0627\u062F\u0641\u06CC \u0637\u0648\u0644\u0627\u0646\u06CC. \u062F\u0627\u062E\u0644 \u0622\u062F\u0631\u0633 webhook \u0645\u06CC\u200C\u0631\u0648\u062F \u062A\u0627 \u06A9\u0633\u06CC \u062F\u06CC\u06AF\u0631\u06CC \u0646\u062A\u0648\u0627\u0646\u062F
  // \u0628\u0631\u0627\u06CC \u0627\u0633\u06A9\u0631\u06CC\u067E\u062A \u062A\u0648 \u0622\u067E\u0644\u0648\u062F \u06A9\u0646\u062F. \u0639\u0648\u0636\u0634 \u06A9\u0646!
  WEBHOOK_SECRET: 'change-this-to-a-long-random-string',

  // \u0641\u0642\u0637 \u0627\u06CC\u0646 \u06A9\u0627\u0631\u0628\u0631\u0647\u0627\u06CC \u062A\u0644\u06AF\u0631\u0627\u0645 \u0627\u062C\u0627\u0632\u0647 \u0622\u067E\u0644\u0648\u062F \u062F\u0627\u0631\u0646\u062F. \u062E\u0627\u0644\u06CC = \u0647\u0645\u0647.
  // \u0622\u06CC\u062F\u06CC \u0639\u062F\u062F\u06CC \u062E\u0648\u062F\u062A \u0631\u0627 \u0628\u0639\u062F \u0627\u0632 \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u0628\u0627 /id \u0627\u0632 \u0631\u0628\u0627\u062A \u0628\u06AF\u06CC\u0631 \u0648 \u0627\u06CC\u0646\u062C\u0627 \u0628\u06AF\u0630\u0627\u0631.
  ALLOWED_USER_IDS: [],

  // 'date' \u2192 \u0632\u06CC\u0631\u067E\u0648\u0634\u0647 \u062A\u0627\u0631\u06CC\u062E\u200C\u062F\u0627\u0631 (2026-10-28) | 'none' \u2192 \u0647\u0645\u0647 \u062F\u0631 \u067E\u0648\u0634\u0647 \u0627\u0635\u0644\u06CC
  SUBFOLDER_MODE: 'date',

  // 'doc' \u2192 \u0645\u062A\u0646\u200C\u0647\u0627 \u0633\u0646\u062F \u06AF\u0648\u06AF\u0644 \u0645\u06CC\u200C\u0634\u0648\u0646\u062F | 'txt' \u2192 \u0641\u0627\u06CC\u0644 .txt
  TEXT_MODE: 'doc',

  // \u0633\u0642\u0641 \u062D\u062C\u0645 \u0641\u0627\u06CC\u0644 (\u0645\u06AF\u0627\u0628\u0627\u06CC\u062A). \u0633\u0642\u0641 \u062F\u0627\u0646\u0644\u0648\u062F Bot API = \u06F2\u06F0
  MAX_UPLOAD_MB: 19,

  // \u0645\u0646\u0637\u0642\u0647 \u0632\u0645\u0627\u0646\u06CC \u0646\u0627\u0645 \u067E\u0648\u0634\u0647/\u0641\u0627\u06CC\u0644
  TIMEZONE: 'Asia/Tehran'
};
// ===========================================================================

var CODE_VERSION = 'polling-2026-10-28';
var API = 'https://api.telegram.org/bot';
var PROPS = PropertiesService.getScriptProperties();

/** true \u0627\u06AF\u0631 \u0627\u06CC\u0646 \u06A9\u0644\u06CC\u062F \u0642\u0628\u0644\u0627\u064B \u067E\u0631\u062F\u0627\u0632\u0634 \u0634\u062F\u0647 \u0628\u0627\u0634\u062F (\u0636\u062F \u062A\u06A9\u0631\u0627\u0631 \u0634\u062F\u0646 \u0622\u067E\u0644\u0648\u062F). */
function seenBefore_(key) {
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get(key)) return true;
    cache.put(key, '1', 21600); // \u06F6 \u0633\u0627\u0639\u062A
  } catch (ignore) {
    // \u0627\u06AF\u0631 \u06A9\u0634 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u0628\u0648\u062F\u060C \u06A9\u0627\u0631 \u0631\u0627 \u0645\u062A\u0648\u0642\u0641 \u0646\u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645
  }
  return false;
}

/**
 * \u062A\u0648\u06A9\u0646 \u0641\u0639\u0644\u06CC\u060C \u06CC\u0627 '' \u0627\u06AF\u0631 \u0647\u0646\u0648\u0632 \u062C\u0627\u06CC\u200C\u06AF\u0630\u0627\u0631\u06CC \u0646\u0634\u062F\u0647 \u0628\u0627\u0634\u062F.
 * \u0627\u0648\u0644 CONFIG.BOT_TOKEN\u060C \u0628\u0639\u062F Script Properties. \u0645\u0642\u062F\u0627\u0631 \u0646\u0645\u0648\u0646\u0647 \u0646\u0627\u062F\u06CC\u062F\u0647 \u06AF\u0631\u0641\u062A\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.
 */
function currentToken_() {
  var candidates = [CONFIG.BOT_TOKEN, PROPS.getProperty('BOT_TOKEN')];
  for (var i = 0; i < candidates.length; i++) {
    var t = String(candidates[i] || '').trim().replace(/^['"]+|['"]+$/g, '');
    if (!t) continue;
    if (/^(PUT|PASTE|YOUR|\u062A\u0648\u06A9\u0646)/i.test(t)) continue;   // placeholder
    if (t.indexOf('...') !== -1) continue;             // 123456:AAH...
    if (t.length < 20) continue;                       // \u062E\u06CC\u0644\u06CC \u06A9\u0648\u062A\u0627\u0647 \u2192 \u062A\u0648\u06A9\u0646 \u0646\u06CC\u0633\u062A
    return t;
  }
  return '';
}

/** \u062A\u0648\u06A9\u0646 \u06CC\u0627 \u062E\u0637\u0627\u06CC \u0648\u0627\u0636\u062D. */
function token_() {
  var t = currentToken_();
  if (!t) {
    throw new Error(
      '\u062A\u0648\u06A9\u0646 \u0631\u0628\u0627\u062A \u062A\u0646\u0638\u06CC\u0645 \u0646\u0634\u062F\u0647. \u062F\u0631 \u0628\u0627\u0644\u0627\u06CC \u06A9\u062F\u060C BOT_TOKEN \u0631\u0627 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u06A9\u0646 ' +
      "\u0645\u062B\u0644\u0627\u064B BOT_TOKEN: '123456:AAH...'  (\u06CC\u0627 \u062F\u0631 Script Properties \u0628\u0627 \u0646\u0627\u0645 BOT_TOKEN \u0630\u062E\u06CC\u0631\u0647 \u06A9\u0646)"
    );
  }
  return t;
}

/**
 * \u067E\u0627\u0631\u0627\u0645\u062A\u0631\u0647\u0627\u06CC URL \u0631\u0627 \u062A\u0645\u06CC\u0632 \u0645\u06CC\u200C\u06A9\u0646\u062F.
 * \u0627\u06AF\u0631 \u06A9\u0633\u06CC \u0622\u062F\u0631\u0633 \u0631\u0627 \u0628\u0627 &amp; (\u0627\u0686\u200C\u062A\u06CC\u200C\u0627\u0645\u200C\u0627\u0644\u200C\u0634\u062F\u0647) \u06A9\u067E\u06CC \u06A9\u0646\u062F\u060C \u06A9\u0644\u06CC\u062F \u0645\u06CC\u200C\u0634\u0648\u062F \u00ABamp;action\u00BB\u061B
 * \u0627\u06CC\u0646\u062C\u0627 \u062F\u0631\u0633\u062A\u0634 \u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645 \u062A\u0627 \u0647\u0645\u06CC\u0634\u0647 \u06A9\u0627\u0631 \u06A9\u0646\u062F.
 */
function normalizeParams_(e) {
  var raw = (e && e.parameter) || {};
  var out = {};
  for (var key in raw) {
    if (!raw.hasOwnProperty(key)) continue;
    var clean = String(key).replace(/^(amp;)+/i, '');
    out[clean] = raw[key];
    if (clean !== key) out[key] = raw[key];
  }
  return out;
}

// ---------------------------------------------------------------- \u0648\u0631\u0648\u062F\u06CC\u200C\u0647\u0627
function doPost(e) {
  try {
    var params = normalizeParams_(e);
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
 * \u06CC\u06A9 \u0622\u067E\u062F\u06CC\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u0631\u0627 \u067E\u0631\u062F\u0627\u0632\u0634 \u0645\u06CC\u200C\u06A9\u0646\u062F (\u0647\u0645 \u0627\u0632 webhook\u060C \u0647\u0645 \u0627\u0632 action=replay).
 * \u062E\u0631\u0648\u062C\u06CC: 'done' | 'duplicate' | 'ignored'
 */
function processUpdate_(update) {
  // \u0631\u062F\u067E\u0627\u06CC \u0622\u062E\u0631\u06CC\u0646 \u0622\u067E\u062F\u06CC\u062A \u062F\u0631\u06CC\u0627\u0641\u062A\u06CC \u2014 \u0628\u0631\u0627\u06CC \u0639\u06CC\u0628\u200C\u06CC\u0627\u0628\u06CC (action=diag)
  try {
    PROPS.setProperty('LAST_UPDATE', JSON.stringify({
      update_id: update.update_id || 0,
      at: new Date().toISOString(),
      has_message: !!(update.message || update.channel_post)
    }));
  } catch (ignore) {}

  // \u0627\u06AF\u0631 \u067E\u0627\u0633\u062E \u06A9\u0646\u062F \u0628\u0627\u0634\u062F\u060C \u062A\u0644\u06AF\u0631\u0627\u0645 \u0647\u0645\u0627\u0646 \u0622\u067E\u062F\u06CC\u062A \u0631\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u0645\u06CC\u200C\u0641\u0631\u0633\u062A\u062F\u061B
  // \u0628\u0627 \u0627\u06CC\u0646 \u06A9\u0644\u06CC\u062F \u0627\u0632 \u0630\u062E\u06CC\u0631\u0647 \u062F\u0648\u0628\u0627\u0631\u0647 \u0641\u0627\u06CC\u0644 \u062C\u0644\u0648\u06AF\u06CC\u0631\u06CC \u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645.
  if (update.update_id && seenBefore_('u' + update.update_id)) {
    return 'duplicate';
  }

  var msg = update.message || update.channel_post;
  if (!msg) return 'ignored';

  handleMessage_(msg);
  return 'done';
}

function doGet(e) {
  // \u0647\u06CC\u0686\u200C\u0648\u0642\u062A \u062E\u0637\u0627 \u067E\u0631\u062A \u0646\u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645\u061B \u0647\u0645\u06CC\u0634\u0647 \u06CC\u06A9 \u0635\u0641\u062D\u0647 \u0645\u062A\u0646\u06CC \u0645\u06CC\u200C\u062F\u0647\u06CC\u0645 \u062A\u0627 \u00AB\u0635\u0641\u062D\u0647 \u0633\u0641\u06CC\u062F\u00BB \u0646\u0628\u06CC\u0646\u06CC\u0645.
  try {
    var p = normalizeParams_(e);
    var action = String(p.action || 'ping').toLowerCase().replace(/^(amp;)+/, '');

    // 1) \u0633\u06A9\u0631\u062A
    if (CONFIG.WEBHOOK_SECRET && p.k !== CONFIG.WEBHOOK_SECRET) {
      return page_('\u26D4\uFE0F \u062F\u0633\u062A\u0631\u0633\u06CC \u0646\u062F\u0627\u0631\u06CC\u062F', [
        '\u062F\u0631 \u0622\u062F\u0631\u0633\u060C \u0645\u0642\u062F\u0627\u0631 k \u0628\u0627\u06CC\u062F \u0628\u0631\u0627\u0628\u0631 WEBHOOK_SECRET \u0628\u0627\u0634\u062F.',
        '\u062F\u0631\u0633\u062A: ' + deployUrl_() + '?k=YOUR_SECRET&action=setup',
        'WEBHOOK_SECRET \u0641\u0639\u0644\u06CC: ' + (CONFIG.WEBHOOK_SECRET || '(\u062E\u0627\u0644\u06CC)')
      ]);
    }

    // 2) \u062A\u0648\u06A9\u0646
    if (!currentToken_()) {
      return page_('\uD83D\uDD11 \u062A\u0648\u06A9\u0646 \u062A\u0644\u06AF\u0631\u0627\u0645 \u062A\u0646\u0638\u06CC\u0645 \u0646\u0634\u062F\u0647', [
        '\u0627\u06CC\u0646 \u0627\u0633\u06A9\u0631\u06CC\u067E\u062A \u062C\u0627\u06CC \u062A\u0648\u06A9\u0646 \u0631\u0627 \u0627\u0632 \u062A\u0648 \u0646\u0645\u06CC\u200C\u067E\u0631\u0633\u062F\u061B \u0628\u0627\u06CC\u062F \u06CC\u06A9\u200C\u0628\u0627\u0631 \u062F\u0631 \u06A9\u062F \u0628\u06AF\u0630\u0627\u0631\u06CC:',
        '',
        "\u06F1) \u0628\u0627\u0644\u0627\u06CC \u0641\u0627\u06CC\u0644\u060C \u0627\u06CC\u0646 \u062E\u0637 \u0631\u0627 \u067E\u06CC\u062F\u0627 \u06A9\u0646:   BOT_TOKEN: 'PUT-YOUR-NEW-BOT-TOKEN-HERE'",
        "\u06F2) \u062C\u0627\u06CC\u0634 \u0628\u0646\u0648\u06CC\u0633:                     BOT_TOKEN: '8621978100:AAH...'  (\u062A\u0648\u06A9\u0646 \u0648\u0627\u0642\u0639\u06CC \u0628\u06CC\u0646 \u062F\u0648 \u06A9\u0648\u062A\u06CC\u0634\u0646)",
        '\u06F3) Ctrl+S \u0630\u062E\u06CC\u0631\u0647 \u06A9\u0646',
        '\u06F4) Deploy \u2192 Manage deployments \u2192 \u270F\uFE0F \u2192 Version: New version \u2192 Deploy',
        '\u06F5) \u0647\u0645\u06CC\u0646 \u0635\u0641\u062D\u0647 \u0631\u0627 \u0631\u0641\u0631\u0634 \u06A9\u0646',
        '',
        '\u0631\u0627\u0647 \u062F\u0648\u0645 (\u0628\u062F\u0648\u0646 \u062A\u063A\u06CC\u06CC\u0631 \u06A9\u062F): \u2699\uFE0F Project Settings \u2192 Script Properties \u2192',
        'Add property \u2192 Name: BOT_TOKEN \u060C Value: \u062A\u0648\u06A9\u0646',
        '',
        '\u26D4\uFE0F \u0627\u06AF\u0631 \u062A\u0648\u06A9\u0646 \u0644\u0648 \u0631\u0641\u062A\u0647\u060C \u0627\u0648\u0644 \u062F\u0631 @BotFather \u2192 /mybots \u2192 API Token \u2192 Revoke \u062A\u0648\u06A9\u0646 \u062C\u062F\u06CC\u062F \u0628\u06AF\u06CC\u0631.'
      ]);
    }

    // 3) \u0627\u06A9\u0634\u0646\u200C\u0647\u0627
    if (action === 'setup') {
      var me = tg_('getMe', {});
      if (!me || !me.ok) {
        return page_('\u274C \u062A\u0648\u06A9\u0646 \u062F\u0631\u0633\u062A \u0646\u06CC\u0633\u062A', [
          '\u062A\u0644\u06AF\u0631\u0627\u0645 \u0627\u06CC\u0646 \u062A\u0648\u06A9\u0646 \u0631\u0627 \u0642\u0628\u0648\u0644 \u0646\u06A9\u0631\u062F:',
          JSON.stringify(me),
          '',
          '\u0627\u06AF\u0631 \u062A\u0648\u06A9\u0646 \u0631\u0627 Revoke \u06A9\u0631\u062F\u0647\u200C\u0627\u06CC\u060C \u0645\u0642\u062F\u0627\u0631 \u062C\u062F\u06CC\u062F \u0631\u0627 \u0628\u06AF\u0630\u0627\u0631 \u0648 New version \u062F\u06CC\u067E\u0644\u0648\u06CC \u06A9\u0646.',
          '\u062A\u0648\u062C\u0647: \u0641\u0627\u0635\u0644\u0647 \u0627\u0636\u0627\u0641\u0647\u060C \u06A9\u0648\u062A\u06CC\u0634\u0646 \u0627\u0636\u0627\u0641\u0647 \u06CC\u0627 \u0646\u0642\u0644\u200C\u0642\u0648\u0644 \u0641\u0627\u0631\u0633\u06CC\u060C \u062A\u0648\u06A9\u0646 \u0631\u0627 \u062E\u0631\u0627\u0628 \u0645\u06CC\u200C\u06A9\u0646\u062F.'
        ]);
      }

      var url = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
      tg_('deleteWebhook', { drop_pending_updates: false });
      var res = tg_('setWebhook', {
        url: url,
        allowed_updates: ['message', 'channel_post'],
        max_connections: 1
      });

      return page_('\u2705 webhook \u0633\u062A \u0634\u062F', [
        '\u0631\u0628\u0627\u062A: @' + ((me.result && me.result.username) || '?'),
        'webhook: ' + url,
        '\u067E\u0627\u0633\u062E \u062A\u0644\u06AF\u0631\u0627\u0645: ' + JSON.stringify(res),
        '',
        '\u0627\u0644\u0627\u0646 \u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0628\u0647 \u0631\u0628\u0627\u062A /start \u0628\u062F\u0647.',
        '\u0627\u06AF\u0631 \u062C\u0648\u0627\u0628 \u0646\u062F\u0627\u062F\u060C \u0647\u0645\u06CC\u0646 \u0622\u062F\u0631\u0633 \u0631\u0627 \u0628\u0627 action=info \u0628\u0627\u0632 \u06A9\u0646.'
      ]);
    }

    if (action === 'info') {
      return page_('\uD83D\uDCCA \u0648\u0636\u0639\u06CC\u062A \u0631\u0628\u0627\u062A', [
        'getMe: ' + JSON.stringify(tg_('getMe', {})),
        '',
        'webhookInfo: ' + JSON.stringify(tg_('getWebhookInfo', {}), null, 2)
      ]);
    }

    if (action === 'delete') {
      return page_('\uD83D\uDDD1 webhook \u062D\u0630\u0641 \u0634\u062F', [
        JSON.stringify(tg_('deleteWebhook', { drop_pending_updates: false }))
      ]);
    }

    if (action === 'diag' || action === 'info') {
      return page_('\uD83E\uDE7A \u062A\u0634\u062E\u06CC\u0635 \u0648\u0636\u0639\u06CC\u062A', diagLines_());
    }

    if (action === 'replay') {
      return page_('\u267B\uFE0F \u0628\u0627\u0632\u067E\u062E\u0634 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u0645\u0639\u0644\u0642', replayLines_(p));
    }

    if (action === 'sendtest') {
      if (!p.chat) {
        return page_('\uD83D\uDCE8 \u062A\u0633\u062A \u0627\u0631\u0633\u0627\u0644', [
          '\u0627\u06CC\u0646 \u0622\u062F\u0631\u0633 \u0631\u0627 \u0628\u0627 \u0622\u06CC\u062F\u06CC \u0686\u062A \u0628\u0627\u0632 \u06A9\u0646:',
          deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=sendtest&chat=123456789',
          '',
          '\u0622\u06CC\u062F\u06CC \u0686\u062A \u0631\u0627 \u0627\u0632 \u062F\u0627\u062E\u0644 \u062A\u0644\u06AF\u0631\u0627\u0645 (\u0628\u0627 \u0631\u0628\u0627\u062A @userinfobot) \u0628\u06AF\u06CC\u0631.'
        ]);
      }
      var sent = tg_('sendMessage', { chat_id: p.chat, text: '\u2705 \u062A\u0633\u062A \u0645\u0648\u0641\u0642 \u0628\u0648\u062F \u2014 \u0631\u0628\u0627\u062A \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u067E\u06CC\u0627\u0645 \u0628\u0641\u0631\u0633\u062A\u062F.' });
      return page_(sent && sent.ok ? '\u2705 \u0627\u0631\u0633\u0627\u0644 \u062A\u0633\u062A \u0645\u0648\u0641\u0642 \u0628\u0648\u062F' : '\u274C \u0627\u0631\u0633\u0627\u0644 \u062A\u0633\u062A \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F', [
        'chat_id: ' + p.chat,
        '\u067E\u0627\u0633\u062E \u062A\u0644\u06AF\u0631\u0627\u0645: ' + JSON.stringify(sent)
      ]);
    }

    if (action === 'startpolling') {
      return page_('\uD83D\uDD04 \u062D\u0627\u0644\u062A Polling \u0631\u0648\u0634\u0646 \u0634\u062F', startPolling_());
    }

    if (action === 'stoppolling') {
      return page_('\u23F9 \u062D\u0627\u0644\u062A Polling \u062E\u0627\u0645\u0648\u0634 \u0634\u062F', stopPolling_());
    }

    if (action === 'pollnow') {
      pollOnce();
      return page_('\uD83D\uDD04 \u06CC\u06A9 \u0627\u062C\u0631\u0627\u06CC Polling \u0627\u0646\u062C\u0627\u0645 \u0634\u062F', diagLines_());
    }

    if (action === 'posttest') {
      return page_('\uD83D\uDCEE \u062A\u0633\u062A POST \u0627\u0632 \u0628\u06CC\u0631\u0648\u0646', postTestLines_());
    }

    // 4) ping / \u067E\u06CC\u0634\u200C\u0641\u0631\u0636: \u06AF\u0632\u0627\u0631\u0634 \u06A9\u0627\u0645\u0644 \u0648\u0636\u0639\u06CC\u062A
    var lines = ['\u0622\u062F\u0631\u0633 \u0627\u06CC\u0646 \u0627\u0633\u06A9\u0631\u06CC\u067E\u062A: ' + deployUrl_(), '\u0646\u0633\u062E\u0647 \u06A9\u062F: ' + CODE_VERSION, ''];

    var me = tg_('getMe', {});
    if (me && me.ok) {
      lines.push('\u2705 \u062A\u0648\u06A9\u0646: \u062F\u0631\u0633\u062A \u2192 @' + ((me.result && me.result.username) || '?'));
    } else {
      lines.push('\u274C \u062A\u0648\u06A9\u0646: \u062A\u0644\u06AF\u0631\u0627\u0645 \u0642\u0628\u0648\u0644 \u0646\u06A9\u0631\u062F \u2192 ' + JSON.stringify(me));
    }

    try {
      var folder = targetFolder_(null);
      lines.push('\u2705 \u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F: ' + folder.getName() + ' \u2192 ' + folder.getUrl());
    } catch (ferr) {
      lines.push('\u274C \u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F: ' + ferr);
    }

    var info = tg_('getWebhookInfo', {});
    lines.push('\u0648\u0636\u0639\u06CC\u062A webhook: ' + JSON.stringify(info));

    var bad = info && info.ok && info.result &&
              String(info.result.last_error_message || '').indexOf('302') !== -1;
    lines.push('');
    if (bad) {
      lines.push('\u26D4\uFE0F \u062A\u0644\u06AF\u0631\u0627\u0645 \u0645\u06CC\u200C\u06AF\u0648\u06CC\u062F: 302 Found \u2192 \u06AF\u0648\u06AF\u0644 \u0628\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A \u0645\u06CC\u200C\u062F\u0647\u062F.');
      lines.push('\u0631\u0627\u0647 \u0642\u0637\u0639\u06CC: \u062D\u0627\u0644\u062A Polling \u0631\u0627 \u0631\u0648\u0634\u0646 \u06A9\u0646 (\u0628\u0647 \u062F\u0633\u062A\u0631\u0633\u06CC \u0639\u0645\u0648\u0645\u06CC \u0646\u06CC\u0627\u0632 \u0646\u062F\u0627\u0631\u062F):');
      lines.push('  ' + deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=startpolling');
      lines.push('\u06CC\u0627 \u062D\u062A\u06CC \u0633\u0627\u062F\u0647\u200C\u062A\u0631: \u062F\u0631 \u0627\u062F\u06CC\u062A\u0648\u0631\u060C \u062A\u0627\u0628\u0639 setupPollingNow \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u0648 Run \u06A9\u0646.');
    } else {
      lines.push('\u0645\u0631\u062D\u0644\u0647 \u0628\u0639\u062F:');
      lines.push('\u0627\u06AF\u0631 webhook \u0633\u062A \u0646\u0634\u062F\u0647 \u2192 ' + deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=setup');
      lines.push('\u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645: /start \u0648 /id');
    }

    return page_('\uD83E\uDD16 \u0631\u0628\u0627\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u2192 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648', lines);
  } catch (err) {
    return page_('\u274C \u062E\u0637\u0627', [
      String(err),
      '',
      '\u0627\u06CC\u0646 \u0645\u062A\u0646 \u0631\u0627 \u0628\u0631\u0627\u06CC\u0645 \u0628\u0641\u0631\u0633\u062A \u062A\u0627 \u062F\u0642\u06CC\u0642 \u0628\u06AF\u0648\u06CC\u0645 \u0645\u0634\u06A9\u0644 \u06A9\u062C\u0627\u0633\u062A.'
    ]);
  }
}

// ============================ \u062D\u0627\u0644\u062A Polling ============================

/**
 * \u2705 \u0633\u0627\u062F\u0647\u200C\u062A\u0631\u06CC\u0646 \u0631\u0627\u0647: \u062F\u0631 \u0647\u0645\u06CC\u0646 \u0627\u062F\u06CC\u062A\u0648\u0631\u060C \u0627\u0632 \u0645\u0646\u0648\u06CC \u062A\u0648\u0627\u0628\u0639 \u0627\u06CC\u0646 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646 \u0648 Run \u0628\u0632\u0646.
 *    (\u0628\u0647 \u0647\u06CC\u0686 \u0622\u062F\u0631\u0633\u06CC\u060C \u0647\u06CC\u0686 \u0633\u06A9\u0631\u062A\u06CC \u0648 \u0647\u06CC\u0686 \u062F\u06CC\u067E\u0644\u0648\u06CC \u062C\u062F\u06CC\u062F\u06CC \u0646\u06CC\u0627\u0632 \u0646\u062F\u0627\u0631\u062F)
 *
 * \u06A9\u0627\u0631\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0645\u06CC\u200C\u06A9\u0646\u062F:
 *   \u06F1) webhook \u0631\u0627 \u062D\u0630\u0641 \u0645\u06CC\u200C\u06A9\u0646\u062F (\u0648\u06AF\u0631\u0646\u0647 getUpdates \u062E\u0637\u0627\u06CC 409 \u0645\u06CC\u200C\u062F\u0647\u062F)
 *   \u06F2) \u062A\u0631\u06CC\u06AF\u0631 \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647 \u0646\u0635\u0628 \u0645\u06CC\u200C\u06A9\u0646\u062F
 *   \u06F3) \u0647\u0645\u06CC\u0646 \u062D\u0627\u0644\u0627 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u0645\u0639\u0644\u0642 \u0631\u0627 \u067E\u0631\u062F\u0627\u0632\u0634 \u0645\u06CC\u200C\u06A9\u0646\u062F
 */
function setupPollingNow() {
  var report = startPolling_().join('\n');
  Logger.log(report);
  return report;
}

/** \u062E\u0627\u0645\u0648\u0634 \u06A9\u0631\u062F\u0646 polling \u0648 \u0628\u0631\u06AF\u0634\u062A \u0628\u0647 webhook (\u0627\u0632 \u0627\u062F\u06CC\u062A\u0648\u0631 \u0647\u0645 \u0642\u0627\u0628\u0644 \u0627\u062C\u0631\u0627\u0633\u062A). */
function stopPollingNow() {
  var report = stopPolling_().join('\n');
  Logger.log(report);
  return report;
}


/**
 * \u0627\u06AF\u0631 \u06AF\u0648\u06AF\u0644 \u0627\u062C\u0627\u0632\u0647 \u0646\u062F\u0647\u062F web app \u0639\u0645\u0648\u0645\u06CC \u0628\u0627\u0634\u062F (\u067E\u0627\u0633\u062E 302 \u0628\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645)\u060C
 * \u0631\u0628\u0627\u062A \u0631\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u0628\u062F\u0648\u0646 webhook \u0647\u0645 \u0686\u0631\u062E\u0627\u0646\u062F: \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647 \u062E\u0648\u062F Apps Script
 * \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0645\u06CC\u200C\u067E\u0631\u0633\u062F \u00AB\u067E\u06CC\u0627\u0645 \u062C\u062F\u06CC\u062F\u06CC \u062F\u0627\u0631\u06CC\u061F\u00BB. \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0628\u0647 \u062F\u0633\u062A\u0631\u0633\u06CC \u0639\u0645\u0648\u0645\u06CC
 * \u0647\u06CC\u0686 \u0646\u06CC\u0627\u0632\u06CC \u0646\u06CC\u0633\u062A.
 */

/** \u0646\u0635\u0628 \u062A\u0631\u06CC\u06AF\u0631 \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647 \u0628\u0631\u0627\u06CC pollOnce. */
function installPolling_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pollOnce') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('pollOnce').timeBased().everyMinutes(1).create();
}

/** \u062D\u0630\u0641 \u062A\u0631\u06CC\u06AF\u0631\u0647\u0627\u06CC polling. */
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

  // \u062F\u0631 \u062D\u0627\u0644\u062A polling \u0646\u0628\u0627\u06CC\u062F webhook \u0641\u0639\u0627\u0644 \u0628\u0627\u0634\u062F (\u0648\u06AF\u0631\u0646\u0647 getUpdates \u062E\u0637\u0627\u06CC 409 \u0645\u06CC\u200C\u062F\u0647\u062F)
  var del = tg_('deleteWebhook', { drop_pending_updates: false });
  lines.push('webhook \u062D\u0630\u0641 \u0634\u062F: ' + JSON.stringify(del));

  installPolling_();
  lines.push('\u2705 \u062A\u0631\u06CC\u06AF\u0631 \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647 \u0646\u0635\u0628 \u0634\u062F.');

  // \u06CC\u06A9 \u0627\u062C\u0631\u0627\u06CC \u0641\u0648\u0631\u06CC \u062A\u0627 \u0645\u0646\u062A\u0638\u0631 \u062F\u0642\u06CC\u0642\u0647 \u0628\u0639\u062F \u0646\u0645\u0627\u0646\u06CC\u0645
  var processed = pollOnce();
  lines.push('\u0627\u062C\u0631\u0627\u06CC \u0641\u0648\u0631\u06CC: ' + processed + ' \u067E\u06CC\u0627\u0645 \u067E\u0631\u062F\u0627\u0632\u0634 \u0634\u062F.');

  lines.push('');
  lines.push('\u0627\u0632 \u0627\u06CC\u0646 \u0628\u0647 \u0628\u0639\u062F \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F \u062E\u0648\u062F\u06A9\u0627\u0631 \u067E\u0631\u062F\u0627\u0632\u0634 \u0645\u06CC\u200C\u0634\u0648\u0646\u062F');
  lines.push('(\u062D\u062F\u0627\u06A9\u062B\u0631 ~\u06F1 \u062F\u0642\u06CC\u0642\u0647 \u062A\u0623\u062E\u06CC\u0631). \u0628\u0631\u0627\u06CC \u062A\u0633\u062A: ' + deployUrl_() + '?k=' +
             (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=pollnow');
  lines.push('\u0628\u0631\u0627\u06CC \u0628\u0631\u06AF\u0634\u062A \u0628\u0647 \u062D\u0627\u0644\u062A webhook: ' + deployUrl_() + '?k=' +
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
  return ['\u062A\u0631\u06CC\u06AF\u0631\u0647\u0627\u06CC \u062D\u0630\u0641\u200C\u0634\u062F\u0647: ' + removed, 'webhook \u062F\u0648\u0628\u0627\u0631\u0647 \u0633\u062A \u0634\u062F: ' + JSON.stringify(res)];
}

/**
 * \u06CC\u06A9 \u0628\u0627\u0631 getUpdates \u0645\u06CC\u200C\u0632\u0646\u062F \u0648 \u0647\u0645\u0647 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F \u0631\u0627 \u067E\u0631\u062F\u0627\u0632\u0634 \u0645\u06CC\u200C\u06A9\u0646\u062F.
 * offset \u062F\u0631 Script Properties \u0646\u06AF\u0647 \u062F\u0627\u0634\u062A\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.
 */
function pollOnce() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 0;   // \u0627\u062C\u0631\u0627\u06CC \u0647\u0645\u200C\u0632\u0645\u0627\u0646 \u062C\u0644\u0648\u06AF\u06CC\u0631\u06CC

  var processed = 0;
  try {
    var offset = Number(PROPS.getProperty('TG_OFFSET') || 0);
    var payload = { timeout: 0, limit: 20, allowed_updates: ['message', 'channel_post'] };
    if (offset) payload.offset = offset;

    var res = tg_('getUpdates', payload);
    if (!res || !res.ok) {
      if (res && res.error_code === 409) {
        // webhook \u0647\u0646\u0648\u0632 \u0641\u0639\u0627\u0644 \u0627\u0633\u062A
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
 * \u0628\u0647 \u062E\u0648\u062F \u0647\u0645\u06CC\u0646 web app \u06CC\u06A9 POST \u0645\u06CC\u200C\u0632\u0646\u062F (\u0628\u062F\u0648\u0646 \u062F\u0646\u0628\u0627\u0644 \u06A9\u0631\u062F\u0646 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A) \u062A\u0627 \u0628\u0628\u06CC\u0646\u06CC\u0645
 * \u062A\u0644\u06AF\u0631\u0627\u0645 \u0686\u0647 \u06A9\u062F\u06CC \u0645\u06CC\u200C\u06AF\u06CC\u0631\u062F. \u06A9\u062F 302 \u06CC\u0639\u0646\u06CC \u06AF\u0648\u06AF\u0644 \u0628\u0647 \u0635\u0641\u062D\u0647 \u0644\u0627\u06AF\u06CC\u0646 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F
 * \u0648 \u0647\u0645\u0627\u0646 \u0686\u06CC\u0632\u06CC \u0627\u0633\u062A \u06A9\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645 \u06AF\u0632\u0627\u0631\u0634 \u0645\u06CC\u200C\u06A9\u0646\u062F: "Wrong response ... 302 Found".
 */
function postTestLines_() {
  var url = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
  var lines = ['POST \u2192 ' + url, ''];

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

    lines.push('\u06A9\u062F \u067E\u0627\u0633\u062E: ' + code);

    if (code === 200) {
      lines.push('');
      lines.push('\u2705 \u0639\u0627\u0644\u06CC: POST \u0628\u062F\u0648\u0646 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A \u062C\u0648\u0627\u0628 \u0645\u06CC\u200C\u062F\u0647\u062F\u061B \u062A\u0644\u06AF\u0631\u0627\u0645 \u0647\u0645 \u0628\u0627\u06CC\u062F \u0628\u062A\u0648\u0627\u0646\u062F \u067E\u06CC\u0627\u0645 \u0628\u0641\u0631\u0633\u062A\u062F.');
      lines.push('\u0627\u06AF\u0631 \u0628\u0627\u0632 \u0647\u0645 \u0631\u0628\u0627\u062A \u0633\u0627\u06A9\u062A \u0627\u0633\u062A: action=setup \u0648 \u0628\u0639\u062F action=diag \u0631\u0627 \u0628\u0632\u0646.');
    } else if (code === 301 || code === 302 || code === 303 || code === 307) {
      lines.push('Location: ' + (headers['Location'] || headers['location'] || '(\u0646\u0627\u0645\u0634\u062E\u0635)'));
      lines.push('');
      lines.push('\u274C \u06AF\u0648\u06AF\u0644 POST \u0631\u0627 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F\u061B \u062A\u0644\u06AF\u0631\u0627\u0645 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A \u0631\u0627 \u062F\u0646\u0628\u0627\u0644 \u0646\u0645\u06CC\u200C\u06A9\u0646\u062F\u060C');
      lines.push('   \u067E\u0633 \u0647\u0645\u06CC\u0646 \u0627\u0633\u062A \u0639\u0644\u062A \u00ABWrong response from the webhook: 302 Found\u00BB.');
      lines.push('');
      lines.push('\u062F\u0631\u0633\u062A\u0634 \u06A9\u0646:');
      lines.push('\u06F1) Deploy \u2192 Manage deployments \u2192 \u270F\uFE0F (\u0645\u062F\u0627\u062F)');
      lines.push('\u06F2) Execute as: Me (\u0627\u06CC\u0645\u06CC\u0644 \u062E\u0648\u062F\u062A)');
      lines.push('\u06F3) Who has access: Anyone  \u2190 \u0646\u0647 \u00ABAnyone with Google account\u00BB \u0648 \u0646\u0647 \u00ABOnly myself\u00BB');
      lines.push('\u06F4) Version: New version \u2192 Deploy');
      lines.push('\u06F5) \u0628\u0639\u062F \u0627\u06CC\u0646 \u0631\u0627 \u0628\u0627\u0632 \u06A9\u0646: ' + deployUrl_() + '?k=' +
                 (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=setup');
      lines.push('\u06F6) \u0648 \u0628\u0639\u062F: ' + url + '&action=replay');
    } else if (code === 401 || code === 403) {
      lines.push('');
      lines.push('\u274C \u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0633\u062A\u0647 \u0627\u0633\u062A (\u06A9\u0627\u0631\u0628\u0631 \u0646\u0627\u0634\u0646\u0627\u0633 \u0627\u062C\u0627\u0632\u0647 \u0646\u062F\u0627\u0631\u062F).');
      lines.push('\u062F\u0631 Manage deployments \u0645\u0642\u062F\u0627\u0631 Who has access \u0631\u0627 \u0631\u0648\u06CC Anyone \u0628\u06AF\u0630\u0627\u0631 \u0648 New version \u06A9\u0646.');
    } else {
      lines.push('');
      lines.push('\u067E\u0627\u0633\u062E \u063A\u06CC\u0631\u0645\u0646\u062A\u0638\u0631\u0647. \u0633\u0631\u0622\u06CC\u0646\u062F\u0647\u0627: ' + JSON.stringify(headers));
      lines.push('\u0645\u062A\u0646: ' + String(res.getContentText()).slice(0, 300));
    }
  } catch (err) {
    lines.push('\u274C \u062E\u0637\u0627 \u062F\u0631 \u062A\u0633\u062A: ' + err);
  }

  return lines;
}

/** \u062E\u0637\u0648\u0637 \u06AF\u0632\u0627\u0631\u0634 \u06A9\u0627\u0645\u0644 \u0648\u0636\u0639\u06CC\u062A (\u0627\u06A9\u0634\u0646 diag). */
function diagLines_() {
  var lines = [];
  lines.push('\u0622\u062F\u0631\u0633 \u0627\u06CC\u0646 \u0627\u0633\u06A9\u0631\u06CC\u067E\u062A: ' + deployUrl_());
  lines.push('\u0646\u0633\u062E\u0647 \u06A9\u062F: ' + CODE_VERSION);
  lines.push('');

  // \u062A\u0648\u06A9\u0646
  if (!currentToken_()) {
    lines.push('\u274C \u062A\u0648\u06A9\u0646: \u062A\u0646\u0638\u06CC\u0645 \u0646\u0634\u062F\u0647 (\u0628\u0627\u0644\u0627\u06CC \u06A9\u062F BOT_TOKEN \u0631\u0627 \u067E\u0631 \u06A9\u0646)');
  } else {
    var me = tg_('getMe', {});
    lines.push(me && me.ok
      ? '\u2705 \u062A\u0648\u06A9\u0646: \u062F\u0631\u0633\u062A \u2192 @' + ((me.result && me.result.username) || '?')
      : '\u274C \u062A\u0648\u06A9\u0646: \u062A\u0644\u06AF\u0631\u0627\u0645 \u0642\u0628\u0648\u0644 \u0646\u06A9\u0631\u062F \u2192 ' + JSON.stringify(me));
  }

  // \u067E\u0648\u0634\u0647
  try {
    var folder = targetFolder_(null);
    lines.push('\u2705 \u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F: ' + folder.getName() + ' \u2192 ' + folder.getUrl());
  } catch (ferr) {
    lines.push('\u274C \u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F: ' + ferr);
  }

  // webhook
  var info = tg_('getWebhookInfo', {});
  lines.push('');
  if (info && info.ok) {
    var r = info.result || {};
    lines.push('webhook url: ' + (r.url || '(\u0633\u062A \u0646\u0634\u062F\u0647!)'));
    lines.push('pending_update_count: ' + (r.pending_update_count || 0));
    if (r.last_error_message) {
      lines.push('\u26D4\uFE0F last_error_message: ' + r.last_error_message + '  (\u062F\u0631 ' + (r.last_error_date || '?') + ')');
      if (String(r.last_error_message).indexOf('302') !== -1) {
        lines.push('   \u2197 \u06AF\u0648\u06AF\u0644 \u0628\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0631\u06CC\u062F\u0627\u06CC\u0631\u06A9\u062A \u0645\u06CC\u200C\u062F\u0647\u062F (\u062F\u0633\u062A\u0631\u0633\u06CC \u0639\u0645\u0648\u0645\u06CC web app \u0628\u0633\u062A\u0647 \u0627\u0633\u062A).');
        lines.push('   \u062F\u0648 \u0631\u0627\u0647: (\u06F1) Who has access = Anyone \u062F\u0631 Manage deployments');
        lines.push('   \u06CC\u0627 (\u06F2) \u0647\u0645\u06CC\u0646 \u062D\u0627\u0644\u0627 \u062D\u0627\u0644\u062A Polling \u0631\u0627 \u0631\u0648\u0634\u0646 \u06A9\u0646:');
        lines.push('   ' + deployUrl_() + '?k=' + (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=startpolling');
      }
    } else {
      lines.push('last_error_message: \u0646\u062F\u0627\u0631\u062F \u2705');
    }
  } else {
    lines.push('\u274C \u062E\u0648\u0627\u0646\u062F\u0646 \u0648\u0636\u0639\u06CC\u062A webhook \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F: ' + JSON.stringify(info));
  }

  // \u0622\u06CC\u0627 webhook \u0631\u0648\u06CC \u0647\u0645\u06CC\u0646 \u0633\u06A9\u0631\u062A \u0627\u0633\u062A\u061F
  var expected = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
  if (info && info.ok && info.result && info.result.url) {
    lines.push('');
    lines.push(info.result.url === expected
      ? '\u2705 \u0622\u062F\u0631\u0633 webhook \u0628\u0627 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0641\u0639\u0644\u06CC \u06CC\u06A9\u06CC \u0627\u0633\u062A'
      : '\u26A0\uFE0F \u0622\u062F\u0631\u0633 webhook \u0628\u0627 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0641\u0639\u0644\u06CC \u06CC\u06A9\u06CC \u0646\u06CC\u0633\u062A. \u0627\u06CC\u0646 \u0631\u0627 \u0628\u0627\u0632 \u06A9\u0646: ' + expected + '&action=setup');
  }

  // \u062D\u0627\u0644\u062A polling
  var pcount = pollingTriggersCount_();
  lines.push('');
  lines.push(pcount
    ? '\uD83D\uDD04 \u062D\u0627\u0644\u062A Polling \u0641\u0639\u0627\u0644 \u0627\u0633\u062A (' + pcount + ' \u062A\u0631\u06CC\u06AF\u0631 \u0647\u0631 \u06F1 \u062F\u0642\u06CC\u0642\u0647) \u2192 webhook \u0644\u0627\u0632\u0645 \u0646\u06CC\u0633\u062A'
    : '\u062D\u0627\u0644\u062A Polling \u0641\u0639\u0627\u0644 \u0646\u06CC\u0633\u062A (\u0631\u0628\u0627\u062A \u0628\u0647 webhook \u062A\u06A9\u06CC\u0647 \u062F\u0627\u0631\u062F)');
  var off = PROPS.getProperty('TG_OFFSET');
  if (off) lines.push('\u0622\u062E\u0631\u06CC\u0646 offset \u067E\u0631\u062F\u0627\u0632\u0634\u200C\u0634\u062F\u0647: ' + off);

  // heartbeat
  var last = PROPS.getProperty('LAST_UPDATE');
  lines.push('');
  lines.push(last
    ? '\uD83D\uDCE5 \u0622\u062E\u0631\u06CC\u0646 \u0622\u067E\u062F\u06CC\u062A \u062F\u0631\u06CC\u0627\u0641\u062A\u06CC: ' + last
    : '\uD83D\uDCE5 \u0647\u0646\u0648\u0632 \u0647\u06CC\u0686 \u0622\u067E\u062F\u06CC\u062A\u06CC \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0646\u0631\u0633\u06CC\u062F\u0647 (\u06CC\u0639\u0646\u06CC webhook \u06CC\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC Anyone \u0645\u0634\u06A9\u0644 \u062F\u0627\u0631\u062F)');

  lines.push('');
  lines.push('\u0627\u06AF\u0631 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u0645\u0639\u0644\u0642 \u062F\u0627\u0631\u06CC: ' + deployUrl_() + '?k=' +
             (CONFIG.WEBHOOK_SECRET || 'YOUR_SECRET') + '&action=replay');
  return lines;
}

/**
 * \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0647\u0646\u0648\u0632 \u062A\u062D\u0648\u06CC\u0644 \u0646\u062F\u0627\u062F\u0647 \u0631\u0627 \u0645\u06CC\u200C\u06AF\u06CC\u0631\u062F\u060C \u067E\u0631\u062F\u0627\u0632\u0634 \u0645\u06CC\u200C\u06A9\u0646\u062F
 * (\u0641\u0627\u06CC\u0644\u200C\u0647\u0627 \u0631\u0627 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u062F) \u0648 webhook \u0631\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u0633\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F.
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
    return ['\u274C getUpdates \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F: ' + JSON.stringify(res)];
  }

  var updates = res.result || [];
  lines.push('\u062A\u0639\u062F\u0627\u062F \u067E\u06CC\u0627\u0645 \u0645\u0639\u0644\u0642: ' + updates.length);

  var done = 0;
  var lastId = 0;
  for (var i = 0; i < updates.length; i++) {
    var u = updates[i];
    lastId = Math.max(lastId, Number(u.update_id) || 0);
    try {
      var r = processUpdate_(u);
      lines.push('\u2022 update ' + u.update_id + ' \u2192 ' + r);
      if (r === 'done') done++;
    } catch (err) {
      lines.push('\u26A0\uFE0F update ' + u.update_id + ' \u062E\u0637\u0627: ' + err);
    }
  }

  // \u062A\u0623\u06CC\u06CC\u062F \u062F\u0631\u06CC\u0627\u0641\u062A (\u062A\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u062D\u0648\u06CC\u0644 \u062F\u0627\u062F\u0647 \u0646\u0634\u0648\u0646\u062F)
  if (lastId) {
    tg_('getUpdates', { offset: lastId + 1, timeout: 0, limit: 1 });
    lines.push('offset \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F: ' + (lastId + 1));
  }

  // \u0633\u062A \u06A9\u0631\u062F\u0646 \u062F\u0648\u0628\u0627\u0631\u0647 webhook
  var url = deployUrl_() + '?k=' + encodeURIComponent(CONFIG.WEBHOOK_SECRET);
  var setRes = tg_('setWebhook', {
    url: url,
    allowed_updates: ['message', 'channel_post'],
    max_connections: 1
  });

  lines.push('');
  lines.push('\u067E\u0631\u062F\u0627\u0632\u0634\u200C\u0634\u062F\u0647: ' + done);
  lines.push('webhook \u062F\u0648\u0628\u0627\u0631\u0647 \u0633\u062A \u0634\u062F: ' + JSON.stringify(setRes));
  lines.push('url: ' + url);
  return lines;
}

/** \u0622\u062F\u0631\u0633 \u0647\u0645\u06CC\u0646 web app (\u0631\u0648\u06CC \u0646\u0633\u062E\u0647 \u062F\u06CC\u067E\u0644\u0648\u06CC\u200C\u0634\u062F\u0647). */
function deployUrl_() {
  try {
    return ScriptApp.getService().getUrl() || '(\u0628\u0639\u062F \u0627\u0632 Deploy \u0645\u0634\u062E\u0635 \u0645\u06CC\u200C\u0634\u0648\u062F)';
  } catch (e) {
    return '(\u0628\u0639\u062F \u0627\u0632 Deploy \u0645\u0634\u062E\u0635 \u0645\u06CC\u200C\u0634\u0648\u062F)';
  }
}

/** \u0635\u0641\u062D\u0647 \u0645\u062A\u0646\u06CC \u0633\u0627\u062F\u0647 (\u0628\u0647\u200C\u062C\u0627\u06CC \u0635\u0641\u062D\u0647 \u0633\u0641\u06CC\u062F). */
function page_(title, lines) {
  var body = '=== ' + title + ' ===\n\n' + (lines || []).join('\n');
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.TEXT);
}

// ---------------------------------------------------------------- \u0628\u0631\u0631\u0633\u06CC \u0633\u0631\u06CC\u0639
/**
 * \u0628\u0639\u062F \u0627\u0632 paste \u0648 \u0630\u062E\u06CC\u0631\u0647\u060C \u0627\u06CC\u0646 \u062A\u0627\u0628\u0639 \u0631\u0627 \u0627\u0632 \u0645\u0646\u0648\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u062A\u0627\u0628\u0639 \u0628\u0627\u0644\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646 \u0648 Run \u0628\u0632\u0646.
 * \u0646\u062A\u06CC\u062C\u0647 \u062F\u0631 Execution log \u0645\u06CC\u200C\u0622\u06CC\u062F: \u0635\u062D\u062A \u062A\u0648\u06A9\u0646\u060C \u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0647 \u067E\u0648\u0634\u0647\u060C \u0622\u062F\u0631\u0633 webhook.
 */
function checkSetup() {
  var out = [];

  try {
    var me = tg_('getMe', {});
    out.push(me && me.ok
      ? '\u2705 token OK \u2192 @' + ((me.result && me.result.username) || '?')
      : '\u274C token FAIL \u2192 ' + JSON.stringify(me));
  } catch (err) {
    out.push('\u274C token ERROR \u2192 ' + err);
  }

  try {
    var folder = targetFolder_(null);
    out.push('\u2705 folder OK \u2192 ' + folder.getName() + ' | ' + folder.getUrl());
  } catch (err2) {
    out.push('\u274C folder ERROR \u2192 ' + err2);
  }

  try {
    out.push('webhook url \u2192 ' + ScriptApp.getService().getUrl());
  } catch (err3) {
    out.push('webhook url \u2192 (\u0628\u0639\u062F \u0627\u0632 Deploy \u0646\u0645\u0627\u06CC\u0634 \u062F\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F)');
  }

  out.push('ALLOWED_USER_IDS \u2192 ' + JSON.stringify(CONFIG.ALLOWED_USER_IDS || []));

  var report = out.join('\n');
  Logger.log(report);
  return report;
}

// ---------------------------------------------------------------- \u0645\u0633\u06CC\u0631\u06CC\u0627\u0628\u06CC
function handleMessage_(msg) {
  var user = msg.from || {};
  var chatId = msg.chat && msg.chat.id;
  if (!chatId) return;

  if (msg.text && msg.text.charAt(0) === '/') {
    return handleCommand_(msg, chatId, user);
  }

  if (!isAllowed_(user.id)) {
    sendMessage_(chatId,
      '\u26D4\uFE0F \u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u062E\u0635\u0648\u0635\u06CC \u0627\u0633\u062A.\n\u0622\u06CC\u062F\u06CC \u0639\u062F\u062F\u06CC \u062A\u0648: <code>' + user.id + '</code>\n' +
      '\u0627\u06CC\u0646 \u0622\u06CC\u062F\u06CC \u0631\u0627 \u062F\u0631 ALLOWED_USER_IDS \u0627\u0633\u06A9\u0631\u06CC\u067E\u062A \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646.');
    return;
  }

  var stamp = formatStamp_();
  var subfolder = CONFIG.SUBFOLDER_MODE === 'date' ? formatDate_() : null;

  // \u0645\u062A\u0646 \u0633\u0627\u062F\u0647
  if (msg.text) {
    try {
      var saved = saveText_(msg.text, stamp, subfolder);
      sendMessage_(chatId, '\u2705 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F\n\uD83D\uDCDD <a href="' + esc_(saved.url) + '">' + esc_(saved.name) + '</a>');
    } catch (err) {
      sendMessage_(chatId, '\u26A0\uFE0F ' + esc_(friendlyError_(err)));
    }
    return;
  }

  var item = extractItem_(msg, stamp);
  if (!item) {
    sendMessage_(chatId, '\uD83E\uDD14 \u0627\u06CC\u0646 \u0646\u0648\u0639 \u067E\u06CC\u0627\u0645 \u0631\u0627 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0645 \u0630\u062E\u06CC\u0631\u0647 \u06A9\u0646\u0645.');
    return;
  }

  if (msg.media_group_id) {
    return handleAlbum_(msg.media_group_id, chatId, item, subfolder);
  }

  try {
    var file = saveItem_(item, subfolder);
    sendMessage_(chatId,
      '\u2705 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F\n' + emojiFor_(item.kind) + ' <a href="' + esc_(file.url) + '">' + esc_(file.name) + '</a>');
  } catch (err) {
    sendMessage_(chatId, '\u26A0\uFE0F ' + esc_(friendlyError_(err)));
  }
}

function handleCommand_(msg, chatId, user) {
  var cmd = msg.text.split(/\s+/)[0].replace(/@.*$/, '').toLowerCase();

  if (cmd === '/ping') {
    sendMessage_(chatId, '\uD83C\uDFD3 pong \u2014 \u0631\u0628\u0627\u062A \u0632\u0646\u062F\u0647 \u0627\u0633\u062A.\n\u0686\u062A \u0622\u06CC\u062F\u06CC: <code>' + chatId + '</code>');
    return;
  }

  if (cmd === '/id') {
    sendMessage_(chatId, '\u0622\u06CC\u062F\u06CC \u06A9\u0627\u0631\u0628\u0631: <code>' + user.id + '</code>\n\u0622\u06CC\u062F\u06CC \u0686\u062A: <code>' + chatId + '</code>');
    return;
  }

  if (cmd === '/folder') {
    var folder = targetFolder_(null);
    sendMessage_(chatId, '\uD83D\uDCC1 <a href="' + esc_(folder.getUrl()) + '">' + esc_(folder.getName()) + '</a>');
    return;
  }

  if (cmd === '/start' || cmd === '/help') {
    var me = tg_('getMe', {}) || {};
    var username = (me.result && me.result.username) || '';
    var root = targetFolder_(null);
    sendMessage_(chatId,
      '\u0633\u0644\u0627\u0645 ' + esc_(user.first_name || '\u062F\u0648\u0633\u062A \u0645\u0646') + ' \uD83D\uDC4B\n' +
      '\u0647\u0631 \u0686\u06CC\u0632\u06CC \u0628\u0631\u0627\u06CC\u0645 \u0628\u0641\u0631\u0633\u062A\u06CC \u062F\u0631 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u0645.\n\n' +
      '\uD83D\uDCC1 \u0645\u0642\u0635\u062F: <a href="' + esc_(root.getUrl()) + '">' + esc_(root.getName()) + '</a>\n\n' +
      '\uD83D\uDCDD \u0645\u062A\u0646 (\u0633\u0646\u062F \u06AF\u0648\u06AF\u0644) \u00B7 \uD83D\uDDBC \u0639\u06A9\u0633 \u00B7 \uD83C\uDFAC \u0648\u06CC\u062F\u06CC\u0648 \u00B7 \uD83C\uDFB5 \u0645\u0648\u0632\u06CC\u06A9 \u00B7 \uD83C\uDFA4 \u0648\u06CC\u0633 \u00B7 \uD83D\uDCC4 \u0641\u0627\u06CC\u0644\n\n' +
      '\uD83C\uDD94 \u0622\u06CC\u062F\u06CC \u062A\u0648: <code>' + user.id + '</code>\n' +
      '\uD83E\uDD16 \u0631\u0628\u0627\u062A: @' + esc_(username) + '\n\n' +
      '\u062F\u0633\u062A\u0648\u0631\u0647\u0627: /folder \u0644\u06CC\u0646\u06A9 \u067E\u0648\u0634\u0647 \u00B7 /id \u0622\u06CC\u062F\u06CC \u0645\u0646 \u00B7 /ping \u062A\u0633\u062A');
    return;
  }

  sendMessage_(chatId, '\u062F\u0633\u062A\u0648\u0631 \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647. \u0628\u0646\u0648\u06CC\u0633 /help');
}

function isAllowed_(userId) {
  var list = CONFIG.ALLOWED_USER_IDS || [];
  if (!list.length) return true;
  return list.map(String).indexOf(String(userId)) !== -1;
}

// ---------------------------------------------------------------- \u0622\u0644\u0628\u0648\u0645\u200C\u0647\u0627
/**
 * \u062A\u0644\u06AF\u0631\u0627\u0645 \u0647\u0631 \u0639\u06A9\u0633 \u0622\u0644\u0628\u0648\u0645 \u0631\u0627 \u062F\u0631 \u06CC\u06A9 \u0622\u067E\u062F\u06CC\u062A \u062C\u062F\u0627 \u0645\u06CC\u200C\u0641\u0631\u0633\u062A\u062F. \u0627\u06CC\u0646\u062C\u0627:
 *  \u06F1) \u0647\u0631 \u0622\u06CC\u062A\u0645 \u0631\u0627 \u062F\u0631 Script Properties \u06A9\u0646\u0627\u0631 \u0628\u0642\u06CC\u0647 \u0627\u0639\u0636\u0627\u06CC \u0647\u0645\u0627\u0646 \u0622\u0644\u0628\u0648\u0645 \u0645\u06CC\u200C\u06AF\u0630\u0627\u0631\u06CC\u0645
 *  \u06F2) \u06A9\u0645\u06CC \u0635\u0628\u0631 \u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645 \u062A\u0627 \u0628\u0642\u06CC\u0647 \u0628\u0631\u0633\u0646\u062F
 *  \u06F3) \u0627\u0648\u0644\u06CC\u0646 \u0627\u06A9\u06CC\u0632\u06A9\u06CC\u0648\u0634\u0646\u06CC \u06A9\u0647 \u0628\u06CC\u062F\u0627\u0631 \u0634\u062F\u060C \u0647\u0645\u0647 \u0631\u0627 \u0622\u067E\u0644\u0648\u062F \u0645\u06CC\u200C\u06A9\u0646\u062F \u0648 \u06CC\u06A9 \u067E\u06CC\u0627\u0645 \u0645\u06CC\u200C\u0641\u0631\u0633\u062A\u062F
 */
function handleAlbum_(groupId, chatId, item, subfolder) {
  var key = 'album_' + groupId;
  var lock = LockService.getScriptLock();

  lock.waitLock(30000);
  try {
    var raw = PROPS.getProperty(key);
    var album = raw ? JSON.parse(raw) : { items: [], flushed: false };
    if (album.flushed) {
      // \u0622\u0644\u0628\u0648\u0645 \u0642\u0628\u0644\u0627\u064B \u062C\u0645\u0639\u200C\u0628\u0646\u062F\u06CC \u0634\u062F\u0647\u061B \u0622\u06CC\u062A\u0645 \u062F\u06CC\u0631\u0631\u0633 \u0631\u0627 \u062C\u062F\u0627 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645
      album = { items: [], flushed: false };
      PROPS.deleteProperty(key);
    }
    album.items.push(item);
    PROPS.setProperty(key, JSON.stringify(album));
  } finally {
    lock.releaseLock();
  }

  Utilities.sleep(3000); // \u0635\u0628\u0631 \u0628\u0631\u0627\u06CC \u0631\u0633\u06CC\u062F\u0646 \u0628\u0642\u06CC\u0647 \u0639\u06A9\u0633\u200C\u0647\u0627\u06CC \u0647\u0645\u0627\u0646 \u0622\u0644\u0628\u0648\u0645

  flushAlbum_(key, chatId, subfolder);
}

/**
 * \u0647\u0645\u0647 \u0622\u06CC\u062A\u0645\u200C\u0647\u0627\u06CC \u06CC\u06A9 \u0622\u0644\u0628\u0648\u0645 \u0631\u0627 \u0628\u0631\u0645\u06CC\u200C\u062F\u0627\u0631\u062F \u0648 \u0622\u067E\u0644\u0648\u062F \u0645\u06CC\u200C\u06A9\u0646\u062F.
 * \u0641\u0642\u0637 \u06CC\u06A9 \u0627\u062C\u0631\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0631\u0646\u062F\u0647 \u0634\u0648\u062F (\u067E\u0631\u0686\u0645 flushed) \u2192 \u06CC\u06A9 \u067E\u06CC\u0627\u0645 \u062C\u0645\u0639\u200C\u0628\u0646\u062F\u06CC.
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
      lines.push('\u2022 <a href="' + esc_(f.url) + '">' + esc_(f.name) + '</a>');
    } catch (err) {
      lines.push('\u26A0\uFE0F ' + esc_(friendlyError_(err)));
    }
  }

  var header = okCount
    ? '\u2705 ' + okCount + ' \u0641\u0627\u06CC\u0644 \u062F\u0631 \u06AF\u0648\u06AF\u0644 \u062F\u0631\u0627\u06CC\u0648 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F'
    : '\u26A0\uFE0F \u0647\u06CC\u0686\u200C\u06A9\u062F\u0627\u0645 \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F';
  sendMessage_(chatId, header + '\n\n' + lines.join('\n'));
}

// ---------------------------------------------------------------- \u0627\u0633\u062A\u062E\u0631\u0627\u062C
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

// ---------------------------------------------------------------- \u0630\u062E\u06CC\u0631\u0647
function saveItem_(item, subfolder) {
  if (item.size && item.size > CONFIG.MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error('\u0641\u0627\u06CC\u0644 \u0628\u0632\u0631\u06AF\u200C\u062A\u0631 \u0627\u0632 ' + CONFIG.MAX_UPLOAD_MB + ' \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A \u0627\u0633\u062A (\u0633\u0642\u0641 Bot API \u062A\u0644\u06AF\u0631\u0627\u0645).');
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
    throw new Error('\u06AF\u0631\u0641\u062A\u0646 \u0641\u0627\u06CC\u0644 \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F: ' + JSON.stringify(info));
  }
  var path = info.result.file_path;
  if (!path) throw new Error('file_path \u0628\u0631\u0646\u06AF\u0634\u062A (\u0641\u0627\u06CC\u0644 \u0628\u0632\u0631\u06AF\u200C\u062A\u0631 \u0627\u0632 \u06F2\u06F0MB \u0627\u0633\u062A\u061F)');

  var res = UrlFetchApp.fetch(API + token_() + '/' + path, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('\u062F\u0627\u0646\u0644\u0648\u062F \u0627\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F (HTTP ' + res.getResponseCode() + ')');
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

// ---------------------------------------------------------------- \u062A\u0644\u06AF\u0631\u0627\u0645
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
    console.error(method + ' \u2192 HTTP ' + code + ' ' + res.getContentText());
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

// ---------------------------------------------------------------- \u06A9\u0645\u06A9\u06CC\u200C\u0647\u0627
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
    photo: '\uD83D\uDDBC', file: '\uD83D\uDCC4', video: '\uD83C\uDFAC', audio: '\uD83C\uDFB5',
    voice: '\uD83C\uDFA4', video_note: '\u2B55\uFE0F', animation: '\uD83C\uDF9E', sticker: '\uD83E\uDE77'
  };
  return map[kind] || '\uD83D\uDCC4';
}

function friendlyError_(err) {
  var s = String(err && err.message ? err.message : err);
  if (s.indexOf('Service invoked too many times') !== -1 || s.indexOf('exceeded') !== -1) {
    return '\u0633\u0647\u0645\u06CC\u0647 \u0631\u0648\u0632\u0627\u0646\u0647 Apps Script \u067E\u0631 \u0634\u062F. \u0641\u0631\u062F\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646 (\u06CC\u0627 \u0641\u0627\u06CC\u0644 \u06A9\u0645\u062A\u0631\u06CC \u0622\u067E\u0644\u0648\u062F \u06A9\u0646).';
  }
  if (s.indexOf('No item with the given ID') !== -1) {
    return '\u067E\u0648\u0634\u0647 \u0645\u0642\u0635\u062F \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F\u061B FOLDER_ID \u0631\u0627 \u0686\u06A9 \u06A9\u0646.';
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
