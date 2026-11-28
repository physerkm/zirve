// Gerçek Runner kapsayıcısına (docker-compose.yml ayarlarıyla) karşı uçtan uca yalıtım denemeleri.
// CI'da Runner ile aynı iç ağdaki bir Node kapsayıcısında çalışır:
//   RUNNER_URL=http://runner:8080 RUNNER_KEY=... node tests/isolation/runner-e2e.mjs
//
// Sınananlar: yalıtım altında C# ve TypeScript çözümleri normal çalışır; V8 yığınının dışındaki bellek
// (ArrayBuffer) ve büyük .NET dizileri yalnızca o çalıştırmayı durdurur, kapsayıcıyı düşürmez; eşzamanlı
// çalıştırmalar yuvaları doğru paylaşır; JavaScript sandbox'ı ana bağlamın nesnelerini sızdırmaz.

const url = process.env.RUNNER_URL ?? 'http://localhost:5081';
const key = process.env.RUNNER_KEY ?? '';
let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? 'GEÇTİ ' : 'KALDI '} ${label}${!ok && detail ? `\n       ${detail}` : ''}`);
  if (!ok) failures++;
}

async function waitHealthy() {
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return true;
    } catch {
      // henüz ayağa kalkmadı
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function execute(body) {
  const response = await fetch(`${url}/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Runner-Key': key },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
  return JSON.parse(text);
}

const twoSum = {
  kind: 'function',
  name: 'twoSum',
  params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
  returns: 'int[]',
  compare: 'unordered',
};

const twoSumTests = [
  { id: 0, args: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { id: 1, args: [[3, 2, 4], 6], expected: [1, 2] },
];

const csharpSolution = `
public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        var seen = new Dictionary<int, int>();
        for (var i = 0; i < nums.Length; i++) {
            if (seen.TryGetValue(target - nums[i], out var j)) return new[] { j, i };
            seen[nums[i]] = i;
        }
        return Array.Empty<int>();
    }
}`;

const typescriptSolution = `
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return [];
}`;

const passes = (result) => result.status === 'completed' && result.tests?.length === 2 && result.tests.every((t) => t.status === 'passed');
const describe = (result) => JSON.stringify({ status: result.status, message: result.message, stderr: result.stderr?.slice(0, 300) });

if (!(await waitHealthy())) {
  console.log('KALDI  Runner ayağa kalkmadı.');
  process.exit(1);
}

// 1) Yalıtım altında normal çözümler çalışır (dotnet ve node, setpriv + RLIMIT_DATA ile başlayabiliyor).
const csharp = await execute({ language: 'csharp', mode: 'tests', code: csharpSolution, spec: twoSum, tests: twoSumTests });
check('C# çözümü yalıtım altında testleri geçer', passes(csharp), describe(csharp));

const typescript = await execute({ language: 'typescript', mode: 'tests', code: typescriptSolution, spec: twoSum, tests: twoSumTests });
check('TypeScript çözümü yalıtım altında testleri geçer', passes(typescript), describe(typescript));

// 2) V8 yığınının dışındaki bellek: ~1,6 GB'lık ArrayBuffer kapsayıcının 1,5 GB sınırını aşardı.
const arrayBuffer = await execute({
  language: 'javascript',
  mode: 'script',
  code: "const a = new Float64Array(2e8); a.fill(1); console.log('allocated', a.length);",
});
check(
  'Büyük ArrayBuffer çalıştırmanın kendi bellek sınırına takılır',
  !(arrayBuffer.stdout ?? '').includes('allocated') && /alloc|memory|bellek/i.test(`${arrayBuffer.message} ${arrayBuffer.stderr}`),
  describe(arrayBuffer),
);

const dotnetMemory = await execute({
  language: 'csharp',
  mode: 'script',
  code: 'var a = new long[400_000_000]; a[^1] = 1; Console.WriteLine("allocated " + a.Length);',
});
check('Büyük .NET dizisi çalıştırmanın bellek sınırına takılır', !(dotnetMemory.stdout ?? '').includes('allocated'), describe(dotnetMemory));

// 3) Bellek denemelerinden sonra Runner hâlâ ayakta ve çalışıyor (kapsayıcı OOM ile ölmedi).
const after = await execute({ language: 'javascript', mode: 'script', code: "console.log('still alive')" });
check('Bellek denemelerinden sonra Runner çalışmaya devam eder', (after.stdout ?? '').includes('still alive'), describe(after));

// 4) Eşzamanlı çalıştırmalar yuvaları doğru paylaşır.
const parallel = await Promise.all(
  Array.from({ length: 6 }, (_, i) =>
    execute(i % 2 === 0
      ? { language: 'csharp', mode: 'tests', code: csharpSolution, spec: twoSum, tests: twoSumTests }
      : { language: 'typescript', mode: 'tests', code: typescriptSolution, spec: twoSum, tests: twoSumTests }),
  ),
);
check('6 eşzamanlı çalıştırmanın hepsi doğru sonuçlanır', parallel.every(passes), parallel.filter((r) => !passes(r)).map(describe).join(' | '));

// 5) Zamanlayıcılar ana bağlamın nesnelerini sandbox'a sızdırmaz.
const escape = await execute({
  language: 'javascript',
  mode: 'script',
  code: `
    let leaked;
    const original = Map.prototype.set;
    Map.prototype.set = function (k, v) { leaked = v; return original.call(this, k, v); };
    setTimeout(() => {}, 0);
    Map.prototype.set = original;
    let escaped = false;
    try { escaped = typeof leaked?.constructor?.constructor('return process')() === 'object'; } catch (e) { }
    console.log(escaped ? 'ESCAPED' : 'contained');`,
});
check('JavaScript sandbox kaçış denemesi engellenir', (escape.stdout ?? '').includes('contained'), describe(escape));

console.log(failures === 0 ? '\nBütün yalıtım denemeleri geçti.' : `\n${failures} deneme başarısız.`);
process.exit(failures === 0 ? 0 : 1);
