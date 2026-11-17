---
title: Ağ Gecikme Süresi
difficulty: medium
tags: [graf, heap, bfs]
function: networkDelayTime
params:
  - { name: times, type: "int[][]" }
  - { name: n, type: "int" }
  - { name: k, type: "int" }
returns: "int"
---
`1`'den `n`'ye numaralanmış `n` düğümlü bir ağ veriliyor. `times[i] = [u, v, w]`, `u`'dan `v`'ye giden **yönlü** bir kenardır ve sinyalin bu kenarı geçmesi `w` zaman alır.

`k` düğümünden bir sinyal gönderiliyor. **Bütün düğümlerin** sinyali alması için geçen en kısa süreyi döndürün. Bazı düğümler sinyali hiç alamıyorsa `-1` döndürün.

### Örnek 1

```text
Girdi:  times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
Çıktı:  2
```

### Örnek 2

```text
Girdi:  times = [[1,2,1]], n = 2, k = 1
Çıktı:  1
```

### Örnek 3

```text
Girdi:  times = [[1,2,1]], n = 2, k = 2
Çıktı:  -1
```

### Kısıtlar

- `1 <= k <= n <= 100`
- `1 <= times.length <= 6000`
- `1 <= u, v <= n`, `u != v`, `0 <= w <= 100`
- Aynı `(u, v)` çifti birden fazla kez geçmez.

## İpuçları

- Her düğüme sinyalin ulaşma süresi, `k`'dan o düğüme olan **en kısa yolun** uzunluğudur. Cevap bu uzunlukların en büyüğüdür.
- Kenar ağırlıkları negatif değil: Dijkstra algoritması kullanılabilir.
- Bir min-heap'te `(uzaklık, düğüm)` tutun; her seferinde en yakın işlenmemiş düğümü çıkarıp komşularını gevşetin.

## Çözüm

### Dijkstra

1. Komşuluk listesi kurulur: `u → (v, w)`.
2. `dist[k] = 0` ile min-heap'e `(0, k)` konur.
3. Heap'ten en küçük uzaklıklı düğüm çıkarılır. Daha önce kesinleşmişse (eski bir kayıtsa) atlanır. Değilse uzaklığı kesinleşir ve her komşu için `dist[u] + w` daha iyiyse heap'e eklenir.
4. Bütün düğümler kesinleştiyse cevap en büyük uzaklıktır; kesinleşmeyen varsa `-1`.

Negatif olmayan ağırlıklarda heap'ten ilk çıkan uzaklık o düğüm için en kısasıdır; çünkü sonradan bulunacak her yol, heap'teki daha büyük bir uzaklıktan geçmek zorundadır.

```csharp solution
public class Solution
{
    public int NetworkDelayTime(int[][] times, int n, int k)
    {
        var graph = new List<(int To, int W)>[n + 1];
        for (var i = 1; i <= n; i++)
        {
            graph[i] = new List<(int To, int W)>();
        }

        foreach (var t in times)
        {
            graph[t[0]].Add((t[1], t[2]));
        }

        var dist = new Dictionary<int, int>();
        var heap = new PriorityQueue<int, int>();
        heap.Enqueue(k, 0);
        var tentative = new int[n + 1];
        Array.Fill(tentative, int.MaxValue);
        tentative[k] = 0;

        while (heap.TryDequeue(out var node, out var d))
        {
            if (dist.ContainsKey(node))
            {
                continue;
            }

            dist[node] = d;
            foreach (var (to, w) in graph[node])
            {
                if (!dist.ContainsKey(to) && d + w < tentative[to])
                {
                    tentative[to] = d + w;
                    heap.Enqueue(to, d + w);
                }
            }
        }

        return dist.Count == n ? dist.Values.Max() : -1;
    }
}
```

```typescript solution
function networkDelayTime(times: number[][], n: number, k: number): number {
  const graph: [number, number][][] = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) graph[u].push([v, w]);

  const dist = new Array<number>(n + 1).fill(Infinity);
  const done = new Array<boolean>(n + 1).fill(false);
  dist[k] = 0;

  // n en fazla 100: en yakın düğümü doğrusal taramayla seçmek (O(n²) Dijkstra) yeterli.
  for (let round = 0; round < n; round++) {
    let node = -1;
    for (let i = 1; i <= n; i++) {
      if (!done[i] && dist[i] !== Infinity && (node === -1 || dist[i] < dist[node])) node = i;
    }

    if (node === -1) break;
    done[node] = true;

    for (const [to, w] of graph[node]) {
      if (dist[node] + w < dist[to]) dist[to] = dist[node] + w;
    }
  }

  let worst = 0;
  for (let i = 1; i <= n; i++) {
    if (dist[i] === Infinity) return -1;
    worst = Math.max(worst, dist[i]);
  }

  return worst;
}
```

### Karmaşıklık

- **Zaman:** Heap'li Dijkstra O(E log E). TypeScript çözümündeki dizi tabanlı sürüm O(n² + E); `n` küçük olduğunda bu da yeterlidir.
- **Alan:** O(n + E).

## Testler

```json
[
  { "args": [[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], "expected": 2, "sample": true },
  { "args": [[[1, 2, 1]], 2, 1], "expected": 1, "sample": true },
  { "args": [[[1, 2, 1]], 2, 2], "expected": -1, "sample": true },
  { "args": [[[1, 2, 1], [2, 3, 2], [1, 3, 4]], 3, 1], "expected": 3 },
  { "args": [[[1, 2, 1], [2, 1, 3]], 2, 2], "expected": 3 },
  { "args": [[[1, 2, 5]], 3, 1], "expected": -1 },
  { "args": [[[1, 2, 0], [2, 3, 0]], 3, 1], "expected": 0 }
]
```
