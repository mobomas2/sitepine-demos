/**
 * تست محلی Code.single.gs بدون گوگل و بدون تلگرام:  node test_single.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const store = { props: {}, files: [], sent: [], pending: [], triggers: [], calls: [] };

function blob(n, m) {
  let _n = n, _m = m;
  return { setName(x) { _n = x; return this; }, setContentType(x) { _m = x; return this; },
           getName() { return _n; }, getContentType() { return _m; } };
}

function folder(name, id) {
  const kids = [];
  return {
    __f: true, getName: () => name, getId: () => id,
    getUrl: () => 'https://drive.google.com/drive/folders/' + id,
    createFile(a, b, c) {
      let bl;
      if (typeof a === 'string' && typeof b === 'string') {
        bl = blob(a, c === 'GOOGLE_DOCS' ? 'application/vnd.google-apps.document' : 'text/plain');
      } else bl = a;
      const f = { name: bl.getName(), blob: bl, desc: '',
        getName() { return this.name; }, getId() { return 'id' + (store.files.length + 1); },
        getUrl() { return 'https://drive.google.com/file/' + this.getId() + '/view'; },
        setName(n) { this.name = n; return this; },
        setDescription(d) { this.desc = d; return this; } };
      kids.push(f); store.files.push(f); return f;
    },
    getFoldersByName(n) {
      const hits = kids.filter((k) => k.__f && k.getName() === n);
      let i = 0;
      return { hasNext: () => i < hits.length, next: () => hits[i++] };
    },
    createFolder(n) { const s = folder(n, 'sub_' + n); kids.push(s); return s; },
  };
}

const root = folder('root', 'root');
const cache = { c: {}, get(k) { return this.c[k] || null; }, put(k, v) { this.c[k] = v; } };

const sandbox = {
  console, JSON, Date, String, Number, Array, Object, RegExp, Error, Math,
  Logger: { log: () => {} },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: (k) => (k in store.props ? store.props[k] : null),
    setProperty: (k, v) => { store.props[k] = v; },
  }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  CacheService: { getScriptCache: () => cache },
  DriveApp: { getRootFolder: () => root, getFolderById: () => root, getFoldersByName: (n) => root.getFoldersByName(n) },
  MimeType: { PLAIN_TEXT: 'PLAIN_TEXT', GOOGLE_DOCS: 'GOOGLE_DOCS' },
  Utilities: { formatDate: (d, tz, f) => '2026-10-28_12-00-00' },
  ScriptApp: {
    getProjectTriggers: () => store.triggers.slice(),
    deleteTrigger: (t) => { const i = store.triggers.indexOf(t); if (i >= 0) store.triggers.splice(i, 1); },
    newTrigger: (fn) => ({ timeBased() { return this; },
      everyMinutes() { const t = { fn, getHandlerFunction: () => fn }; store.triggers.push(t);
        return { create() { return t; } }; } }),
  },
  UrlFetchApp: { fetch: (url, opts) => {
    if (url.indexOf('/documents/') !== -1) {
      return { getResponseCode: () => 200, getBlob: () => blob('dl.jpg', 'image/jpeg') };
    }
    const m = url.split('/bot')[1].split('/').pop();
    const ok = (obj) => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(obj) });
    if (m === 'getMe') return ok({ ok: true, result: { username: 'T2GD2Tbot' } });
    if (m === 'getWebhookInfo') return ok({ ok: true, result: { url: '', pending_update_count: 0 } });
    if (m === 'deleteWebhook') { store.calls.push(m); return ok({ ok: true, result: true }); }
    if (m === 'getUpdates') {
      const p = JSON.parse(opts.payload || '{}');
      const off = p.offset || 0;
      const out = store.pending.filter((u) => u.update_id >= off);
      store.pending = store.pending.filter((u) => u.update_id < off);
      return ok({ ok: true, result: out });
    }
    if (m === 'getFile') return ok({ ok: true, result: { file_path: 'documents/x.jpg' } });
    if (m === 'sendMessage') { const p = JSON.parse(opts.payload); store.sent.push(p); return ok({ ok: true }); }
    return ok({ ok: true });
  } },
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.single.gs'), 'utf8'), sandbox);

// ---------------------------------------------------------------- helpers
let uid = 1000;
const msg = (extra) => Object.assign({ chat: { id: 555 }, from: { id: 42, first_name: 'Ali' } }, extra);
const push = (m) => store.pending.push({ update_id: ++uid, message: m });
const last = () => store.sent[store.sent.length - 1];

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ---------------------------------------------------------------- tests
test('START: توکن، پوشه، تریگر، پردازش معلق‌ها', () => {
  push(msg({ text: 'سلام' }));
  push(msg({ photo: [{ file_id: 'p', file_size: 100 }], caption: 'عکس' }));
  const report = sandbox.START();
  assert.ok(report.includes('✅ ربات: @T2GD2Tbot'), report);
  assert.ok(report.includes('✅ تریگر نصب شد'), report);
  assert.ok(report.includes('🎉 تمام شد'), report);
  assert.strictEqual(store.triggers.length, 1);
  assert.strictEqual(store.files.length, 2);
  assert.strictEqual(store.sent.length, 2);
});

test('START دوباره تریگر تکراری نمی‌سازد', () => {
  sandbox.START();
  assert.strictEqual(store.triggers.length, 1);
});

test('POLL: پیام جدید متن را سند گوگل می‌کند', () => {
  const before = store.files.length;
  push(msg({ text: 'یادداشت' }));
  assert.strictEqual(sandbox.POLL(), 1);
  const f = store.files[store.files.length - 1];
  assert.strictEqual(store.files.length, before + 1);
  assert.strictEqual(f.blob.getContentType(), 'application/vnd.google-apps.document');
});

test('POLL: وقتی پیامی نیست 0 برمی‌گرداند', () => {
  assert.strictEqual(sandbox.POLL(), 0);
});

test('آلبوم ۳ عکسی: ۳ فایل + فقط یک پیام', () => {
  const files = store.files.length;
  const sent = store.sent.length;
  const g = 'GROUP1';
  push(msg({ media_group_id: g, photo: [{ file_id: 'a', file_size: 10 }] }));
  push(msg({ media_group_id: g, photo: [{ file_id: 'b', file_size: 10 }] }));
  push(msg({ media_group_id: g, photo: [{ file_id: 'c', file_size: 10 }] }));
  const n = sandbox.POLL();
  assert.strictEqual(n, 3);
  assert.strictEqual(store.files.length, files + 3);
  assert.strictEqual(store.sent.length, sent + 1);
  assert.ok(last().text.includes('3 فایل'), last().text);
});

test('/ping و /id', () => {
  push(msg({ text: '/ping' }));
  sandbox.POLL();
  assert.ok(last().text.includes('pong'));
  push(msg({ text: '/id' }));
  sandbox.POLL();
  assert.ok(last().text.includes('42'));
});

test('/start راهنما با یوزرنیم و لینک پوشه', () => {
  push(msg({ text: '/start' }));
  sandbox.POLL();
  assert.ok(last().text.includes('T2GD2Tbot'), last().text);
  assert.ok(last().text.includes('drive.google.com'), last().text);
});

test('/folder لینک پوشه', () => {
  push(msg({ text: '/folder' }));
  sandbox.POLL();
  assert.ok(last().text.includes('folders/root'), last().text);
});

test('فایل بزرگ رد می‌شود', () => {
  const before = store.files.length;
  push(msg({ document: { file_id: 'big', file_name: 'big.zip', file_size: 50 * 1024 * 1024 } }));
  sandbox.POLL();
  assert.strictEqual(store.files.length, before);
  assert.ok(last().text.includes('مگابایت'), last().text);
});

test('نام فایل خطرناک پاک‌سازی می‌شود', () => {
  push(msg({ document: { file_id: 'd', file_name: '../../etc/passwd', file_size: 10 } }));
  sandbox.POLL();
  const f = store.files[store.files.length - 1];
  assert.ok(!f.getName().includes('/'), f.getName());
});

test('حالت خصوصی: غریبه رد می‌شود', () => {
  vm.runInContext('ALLOWED = [999]', sandbox);
  const before = store.files.length;
  push(Object.assign(msg({ text: 'hack' }), { from: { id: 42 } }));
  sandbox.POLL();
  assert.strictEqual(store.files.length, before);
  assert.ok(last().text.includes('⛔️'), last().text);
  vm.runInContext('ALLOWED = []', sandbox);
});

test('STATUS گزارش می‌دهد', () => {
  const r = sandbox.STATUS();
  assert.ok(r.includes('تریگر POLL: 1'), r);
  assert.ok(r.includes('✅ @T2GD2Tbot'), r);
});

test('STOP تریگر را حذف می‌کند', () => {
  sandbox.STOP();
  assert.strictEqual(store.triggers.length, 0);
});

test('نسخه و توکن داخل فایل درست است', () => {
  assert.strictEqual(sandbox.VERSION, 'single-1.0');
  assert.ok(/^\d+:[A-Za-z0-9_-]{30,}$/.test(sandbox.BOT_TOKEN), 'توکن باید از قبل پر شده باشد');
});

// ---------------------------------------------------------------- runner
let failed = 0;
for (const t of tests) {
  try { t.fn(); console.log('ok   - ' + t.name); }
  catch (e) { failed++; console.log('FAIL - ' + t.name + '\n       ' + e.message); }
}
console.log('\n' + (tests.length - failed) + '/' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
