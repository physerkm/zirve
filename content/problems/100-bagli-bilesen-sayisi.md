---
title: Yönsüz Graftaki Bağlı Bileşen Sayısı
difficulty: medium
tags: [graf, birlik-bul, dfs, bfs]
function: countComponents
params:
  - { name: n, type: "int" }
  - { name: edges, type: "int[][]" }
returns: "int"
---
`0`'dan `n - 1`'e numaralanmış `n` düğümlü yönsüz bir graf, `edges[i] = [a, b]` kenarlarıyla veriliyor. Graftaki **bağlı bileşenlerin** sayısını döndürün.

### Örnek 1

```text
Girdi:  n = 5, edges = [[0,1],[1,2],[3,4]]
Çıktı:  2
Açıklama: {0, 1, 2} ve {3, 4}.
```

### Örnek 2

```text
Girdi:  n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]
Çıktı:  1
```

### Kısıtlar

- `1 <= n <= 2000`
- `0 <= edges.length <= 5000`
- `0 <= a, b < n`, `a != b`; tekrarlayan kenar yoktur.

## İpuçları

- Her ziyaret edilmemiş düğümden bir DFS başlatırsanız, başlattığınız DFS sayısı bileşen sayısıdır.
- Birlik-Bul ile: `n` bileşenle başlayın; iki **farklı** kümeyi birleştiren her kenar bileşen sayısını bir azaltır.

## Çözüm

### Birlik-Bul ile sayma

Başlangıçta her düğüm ayrı bir bileşendir: `count = n`. Her kenar için iki ucun temsilcileri bulunur. Temsilciler farklıysa kümeler birleştirilir ve `count` bir azalır; aynıysa kenar zaten bağlı iki düğümü birleştirir ve sayı değişmez.

```csharp solution
public class Solution
{
    public int CountComponents(int n, int[][] edges)
    {
        var parent = new int[n];
        for (var i = 0; i < n; i++)
        {
            parent[i] = i;
        }

        int Find(int x)
        {
            while (parent[x] != x)
            {
                parent[x] = parent[parent[x]];
                x = parent[x];
            }

            return x;
        }

        var count = n;
        foreach (var edge in edges)
        {
            var a = Find(edge[0]);
            var b = Find(edge[1]);
            if (a != b)
            {
                parent[b] = a;
                count--;
            }
        }

        return count;
    }
}
```

```typescript solution
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  let count = n;
  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a !== b) {
      parent[b] = a;
      count--;
    }
  }

  return count;
}
```

### Karmaşıklık

- **Zaman:** O(n + e · α(n)).
- **Alan:** O(n).

DFS/BFS çözümü de O(n + e) sürer ama önce komşuluk listesi kurmayı gerektirir. Birlik-Bul, kenarlar akış halinde gelirken de çalışır.

## Testler

```json
[
  { "args": [5, [[0, 1], [1, 2], [3, 4]]], "expected": 2, "sample": true },
  { "args": [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], "expected": 1, "sample": true },
  { "args": [1, []], "expected": 1 },
  { "args": [4, []], "expected": 4 },
  { "args": [6, [[0, 1], [2, 3], [4, 5], [1, 2]]], "expected": 2 },
  { "args": [3, [[0, 1], [1, 2], [0, 2]]], "expected": 1 }
]
```
