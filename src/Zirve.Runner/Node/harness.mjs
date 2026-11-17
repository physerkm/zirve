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
  const LIMIT = 65536;
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
    if (size + line.length > LIMIT) {
      logs.push(line.slice(0, Math.max(0, LIMIT - size)) + '\n… (çıktı kesildi)');
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
      if (values.length > MAX_NODES) throw new HarnessError('Döndürülen bağlı listede döngü var ya da liste çok uzun.');
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
      if (++visited > MAX_NODES) throw new HarnessError('Döndürülen ağaçta döngü var ya da ağaç çok büyük.');
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
    return { error: 'Fırlatılan değer: ' + inspect(error, 1, new Set()), line: 0 };
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
    drain: () => { const text = logs.join('\n'); logs.length = 0; size = 0; truncated = false; return text; },
    fail: (error) => { const info = describe(error); failures.push(info.line ? info.error + ' (satır ' + info.line + ')' : info.error); },
    failures: () => { const text = failures.join('\n'); failures.length = 0; return text; },
  };

  Object.defineProperty(globalThis, '__z', { value: Object.freeze(api), writable: false, configurable: false, enumerable: false });
})();
`;

// Zamanlayıcılar ana bağlamda yaşar; kullanıcı koduna yalnızca sayısal kimlikler sızar.
const TIMER_BRIDGE = String.raw`
((hostSetTimeout, hostClearTimeout, hostSetInterval) => {
  'use strict';
  const timers = new Map();
  let sequence = 0;
  const guard = (callback, args) => { try { callback(...args); } catch (error) { __z.fail(error); } };
  const requireFunction = (callback, name) => {
    if (typeof callback !== 'function') throw new TypeError(name + ': ilk argüman bir fonksiyon olmalı.');
  };
  globalThis.setTimeout = (callback, delay, ...args) => {
    requireFunction(callback, 'setTimeout');
    const id = ++sequence;
    timers.set(id, hostSetTimeout(() => { timers.delete(id); guard(callback, args); }, Number(delay) || 0));
    return id;
  };
  globalThis.setInterval = (callback, delay, ...args) => {
    requireFunction(callback, 'setInterval');
    const id = ++sequence;
    timers.set(id, hostSetInterval(() => guard(callback, args), Number(delay) || 0));
    return id;
  };
  globalThis.clearTimeout = globalThis.clearInterval = (id) => {
    if (timers.has(id)) { hostClearTimeout(timers.get(id)); timers.delete(id); }
  };
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
      + (unsupported ? ' (enum, namespace ve parametre özellikleri için Runner\'ın Node klasöründe "npm ci" çalıştırılmalı.)' : ''),
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
  if (!IDENTIFIER.test(name)) throw new Error('Geçersiz fonksiyon/sınıf adı.');

  const functionBody = `
    const fn = typeof ${name} === 'function' ? ${name} : null;
    if (fn === null) throw new z.HarnessError('"${name}" adında bir fonksiyon bulunamadı. Fonksiyon adını değiştirmeyin.');
    const args = input.args.map((value, index) => z.decode(value, spec.params[index] ? spec.params[index].type : ''));
    const output = fn(...args);
    if (output !== null && typeof output === 'object' && typeof output.then === 'function') {
      throw new z.HarnessError('Bu problemde Promise döndüren (async) fonksiyonlar desteklenmiyor.');
    }
    return z.stringify({ actual: z.encode(output, spec.returns) });`;

  const classBody = `
    const Target = typeof ${name} === 'function' ? ${name} : null;
    if (Target === null) throw new z.HarnessError('"${name}" adında bir sınıf bulunamadı. Sınıf adını değiştirmeyin.');
    const decodeAll = (values, params) => values.map((value, index) => z.decode(value, params[index] ? params[index].type : ''));
    const instance = new Target(...decodeAll(input.args[0], spec.params));
    const results = [null];
    for (let i = 1; i < input.ops.length; i++) {
      const operation = input.ops[i];
      const method = spec.methods.find((candidate) => candidate.name === operation);
      if (typeof instance[operation] !== 'function') throw new z.HarnessError('"' + operation + '" metodu bulunamadı. Metot adlarını değiştirmeyin.');
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
        ? { timedOut: true, error: `Süre sınırı aşıldı (${perTestTimeoutMs} ms).` }
        : { error: 'Beklenmeyen koşucu hatası: ' + String(error && error.message ? error.message : error) };
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
      ? { error: 'Kod yüklenirken süre sınırı aşıldı.', line: 0 }
      : JSON.parse(vm.runInContext('(e) => __z.stringify(__z.describe(e))', context)(error));

    for (const test of tests) {
      emit({ id: test.id, error: info.error, line: info.line || undefined, ms: 0 });
    }

    emit({ done: true });
    return;
  }

  const invoke = buildInvoker(context);
  for (const test of tests) invoke(test);
  emit({ done: true });
}

// ---------------------------------------------------------------- script modu (deneme alanı)

function runScript(code) {
  const context = createContext();
  vm.runInContext(TIMER_BRIDGE, context, { filename: 'zirve-timers.js' })(setTimeout, clearTimeout, setInterval);

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
    process.stderr.write(info.message + (info.line ? ` (satır ${info.line})` : '') + '\n');
    process.exitCode = 1;
    return;
  }

  try {
    script.runInContext(context, { timeout: scriptTimeoutMs });
  } catch (error) {
    flush();
    process.stderr.write((isTimeout(error) ? `Süre sınırı aşıldı (${scriptTimeoutMs} ms).` : String(error)) + '\n');
    // Bekleyen zamanlayıcılar süreci açık tutmasın.
    process.exit(1);
  }

  flush();
}

// ---------------------------------------------------------------- giriş noktası

const converted = await toJavaScript(payload.code);

if (converted.error) {
  if (mode === 'script') {
    process.stderr.write(converted.error.message + (converted.error.line ? ` (satır ${converted.error.line})` : '') + '\n');
    process.exitCode = 1;
  } else {
    emit({ compileError: converted.error });
  }
} else if (mode === 'script') {
  runScript(converted.code);
} else {
  runTests(converted.code);
}
