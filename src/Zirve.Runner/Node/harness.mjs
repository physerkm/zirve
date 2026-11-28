// Zirve Runner — JavaScript / TypeScript koşucusu.
//
// Protokol: stdin'den JSON yük okunur. Test modunda her test için stdout'a "<nonce>{json}" satırı
// yazılır; script modunda kullanıcının console çıktısı olduğu gibi stdout'a aktarılır.
//
// Yalıtım katmanları (derinlemesine savunma):
//   1. Kullanıcı kodu, ana bağlamdan hiçbir nesne paylaşmayan ayrı bir V8 bağlamında çalışır;
//      iki taraf arasında yalnızca string taşınır.
//   2. Bağlamda eval/new Function kapalıdır.
//   3. Süreç, Node izin modeliyle (--permission) dosya sistemi/alt süreç erişimi olmadan başlatılır.
//   4. Asıl güvenlik sınırı, Runner'ın çalıştığı ağsız ve yetkisiz kapsayıcıdır.
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const USER_FILE = 'solution.js';

// İletilerin dili; Runner ZIRVE_LOCALE ortam değişkeniyle bildirir.
const ENGLISH = process.env.ZIRVE_LOCALE === 'en';
const t = (turkish, english) => (ENGLISH ? english : turkish);
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const payload = JSON.parse(await readStdin());
const {
  nonce,
  mode,
  language,
  spec = null,
  tests = [],
  perTestTimeoutMs = 3000,
  scriptTimeoutMs = 8000,
} = payload;

const emit = (value) => process.stdout.write(nonce + JSON.stringify(value) + '\n');

// ---------------------------------------------------------------- bağlam içi hazırlık kodu

const PRELUDE = String.raw`
(() => {
  'use strict';
  // Test başına 64 K, bütün testler için toplam 400 K karakter (Runner'ın süreç çıktı sınırının altında).
  const LIMIT = 65536;
  let budget = 409600;
  const logs = [];
  const failures = [];
  let size = 0;
  let truncated = false;

  const inspect = (value, depth, seen) => {
    if (value === null) return 'null';
    switch (typeof value) {
      case 'undefined': return 'undefined';
      case 'string': return depth === 0 ? value : JSON.stringify(value);
      case 'number': return Object.is(value, -0) ? '-0' : String(value);
      case 'boolean': return String(value);
      case 'bigint': return String(value) + 'n';
      case 'symbol': return value.toString();
      case 'function': return '[Function: ' + (value.name || 'anonymous') + ']';
    }
    if (seen.has(value)) return '[Circular]';
    if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
    seen.add(value);
    let text;
    if (value instanceof Error) {
      text = value.name + ': ' + value.message;
    } else if (Array.isArray(value)) {
      text = '[' + Array.from(value, (item) => inspect(item, depth + 1, seen)).join(', ') + ']';
    } else if (value instanceof Map) {
      text = 'Map(' + value.size + ') {' + [...value].map(([k, v]) => inspect(k, depth + 1, seen) + ' => ' + inspect(v, depth + 1, seen)).join(', ') + '}';
    } else if (value instanceof Set) {
      text = 'Set(' + value.size + ') {' + [...value].map((item) => inspect(item, depth + 1, seen)).join(', ') + '}';
    } else if (value instanceof Date) {
      text = Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
    } else if (value instanceof RegExp) {
      text = String(value);
    } else if (value instanceof Promise) {
      text = 'Promise {…}';
    } else {
      const ctor = value.constructor && value.constructor.name;
      const prefix = ctor && ctor !== 'Object' ? ctor + ' ' : '';
      const body = Object.keys(value).map((key) => key + ': ' + inspect(value[key], depth + 1, seen)).join(', ');
      text = prefix + (body ? '{ ' + body + ' }' : '{}');
    }
    seen.delete(value);
    return text;
  };

  const write = (args) => {
    if (truncated) return;
    const line = args.map((arg) => inspect(arg, 0, new Set())).join(' ');
    const limit = Math.min(LIMIT, budget);
    if (size + line.length > limit) {
      logs.push(line.slice(0, Math.max(0, limit - size)) + ${JSON.stringify(t('\n… (çıktı kesildi)', '\n… (output truncated)'))});
      truncated = true;
      return;
    }
    size += line.length + 1;
    logs.push(line);
  };

  const noop = () => {};
  const consoleObject = {
    log: (...args) => write(args),
    info: (...args) => write(args),
    warn: (...args) => write(args),
    error: (...args) => write(args),
    debug: (...args) => write(args),
    trace: (...args) => write(args),
    table: (...args) => write(args),
    dir: (value) => write([value]),
    assert: (condition, ...args) => { if (!condition) write(['Assertion failed' + (args.length ? ':' : ''), ...args]); },
    group: noop, groupCollapsed: noop, groupEnd: noop, time: noop, timeEnd: noop, timeLog: noop, count: noop, clear: noop,
  };
  Object.defineProperty(globalThis, 'console', { value: Object.freeze(consoleObject), writable: false, configurable: false });

  function ListNode(val, next) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }

  function TreeNode(val, left, right) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }

  globalThis.ListNode = ListNode;
  globalThis.TreeNode = TreeNode;

  class HarnessError extends Error {}

  const MAX_NODES = 200000;

  const toList = (values, pos = -1) => {
    let head = null;
    let tail = null;
    let cycleTarget = null;
    for (let i = 0; i < values.length; i++) {
      const node = new ListNode(values[i]);
      if (head === null) head = node; else tail.next = node;
      if (i === pos) cycleTarget = node;
      tail = node;
    }
    if (tail !== null && cycleTarget !== null) tail.next = cycleTarget;
    return head;
  };

  const fromList = (head) => {
    const values = [];
    for (let node = head; node !== null && node !== undefined; node = node.next) {
      values.push(node.val);
      if (values.length > MAX_NODES) throw new HarnessError(${JSON.stringify(t('Döndürülen bağlı listede döngü var ya da liste çok uzun.', 'The returned linked list has a cycle or is too long.'))});
    }
    return values;
  };

  const toTree = (values) => {
    if (values.length === 0 || values[0] === null) return null;
    const root = new TreeNode(values[0]);
    const queue = [root];
    let head = 0;
    let index = 1;
    while (head < queue.length && index < values.length) {
      const node = queue[head++];
      if (index < values.length && values[index] !== null) { node.left = new TreeNode(values[index]); queue.push(node.left); }
      index++;
      if (index < values.length && values[index] !== null) { node.right = new TreeNode(values[index]); queue.push(node.right); }
      index++;
    }
    return root;
  };

  const fromTree = (root) => {
    const values = [];
    const queue = [root];
    let head = 0;
    let visited = 0;
    while (head < queue.length) {
      const node = queue[head++];
      if (node === null || node === undefined) { values.push(null); continue; }
      if (++visited > MAX_NODES) throw new HarnessError(${JSON.stringify(t('Döndürülen ağaçta döngü var ya da ağaç çok büyük.', 'The returned tree has a cycle or is too large.'))});
      values.push(node.val);
      queue.push(node.left, node.right);
    }
    while (values.length > 0 && values[values.length - 1] === null) values.pop();
    return values;
  };

  const elementOf = (type) => {
    if (type.endsWith('[]')) return type.slice(0, -2);
    if (type.startsWith('List<') && type.endsWith('>')) return type.slice(5, -1);
    return null;
  };

  const hasNodes = (type) => type.includes('ListNode') || type.includes('TreeNode');

  const decode = (value, type) => {
    if (type === 'ListNode') {
      if (Array.isArray(value)) return toList(value);
      if (value !== null && typeof value === 'object' && Array.isArray(value.values)) {
        return toList(value.values, typeof value.pos === 'number' ? value.pos : -1);
      }
      return null;
    }
    if (type === 'TreeNode') return Array.isArray(value) ? toTree(value) : null;
    const element = elementOf(type);
    if (element !== null && hasNodes(element) && Array.isArray(value)) return value.map((item) => decode(item, element));
    return value;
  };

  const encode = (value, type) => {
    if (value === undefined) return null;
    if (type === 'ListNode') return value === null ? [] : fromList(value);
    if (type === 'TreeNode') return value === null ? [] : fromTree(value);
    const element = elementOf(type);
    if (element !== null && hasNodes(element) && Array.isArray(value)) return value.map((item) => encode(item, element));
    return value;
  };

  const stringify = (value) => JSON.stringify(value, (key, item) => {
    if (typeof item === 'bigint') return Number(item);
    if (item instanceof Set) return [...item];
    if (item instanceof Map) return Object.fromEntries(item);
    return item;
  });

  const describe = (error) => {
    if (error instanceof HarnessError) return { error: error.message, line: 0 };
    if (error instanceof Error) {
      const match = /solution\.js:(\d+)/.exec(String(error.stack || ''));
      return { error: (error.name || 'Error') + ': ' + error.message, line: match ? Number(match[1]) : 0 };
    }
    return { error: ${JSON.stringify(t('Fırlatılan değer: ', 'Thrown value: '))} + inspect(error, 1, new Set()), line: 0 };
  };

  const spec = typeof globalThis.__zSpec === 'string' ? JSON.parse(globalThis.__zSpec) : null;
  delete globalThis.__zSpec;

  const api = {
    spec,
    HarnessError,
    decode,
    encode,
    stringify,
    describe,
    drain: () => { const text = logs.join('\n'); logs.length = 0; budget = Math.max(0, budget - size); size = 0; truncated = false; return text; },
    fail: (error) => { const info = describe(error); failures.push(info.line ? info.error + ${JSON.stringify(t(' (satır ', ' (line '))} + info.line + ')' : info.error); },
    failures: () => { const text = failures.join('\n'); failures.length = 0; return text; },
  };

  Object.defineProperty(globalThis, '__z', { value: Object.freeze(api), writable: false, configurable: false, enumerable: false });
})();
`;

// Zamanlayıcılar ana bağlamda yaşar ve kayıtları da ana bağlamda tutulur; kullanıcı bağlamına yalnızca
// sayısal kimlikler geçer. Ana bağlamın hiçbir nesnesi (ör. Node'un Timeout nesnesi) bağlam içindeki bir
// yapıya konmamalı: kullanıcı Map.prototype.set gibi metotları değiştirip o nesneyi yakalayabilir ve
// yapıcısından ana bağlamın Function'ına, oradan process'e ulaşır.
function createTimerHost() {
  const handles = new Map();
  let sequence = 0;

  // Bu iki fonksiyon bağlama yalnızca köprünün kapanışı (closure) üzerinden verilir. Hiçbir zaman hata
  // fırlatmazlar: ana bağlamın bir Error nesnesi de bağlam içine kaçış yolu olurdu.
  const schedule = (callback, delay, repeat) => {
    if (typeof callback !== 'function') return 0;
    const id = ++sequence;
    const run = () => {
      if (!repeat) handles.delete(id);
      try { callback(); } catch { /* bağlamın kendi hata işleyicisi zaten çağrıldı */ }
    };
    const milliseconds = Number.isFinite(delay) ? Math.min(Math.max(delay, 0), 2 ** 31 - 1) : 0;
    handles.set(id, { handle: (repeat ? setInterval : setTimeout)(run, milliseconds), repeat });
    return id;
  };

  const cancel = (id) => {
    const entry = typeof id === 'number' ? handles.get(id) : undefined;
    if (entry === undefined) return;
    (entry.repeat ? clearInterval : clearTimeout)(entry.handle);
    handles.delete(id);
  };

  return { schedule, cancel };
}

const TIMER_BRIDGE = String.raw`
((hostSchedule, hostCancel) => {
  'use strict';
  const guard = (callback, args) => { try { callback(...args); } catch (error) { __z.fail(error); } };
  const requireFunction = (callback, name) => {
    if (typeof callback !== 'function') throw new TypeError(name + ${JSON.stringify(t(': ilk argüman bir fonksiyon olmalı.', ': the first argument must be a function.'))});
  };
  globalThis.setTimeout = (callback, delay, ...args) => {
    requireFunction(callback, 'setTimeout');
    return hostSchedule(() => guard(callback, args), Number(delay) || 0, false);
  };
  globalThis.setInterval = (callback, delay, ...args) => {
    requireFunction(callback, 'setInterval');
    return hostSchedule(() => guard(callback, args), Number(delay) || 0, true);
  };
  globalThis.clearTimeout = globalThis.clearInterval = (id) => hostCancel(id);
  globalThis.queueMicrotask = (callback) => {
    requireFunction(callback, 'queueMicrotask');
    Promise.resolve().then(() => guard(callback, []));
  };
})
`;

// ---------------------------------------------------------------- derleme yardımcıları

// amaro: Node'un kendi tip silme motoru. Paket olarak sabit sürümle kullanmak, Node sürümleri
// arasında davranışı sabitler ve enum / parametre özelliği / namespace dönüşümünü de sağlar.
async function loadAmaro() {
  try {
    const module = await import('amaro');
    return module.default ?? module;
  } catch {
    return null;
  }
}

function describeAmaroError(error) {
  return {
    message: 'TypeScript: ' + String(error && error.message ? error.message : error),
    line: Number.isInteger(error?.startLine) ? error.startLine : 0,
    column: Number.isInteger(error?.startColumn) ? error.startColumn + 1 : 0,
  };
}

function describeBuiltinStripError(error) {
  const lines = String(error?.stack ?? '').split('\n');
  const location = /:(\d+)\s*$/.exec(lines[0] ?? '');
  const caret = lines.find((line) => /^\s*\^+\s*$/.test(line));
  const unsupported = error?.code === 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX';
  return {
    message: 'TypeScript: ' + String(error?.message ?? error)
      + (unsupported
        ? t(' (enum, namespace ve parametre özellikleri için Runner\'ın Node klasöründe "npm ci" çalıştırılmalı.)',
          ' (enums, namespaces and parameter properties require running "npm ci" in the Runner\'s Node folder.)')
        : ''),
    line: location ? Number(location[1]) : 0,
    column: caret ? caret.indexOf('^') + 1 : 0,
  };
}

async function toJavaScript(code) {
  if (language !== 'typescript') return { code };

  const amaro = await loadAmaro();

  if (amaro === null) {
    // Yedek yol: Node'un yerleşik tip silicisi (yalnızca silinebilir sözdizimi).
    try {
      return { code: stripTypeScriptTypes(code, { mode: 'strip' }) };
    } catch (error) {
      return { error: describeBuiltinStripError(error) };
    }
  }

  try {
    // 'strip-only' tipleri boşlukla değiştirir; satır/sütun numaraları korunur.
    return { code: amaro.transformSync(code, { mode: 'strip-only' }).code };
  } catch (error) {
    if (error?.code !== 'UnsupportedSyntax') return { error: describeAmaroError(error) };
  }

  try {
    // enum, namespace, parametre özelliği: çalışma zamanı kodu üretilmesi gerekir.
    return { code: amaro.transformSync(code, { mode: 'transform' }).code };
  } catch (error) {
    return { error: describeAmaroError(error) };
  }
}

function describeSyntaxError(error) {
  const lines = String(error.stack || '').split('\n');
  const location = /solution\.js:(\d+)/.exec(lines[0] ?? '');
  const caret = lines.find((line) => /^\s*\^+\s*$/.test(line));
  return {
    message: (error.name || 'SyntaxError') + ': ' + error.message,
    line: location ? Number(location[1]) : 0,
    column: caret ? caret.indexOf('^') + 1 : 0,
  };
}

function createContext() {
  const context = vm.createContext(vm.constants.DONT_CONTEXTIFY, {
    codeGeneration: { strings: false, wasm: false },
  });

  if (spec) context.__zSpec = JSON.stringify(spec);
  vm.runInContext(PRELUDE, context, { filename: 'zirve-prelude.js' });
  return context;
}

const isTimeout = (error) => error && error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT';

// ---------------------------------------------------------------- test modu

function buildInvoker(context) {
  const name = spec.name;
  if (!IDENTIFIER.test(name)) throw new Error(t('Geçersiz fonksiyon/sınıf adı.', 'Invalid function/class name.'));

  const messages = {
    noFunction: t(`"${name}" adında bir fonksiyon bulunamadı. Fonksiyon adını değiştirmeyin.`, `No function named "${name}" was found. Do not rename the function.`),
    noAsync: t('Bu problemde Promise döndüren (async) fonksiyonlar desteklenmiyor.', 'Functions that return a Promise (async) are not supported in this problem.'),
    noClass: t(`"${name}" adında bir sınıf bulunamadı. Sınıf adını değiştirmeyin.`, `No class named "${name}" was found. Do not rename the class.`),
    noMethodPrefix: t('"', 'No method "'),
    noMethodSuffix: t('" metodu bulunamadı. Metot adlarını değiştirmeyin.', '" was found. Do not rename the methods.'),
  };

  const functionBody = `
    const fn = typeof ${name} === 'function' ? ${name} : null;
    if (fn === null) throw new z.HarnessError('${messages.noFunction}');
    const args = input.args.map((value, index) => z.decode(value, spec.params[index] ? spec.params[index].type : ''));
    const output = fn(...args);
    if (output !== null && typeof output === 'object' && typeof output.then === 'function') {
      throw new z.HarnessError('${messages.noAsync}');
    }
    return z.stringify({ actual: z.encode(output, spec.returns) });`;

  const classBody = `
    const Target = typeof ${name} === 'function' ? ${name} : null;
    if (Target === null) throw new z.HarnessError('${messages.noClass}');
    const decodeAll = (values, params) => values.map((value, index) => z.decode(value, params[index] ? params[index].type : ''));
    const instance = new Target(...decodeAll(input.args[0], spec.params));
    const results = [null];
    for (let i = 1; i < input.ops.length; i++) {
      const operation = input.ops[i];
      const method = spec.methods.find((candidate) => candidate.name === operation);
      if (typeof instance[operation] !== 'function') throw new z.HarnessError('${messages.noMethodPrefix}' + operation + '${messages.noMethodSuffix}');
      const output = instance[operation](...decodeAll(input.args[i], method ? method.params : []));
      results.push(method && method.returns !== 'void' ? z.encode(output, method.returns) : null);
    }
    return z.stringify({ actual: results });`;

  const source = `(() => {
    const z = __z;
    const spec = z.spec;
    try {
      const input = JSON.parse(__zInput);
      ${spec.kind === 'class' ? classBody : functionBody}
    } catch (error) {
      return z.stringify(z.describe(error));
    }
  })()`;

  const script = new vm.Script(source, { filename: 'zirve-invoke.js' });
  const drain = new vm.Script('__z.drain()', { filename: 'zirve-drain.js' });

  return (test) => {
    context.__zInput = JSON.stringify({ args: test.args, ops: test.ops ?? null });
    const started = performance.now();
    let result;

    try {
      result = JSON.parse(script.runInContext(context, { timeout: perTestTimeoutMs }));
    } catch (error) {
      result = isTimeout(error)
        ? { timedOut: true, error: t(`Süre sınırı aşıldı (${perTestTimeoutMs} ms).`, `Time limit exceeded (${perTestTimeoutMs} ms).`) }
        : { error: t('Beklenmeyen koşucu hatası: ', 'Unexpected runner error: ') + String(error && error.message ? error.message : error) };
    }

    const ms = Math.round((performance.now() - started) * 1000) / 1000;
    const stdout = drain.runInContext(context);
    const line = { id: test.id, ms };

    if (result.timedOut) line.timedOut = true;
    if (result.error !== undefined) {
      line.error = result.error;
      if (result.line) line.line = result.line;
    } else {
      line.actual = result.actual === undefined ? null : result.actual;
    }
    if (stdout) line.stdout = stdout;

    emit(line);
  };
}

function runTests(code) {
  let userScript;
  try {
    userScript = new vm.Script(code, { filename: USER_FILE });
  } catch (error) {
    emit({ compileError: describeSyntaxError(error) });
    return;
  }

  const context = createContext();

  try {
    userScript.runInContext(context, { timeout: perTestTimeoutMs });
  } catch (error) {
    // Kod daha yüklenirken hata verdi: bütün testler aynı hatayla başarısız sayılır.
    const info = isTimeout(error)
      ? { error: t('Kod yüklenirken süre sınırı aşıldı.', 'Time limit exceeded while loading the code.'), line: 0 }
      : JSON.parse(vm.runInContext('(e) => __z.stringify(__z.describe(e))', context)(error));

    for (const test of tests) {
      emit({ id: test.id, error: info.error, line: info.line || undefined, ms: 0 });
    }

    finish();
    return;
  }

  const invoke = buildInvoker(context);
  for (const test of tests) invoke(test);
  finish();
}

/** Son satırı yazar ve süreci kapatır: bekleyen zamanlayıcı ya da sonsuz mikro görev süreci süre sınırına kadar
 * açık tutmasın (aksi halde her testi sonuçlanmış bir çalıştırma "zaman aşımı" görünür). */
function finish() {
  process.stdout.write(nonce + JSON.stringify({ done: true }) + '\n', () => process.exit(0));
}

// ---------------------------------------------------------------- script modu (deneme alanı)

function runScript(code) {
  const context = createContext();
  const timers = createTimerHost();
  vm.runInContext(TIMER_BRIDGE, context, { filename: 'zirve-timers.js' })(timers.schedule, timers.cancel);

  const drain = new vm.Script('__z.drain()', { filename: 'zirve-drain.js' });
  const failures = new vm.Script('__z.failures()', { filename: 'zirve-failures.js' });

  const flush = () => {
    const output = drain.runInContext(context);
    if (output) process.stdout.write(output + '\n');

    const errors = failures.runInContext(context);
    if (errors) {
      process.stderr.write(errors + '\n');
      process.exitCode = 1;
    }
  };

  const reportHostError = (error) => {
    flush();
    process.stderr.write(String(error && error.message ? (error.name || 'Error') + ': ' + error.message : error) + '\n');
    process.exitCode = 1;
  };

  process.on('uncaughtException', reportHostError);
  process.on('unhandledRejection', reportHostError);
  process.on('beforeExit', flush);
  setInterval(flush, 25).unref();

  // Üst düzey await çalışsın diye kod bir async fonksiyona sarılır. Sarmalayıcı ilk satırla aynı
  // satırda başladığı için satır numaraları değişmez.
  let script;
  try {
    script = new vm.Script(`(async () => { ${code}\n})().catch(__z.fail)`, { filename: USER_FILE });
  } catch (error) {
    const info = describeSyntaxError(error);
    process.stderr.write(info.message + (info.line ? t(` (satır ${info.line})`, ` (line ${info.line})`) : '') + '\n');
    process.exitCode = 1;
    return;
  }

  try {
    script.runInContext(context, { timeout: scriptTimeoutMs });
  } catch (error) {
    flush();
    process.stderr.write((isTimeout(error)
    ? t(`Süre sınırı aşıldı (${scriptTimeoutMs} ms).`, `Time limit exceeded (${scriptTimeoutMs} ms).`)
    : String(error)) + '\n');
    // Bekleyen zamanlayıcılar süreci açık tutmasın.
    process.exit(1);
  }

  flush();
}

// ---------------------------------------------------------------- giriş noktası

const converted = await toJavaScript(payload.code);

if (converted.error) {
  if (mode === 'script') {
    process.stderr.write(converted.error.message
    + (converted.error.line ? t(` (satır ${converted.error.line})`, ` (line ${converted.error.line})`) : '') + '\n');
    process.exitCode = 1;
  } else {
    emit({ compileError: converted.error });
  }
} else if (mode === 'script') {
  runScript(converted.code);
} else {
  runTests(converted.code);
}
