---
title: Uzaylı Sözlüğü
difficulty: hard
tags: [graf, topolojik-siralama, bfs, dizgi]
function: alienOrder
params:
  - { name: words, type: "string[]" }
returns: "string"
---
İngiliz alfabesindeki harfleri kullanan ama harflerin **sırası bilinmeyen** bir uzaylı dili var. Bu dilin sözlüğünden alınmış, **sözlük sırasına göre sıralanmış** bir kelime listesi `words` veriliyor.

Kelimelerde geçen harflerin bu dildeki sırasını bir dizgi olarak döndürün. Sıra kelimelerle **çelişiyorsa** `""` döndürün.

Testlerin tek bir cevabı olsun diye: Birden fazla geçerli sıra varsa, her adımda kullanılabilir harflerin **alfabetik olarak en küçüğünü** seçerek elde edilen sırayı döndürün.

### Örnek 1

```text
Girdi:  words = ["wrt","wrf","er","ett","rftt"]
Çıktı:  "wertf"
```

### Örnek 2

```text
Girdi:  words = ["z","x"]
Çıktı:  "zx"
```

### Örnek 3

```text
Girdi:  words = ["z","x","z"]
Çıktı:  ""
Açıklama: z < x ve x < z aynı anda olamaz.
```

### Kısıtlar

- `1 <= words.length <= 100`
- `1 <= words[i].length <= 100`
- `words[i]` küçük İngilizce harflerden oluşur.

## İpuçları

- Ardışık iki kelimeyi karşılaştırın. İlk farklı harf çifti size tek bir sıra bilgisi verir: `a` harfi `b`'den önce gelir.
- Bu bilgiler harfler arasında yönlü bir graf oluşturur. İstenen, bu grafın **topolojik sıralamasıdır**.
- Döngü varsa sıralama yoktur. Ayrıca `["abc", "ab"]` gibi uzun kelimenin kendi ön ekinden önce geldiği durum da geçersizdir.

## Çözüm

### Kenarları çıkar, Kahn algoritmasıyla sırala

1. Kelimelerde geçen bütün harfler düğüm olur; giriş derecesi `0` ile başlar.
2. Ardışık her `(w1, w2)` çifti için ilk farklı konum `j` bulunur ve `w1[j] → w2[j]` kenarı eklenir (aynı kenar ikinci kez sayılmaz). Fark yoksa ve `w1` daha uzunsa sıra geçersizdir: `""`.
3. Giriş derecesi `0` olan harfler bir min-heap'e konur. Heap'ten en küçük harf alınır, sonuca eklenir ve komşularının dereceleri azaltılır; `0`'a inenler heap'e girer.
4. Sonuç bütün harfleri içermiyorsa grafta döngü vardır: `""`.

```csharp solution
public class Solution
{
    public string AlienOrder(string[] words)
    {
        var graph = new Dictionary<char, HashSet<char>>();
        var indegree = new Dictionary<char, int>();
        foreach (var word in words)
        {
            foreach (var ch in word)
            {
                graph.TryAdd(ch, new HashSet<char>());
                indegree.TryAdd(ch, 0);
            }
        }

        for (var i = 0; i + 1 < words.Length; i++)
        {
            var a = words[i];
            var b = words[i + 1];
            var j = 0;
            while (j < a.Length && j < b.Length && a[j] == b[j])
            {
                j++;
            }

            if (j == a.Length || j == b.Length)
            {
                if (a.Length > b.Length)
                {
                    return "";
                }

                continue;
            }

            if (graph[a[j]].Add(b[j]))
            {
                indegree[b[j]]++;
            }
        }

        var heap = new PriorityQueue<char, char>();
        foreach (var (ch, degree) in indegree)
        {
            if (degree == 0)
            {
                heap.Enqueue(ch, ch);
            }
        }

        var order = new StringBuilder();
        while (heap.TryDequeue(out var ch, out _))
        {
            order.Append(ch);
            foreach (var next in graph[ch])
            {
                if (--indegree[next] == 0)
                {
                    heap.Enqueue(next, next);
                }
            }
        }

        return order.Length == indegree.Count ? order.ToString() : "";
    }
}
```

```typescript solution
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  for (const word of words) {
    for (const ch of word) {
      if (!graph.has(ch)) graph.set(ch, new Set());
      if (!indegree.has(ch)) indegree.set(ch, 0);
    }
  }

  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    let j = 0;
    while (j < a.length && j < b.length && a[j] === b[j]) j++;

    if (j === a.length || j === b.length) {
      if (a.length > b.length) return '';
      continue;
    }

    const edges = graph.get(a[j])!;
    if (!edges.has(b[j])) {
      edges.add(b[j]);
      indegree.set(b[j], indegree.get(b[j])! + 1);
    }
  }

  // Kullanılabilir harfler sıralı tutulur; her seferinde alfabetik en küçüğü alınır.
  const ready = [...indegree.keys()].filter((ch) => indegree.get(ch) === 0).sort();
  let order = '';
  while (ready.length > 0) {
    const ch = ready.shift()!;
    order += ch;
    for (const next of graph.get(ch)!) {
      const degree = indegree.get(next)! - 1;
      indegree.set(next, degree);
      if (degree === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }

  return order.length === indegree.size ? order : '';
}
```

### Karmaşıklık

- **Zaman:** O(C + K log K). `C` bütün kelimelerdeki toplam harf sayısı, `K` farklı harf sayısıdır (en fazla 26).
- **Alan:** O(K + E); `E` en fazla `K²` kenardır.

Asıl sınav, ardışık kelimelerden **yalnızca ilk farkın** bilgi taşıdığını ve ön ek tuzağını fark etmektir. Gerisi standart topolojik sıralamadır.

## Testler

```json
[
  { "args": [["wrt", "wrf", "er", "ett", "rftt"]], "expected": "wertf", "sample": true },
  { "args": [["z", "x"]], "expected": "zx", "sample": true },
  { "args": [["z", "x", "z"]], "expected": "", "sample": true },
  { "args": [["abc", "ab"]], "expected": "" },
  { "args": [["z", "z"]], "expected": "z" },
  { "args": [["ab", "adc"]], "expected": "abcd" },
  { "args": [["ba", "bc", "ac", "cab"]], "expected": "bac" }
]
```
