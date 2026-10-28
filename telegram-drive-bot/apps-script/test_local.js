/**
 * تست محلی منطق Code.gs بدون Google Apps Script.
 * سرویس‌های Apps Script را mock می‌کند و چند سناریو را اجرا می‌کند.
 *   node apps-script/test_local.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// ---------------------------------------------------------------- mocks
const store = { props: {}, files: [], folders: {}, sent: [], webhook: null, calls: [], pending: [] };

function makeBlob(name, mime, bytes) {
  let _name = name, _mime = mime, _bytes = bytes || 'x';
  return {
    setName(n) { _name = n; return this; },
    setContentType(m) { _mime = m; return this; },
    getName() { return _name; },
    getContentType() { return _mime; },
    getBytes() { return _bytes; },
  };
}

function makeFile(blob, id) {
  const f = {
    _blob: blob,
    id: id,
    name: blob.getName(),
    description: '',
    getName() { return this.name; },
    getId() { return this.id; },
    getUrl() { return 'https://drive.google.com/file/d/' + this.id + '/view'; },
    setName(n) { this.name = n; return this; },
    setDescription(d) { this.description = d; return this; },
  };
  return f;
}

function makeFolder(name, id) {
  const children = [];
  return {
    id, name, children,
    getName() { return name; },
    getId() { return id; },
    getUrl() { return 'https://drive.google.com/drive/folders/' + id; },
    createFile(a, b, c) {
      let blob;
      if (typeof a === 'string' && typeof b === 'string') {
        blob = makeBlob(a, c === 'GOOGLE_DOCS' ? 'application/vnd.google-apps.document' : 'text/plain', b);
      } else {
        blob = a;
      }
      const f = makeFile(blob, 'id_' + (store.files.length + 1));
      children.push(f);
      store.files.push(f);
      return f;
    },
    getFoldersByName(n) {
      const hits = children.filter((c) => c && c.__isFolder && c.name === n);
      let i = 0;
      return { hasNext: () => i < hits.length, next: () => hits[i++] };
    },
    createFolder(n) {
      const sub = makeFolder(n, 'folder_' + n);
      sub.__isFolder = true;
      children.push(sub);
      store.folders[n] = sub;
      return sub;
    },
  };
}

const rootFolder = makeFolder('root', 'root_id');

const sandbox = {
  console,
  JSON,
  Date,
  String,
  Number,
  Array,
  Object,
  RegExp,
  Error,
  encodeURIComponent,
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => (k in store.props ? store.props[k] : null),
      setProperty: (k, v) => { store.props[k] = v; },
      deleteProperty: (k) => { delete store.props[k]; },
    }),
  },
  CacheService: (() => {
    const cache = { _c: {}, get(k) { return this._c[k] || null; }, put(k, v) { this._c[k] = v; } };
    return { getScriptCache: () => cache };
  })(),
  LockService: {
    getScriptLock: () => ({ waitLock() {}, releaseLock() {} }),
  },
  DriveApp: {
    getFoldersByName: (n) => rootFolder.getFoldersByName(n),
    getFolderById: (id) => (id === 'root_id' ? rootFolder : (() => { throw new Error('No item with the given ID: ' + id); })()),
    getRootFolder: () => rootFolder,
  },
  MimeType: { PLAIN_TEXT: 'PLAIN_TEXT', GOOGLE_DOCS: 'GOOGLE_DOCS' },
  Utilities: {
    formatDate: (d, tz, fmt) => {
      // فقط برای تست: زمان ثابت
      const pad = (n) => String(n).padStart(2, '0');
      const t = new Date('2026-10-28T09:30:00Z');
      return fmt
        .replace('yyyy', t.getUTCFullYear())
        .replace('MM', pad(t.getUTCMonth() + 1))
        .replace('dd', pad(t.getUTCDate()))
        .replace('HH', pad(t.getUTCHours()))
        .replace('mm', pad(t.getUTCMinutes()))
        .replace('ss', pad(t.getUTCSeconds()));
    },
    sleep: () => {},
  },
  Logger: { log: () => {} },
  ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/FAKE/exec' }) },
  ContentService: {
    MimeType: { TEXT: 'TEXT', JSON: 'JSON' },
    createTextOutput: (s) => ({ _s: s, setMimeType() { return this; }, getContent() { return this._s; } }),
  },
  UrlFetchApp: {
    fetch: (url, opts) => {
      // getFile
      if (/\/getFile$/.test(url)) {
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ ok: true, result: { file_path: 'documents/file_1.jpg' } }),
        };
      }
      // download file content
      if (/\/documents\//.test(url)) {
        return {
          getResponseCode: () => 200,
          getBlob: () => makeBlob('downloaded.jpg', 'image/jpeg', 'BYTES'),
          getContentText: () => 'BYTES',
        };
      }
      // telegram methods
      const method = url.split('/').pop();
      if (method === 'getMe') {
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ ok: true, result: { username: 'T2GD2Tbot' } }) };
      }
      if (method === 'getUpdates') {
        store.calls.push({ method, payload: JSON.parse((opts && opts.payload) || '{}') });
        const payload = JSON.parse((opts && opts.payload) || '{}');
        const out = payload.offset ? [] : store.pending.slice();
        if (payload.offset) store.pending.length = 0;
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ ok: true, result: out }) };
      }
      if (method === 'setWebhook' || method === 'getWebhookInfo' || method === 'deleteWebhook') {
        store.webhook = { method, payload: JSON.parse((opts && opts.payload) || '{}') };
        store.calls.push({ method, payload: store.webhook.payload });
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ ok: true, result: true }) };
      }
      if (method === 'sendMessage') {
        store.calls.push({ method, payload: JSON.parse(opts.payload) });
        store.sent.push(JSON.parse(opts.payload));
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ ok: true, result: {} }) };
      }
      return { getResponseCode: () => 404, getContentText: () => '{"ok":false}' };
    },
  },
};

store.props.BOT_TOKEN = '123456789:AAH_TEST_TOKEN_0123456789'; // در تست، توکن از Script Properties
vm.createContext(sandbox);
const target = process.argv[2] || 'Code.gs';
const code = fs.readFileSync(path.join(__dirname, target), 'utf8');
console.log('# testing ' + target + '\n');
vm.runInContext(code, sandbox);

// ---------------------------------------------------------------- helpers
const SECRET = 'change-this-to-a-long-random-string';
let uid = 100;
function post(update) {
  const r = sandbox.doPost({
    parameter: { k: SECRET },
    postData: { contents: JSON.stringify({ update_id: ++uid, message: update }) },
  });
  if (process.env.DEBUG) console.log('   →', r.getContent());
  return r;
}
const msgBase = (extra) => Object.assign({
  message_id: 1,
  chat: { id: 555 },
  from: { id: 42, first_name: 'Ali' },
}, extra);

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ---------------------------------------------------------------- tests
test('webhook با سکرت غلط رد می‌شود', () => {
  const out = sandbox.doPost({ parameter: { k: 'wrong' }, postData: { contents: '{}' } });
  assert.strictEqual(out.getContent(), '{"ok":false,"error":"forbidden"}');
});

test('صفحه وب‌اپ هرگز سفید/خطا نیست (ping گزارش می‌دهد)', () => {
  const out = sandbox.doGet({ parameter: { k: SECRET } });
  const body = out.getContent();
  assert.ok(body.includes('ربات تلگرام'), body);
  assert.ok(body.includes('✅ توکن'), body);
  assert.ok(body.includes('✅ پوشه مقصد'), body);
});

test('بدون k پیام «دسترسی ندارید» می‌دهد (نه صفحه سفید)', () => {
  const body = sandbox.doGet({ parameter: {} }).getContent();
  assert.ok(body.includes('دسترسی ندارید'), body);
});

test('توکن جای‌گذاری نشده → راهنمای واضح', () => {
  const saved = store.props.BOT_TOKEN;
  delete store.props.BOT_TOKEN;
  try {
    const body = sandbox.doGet({ parameter: { k: SECRET, action: 'setup' } }).getContent();
    assert.ok(body.includes('توکن تلگرام تنظیم نشده'), body);
    assert.ok(body.includes('BOT_TOKEN'), body);
    assert.ok(body.includes('Script Properties'), body);
  } finally {
    store.props.BOT_TOKEN = saved;
  }
});

test('توکن: placeholder نادیده گرفته و از Script Properties خوانده می‌شود', () => {
  assert.strictEqual(sandbox.currentToken_(), '123456789:AAH_TEST_TOKEN_0123456789');
  vm.runInContext("CONFIG.BOT_TOKEN = 'PUT-YOUR-NEW-BOT-TOKEN-HERE'", sandbox);
  assert.strictEqual(sandbox.currentToken_(), '123456789:AAH_TEST_TOKEN_0123456789');
  vm.runInContext("CONFIG.BOT_TOKEN = '8621978100:AAH_REAL_TOKEN_0123456789'", sandbox);
  assert.strictEqual(sandbox.currentToken_(), '8621978100:AAH_REAL_TOKEN_0123456789');
  vm.runInContext("CONFIG.BOT_TOKEN = 'PUT-YOUR-NEW-BOT-TOKEN-HERE'", sandbox);
});

test('توکن با فاصله/کوتیشن اضافه هم درست خوانده می‌شود', () => {
  vm.runInContext("CONFIG.BOT_TOKEN = '  8621978100:AAH_REAL_TOKEN_0123456789  '", sandbox);
  assert.strictEqual(sandbox.currentToken_(), '8621978100:AAH_REAL_TOKEN_0123456789');
  vm.runInContext("CONFIG.BOT_TOKEN = 'PUT-YOUR-NEW-BOT-TOKEN-HERE'", sandbox);
});

test('checkSetup بدون خطا اجرا می‌شود', () => {
  const report = sandbox.checkSetup();
  assert.ok(report.includes('token OK'), report);
  assert.ok(report.includes('folder OK'), report);
});

test('متن به سند گوگل تبدیل می‌شود', () => {
  const before = store.files.length;
  post(msgBase({ text: 'سلام دنیا' }));
  assert.strictEqual(store.files.length, before + 1);
  const f = store.files[store.files.length - 1];
  assert.ok(f.name.startsWith('note_2026-10-28_'));
  assert.strictEqual(f._blob.getContentType(), 'application/vnd.google-apps.document');
  assert.ok(store.folders['2026-10-28'], 'زیرپوشه تاریخ باید ساخته شود');
  assert.ok(store.sent[store.sent.length - 1].text.includes('✅ ذخیره شد'));
});

test('عکس با بالاترین کیفیت آپلود می‌شود', () => {
  post(msgBase({
    photo: [{ file_id: 'small', file_size: 100 }, { file_id: 'big', file_size: 900 }],
    caption: 'گربه',
  }));
  const f = store.files[store.files.length - 1];
  assert.ok(/^photo_2026-10-28_.*\.jpg$/.test(f.name), f.name);
  assert.strictEqual(f.description, 'گربه');
});

test('نام فایل خطرناک پاک‌سازی می‌شود', () => {
  post(msgBase({ document: { file_id: 'd1', file_name: '../../etc/passwd', file_size: 10 } }));
  const f = store.files[store.files.length - 1];
  assert.ok(!f.name.includes('/'), f.name);
});

test('فایل بزرگ رد می‌شود', () => {
  const before = store.files.length;
  post(msgBase({ document: { file_id: 'd2', file_name: 'big.zip', file_size: 50 * 1024 * 1024 } }));
  assert.strictEqual(store.files.length, before);
  assert.ok(store.sent[store.sent.length - 1].text.includes('مگابایت'));
});

test('/id آیدی عددی می‌دهد', () => {
  post(msgBase({ text: '/id' }));
  assert.ok(store.sent[store.sent.length - 1].text.includes('42'));
});

test('/start لینک پوشه و یوزرنیم را می‌دهد', () => {
  post(msgBase({ text: '/start' }));
  const t = store.sent[store.sent.length - 1].text;
  assert.ok(t.includes('T2GD2Tbot'));
  assert.ok(t.includes('drive.google.com'));
});

test('آلبوم: سه عکس بلافاصله بعد از دریافت در Drive ذخیره می‌شوند', () => {
  const before = store.files.length;
  const album = (i) => msgBase({ media_group_id: 'G1', photo: [{ file_id: 'p' + i, file_size: 10 }], caption: '' });
  post(album(1));
  post(album(2));
  post(album(3));
  // در اجرای واقعی هر سه هم‌زمان‌اند و ۳ ثانیه صبر می‌کنند؛ اینجا اجراها سریالی‌اند
  assert.ok(store.files.length > before);
});

test('آلبوم: یک آلبوم با ۳ آیتم → یک پیام و ۳ فایل', () => {
  const before = store.files.length;
  const items = [1, 2, 3].map((i) => ({
    kind: 'photo', fileId: 'g' + i, size: 10, name: 'photo_' + i + '.jpg',
    mime: 'image/jpeg', caption: '',
  }));
  store.props['album_G2'] = JSON.stringify({ items, flushed: false });
  const sentBefore = store.sent.length;

  sandbox.flushAlbum_('album_G2', 555, null); // نفر اول
  sandbox.flushAlbum_('album_G2', 555, null); // اجراهای بعدی نباید دوباره آپلود کنند

  assert.strictEqual(store.files.length, before + 3);
  assert.strictEqual(store.sent.length, sentBefore + 1);
  assert.ok(store.sent[store.sent.length - 1].text.includes('3 فایل'));
  assert.strictEqual(store.props['album_G2'], undefined);
});

test('آپدیت تکراری تلگرام دوباره آپلود نمی‌شود', () => {
  const before = store.files.length;
  const sentBefore = store.sent.length;
  const update = msgBase({ text: 'فقط یک‌بار' });
  sandbox.doPost({
    parameter: { k: SECRET },
    postData: { contents: JSON.stringify({ update_id: 777, message: update }) },
  });
  const afterFirst = store.files.length;
  sandbox.doPost({
    parameter: { k: SECRET },
    postData: { contents: JSON.stringify({ update_id: 777, message: update }) },
  });
  assert.strictEqual(afterFirst, before + 1);
  assert.strictEqual(store.files.length, afterFirst, 'نباید دوباره ذخیره شود');
  assert.strictEqual(store.sent.length, sentBefore + 1);
});

test('ربات خصوصی غریبه را رد می‌کند', () => {
  vm.runInContext('CONFIG.ALLOWED_USER_IDS = [999]', sandbox);
  const before = store.files.length;
  post(msgBase({ text: 'hack' }));
  assert.strictEqual(store.files.length, before);
  assert.ok(store.sent[store.sent.length - 1].text.includes('⛔️'));
  vm.runInContext('CONFIG.ALLOWED_USER_IDS = []', sandbox);
});

test('action=setup وب‌هوک را ست می‌کند', () => {
  const out = sandbox.doGet({ parameter: { k: SECRET, action: 'setup' } });
  assert.ok(out.getContent().includes('webhook ست شد'));
  assert.strictEqual(store.webhook.method, 'setWebhook');
  assert.ok(store.webhook.payload.url.includes('?k=' + SECRET));
});

test('/ping جواب می‌دهد', () => {
  post(msgBase({ text: '/ping' }));
  assert.ok(store.sent[store.sent.length - 1].text.includes('pong'));
});

test('diag وضعیت کامل را نشان می‌دهد', () => {
  const body = sandbox.doGet({ parameter: { k: SECRET, action: 'diag' } }).getContent();
  assert.ok(body.includes('✅ توکن: درست'), body);
  assert.ok(body.includes('webhook url'), body);
  assert.ok(body.includes('آخرین آپدیت دریافتی'), body);
});

test('heartbeat بعد از آپدیت ذخیره می‌شود', () => {
  post(msgBase({ text: '/ping' }));
  assert.ok(store.props.LAST_UPDATE, 'LAST_UPDATE باید ثبت شود');
  assert.ok(store.props.LAST_UPDATE.includes('update_id'));
});

test('replay پیام‌های معلق را پردازش و webhook را دوباره ست می‌کند', () => {
  const beforeFiles = store.files.length;
  const beforeSent = store.sent.length;
  store.pending = [
    { update_id: 5001, message: msgBase({ text: 'پیام معلق اول' }) },
    { update_id: 5002, message: msgBase({ text: '/id' }) },
  ];

  const body = sandbox.doGet({ parameter: { k: SECRET, action: 'replay' } }).getContent();
  assert.ok(body.includes('تعداد پیام معلق: 2'), body);
  assert.ok(body.includes('پردازش‌شده: 2'), body);
  assert.strictEqual(store.files.length, beforeFiles + 1, 'متن اول باید ذخیره شود');
  assert.strictEqual(store.sent.length, beforeSent + 2, 'هر دو پیام باید جواب بگیرند');
  assert.ok(store.calls.some((c) => c.method === 'setWebhook'), 'webhook باید دوباره ست شود');
  assert.ok(store.calls.some((c) => c.method === 'getUpdates' && c.payload.offset === 5003));
  assert.strictEqual(store.pending.length, 0);
});

test('replay با پیام معلقِ عکس، فایل را ذخیره می‌کند', () => {
  const beforeFiles = store.files.length;
  store.pending = [{
    update_id: 5003,
    message: msgBase({ photo: [{ file_id: 'pend', file_size: 100 }], caption: 'معلق' }),
  }];
  const body = sandbox.doGet({ parameter: { k: SECRET, action: 'replay' } }).getContent();
  assert.ok(body.includes('پردازش‌شده: 1'), body);
  assert.strictEqual(store.files.length, beforeFiles + 1);
});

test('sendtest بدون chat راهنما می‌دهد', () => {
  const body = sandbox.doGet({ parameter: { k: SECRET, action: 'sendtest' } }).getContent();
  assert.ok(body.includes('آیدی چت'), body);
});

test('sendtest با chat پیام می‌فرستد', () => {
  const before = store.sent.length;
  const body = sandbox.doGet({ parameter: { k: SECRET, action: 'sendtest', chat: '555' } }).getContent();
  assert.ok(body.includes('ارسال تست موفق'), body);
  assert.strictEqual(store.sent.length, before + 1);
});

let failed = 0;
for (const t of tests) {
  try {
    t.fn();
    console.log('ok   - ' + t.name);
  } catch (err) {
    failed++;
    console.log('FAIL - ' + t.name + '\n       ' + err.message);
  }
}
console.log('\n' + (tests.length - failed) + '/' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
