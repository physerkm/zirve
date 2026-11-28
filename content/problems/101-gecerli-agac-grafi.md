---
title: Graf Geçerli Bir Ağaç mı?
difficulty: medium
tags: [graf, birlik-bul, dfs, bfs]
function: validTree
params:
  - { name: n, type: "int" }
  - { name: edges, type: "int[][]" }
returns: "bool"
---
`0`'dan `n - 1`'e numaralanmış `n` düğüm ve yönsüz kenarların listesi `edges` veriliyor. Bu kenarların **geçerli bir ağaç** oluşturup oluşturmadığını belirleyin.

Bir graf, **bağlantılıysa** ve **döngü içermiyorsa** ağaçtır.

### Örnek 1

```text
Girdi:  n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Çıktı:  true
```

### Örnek 2

```text
Girdi:  n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Çıktı:  false
Açıklama: 1 - 2 - 3 - 1 bir döngü oluşturur.
```

### Kısıtlar

- `1 <= n <= 2000`
- `0 <= edges.length <= 5000`
- `0 <= a, b < n`, `a != b`; tekrarlayan kenar yoktur.

## İpuçları

- `n` düğümlü bir ağacın tam olarak kaç kenarı vardır?
- Kenar sayısı `n - 1` ise, bağlantılı olmak ile döngüsüz olmak birbirine denktir. Yalnızca birini kontrol etmek yeter.
- Birlik-Bul ile kenarları ekleyin: iki ucu zaten aynı kümedeyse döngü vardır.

## Çözüm

### Kenar sayısı ve Birlik-Bul

1. Ağaçta tam olarak `n - 1` kenar olur. Kenar sayısı farklıysa cevap hemen `false`'tur.
2. Kenarlar Birlik-Bul ile eklenir. Bir kenarın iki ucu zaten aynı kümedeyse döngü vardır: `false`.

`n - 1` kenarlı ve döngüsüz bir graf mutlaka bağlantılıdır (her kenar iki bileşeni birleştirir; `n` bileşen `n - 1` birleştirmeyle tek bileşene iner). Bu yüzden ayrıca bağlantı kontrolüne gerek kalmaz.

```csharp solution
public class Solution
{
    public bool ValidTree(int n, int[][] edges)
    {
        if (edges.Length != n - 1)
        {
            return false;
        }

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

        foreach (var edge in edges)
        {
            var a = Find(edge[0]);
            var b = Find(edge[1]);
            if (a == b)
            {
                return false;
            }

            parent[b] = a;
        }

        return true;
    }
}
```

```typescript solution
function validTree(n: number, edges: number[][]): boolean {
  if (edges.length !== n - 1) return false;

  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return false;
    parent[b] = a;
  }

  return true;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). Kenar sayısı kontrolünden sonra en fazla `n - 1` kenar işlenir. Çözüm yalnızca yol sıkıştırma (yol yarılama) kullanır; boyuta ya da ranka göre birleştirme de eklenirse O(n · α(n)) olur.
- **Alan:** O(n).

## Testler

```json
[
  { "args": [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], "expected": true, "sample": true },
  { "args": [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], "expected": false, "sample": true },
  { "args": [1, []], "expected": true },
  { "args": [2, []], "expected": false },
  { "args": [4, [[0, 1], [2, 3]]], "expected": false },
  { "args": [3, [[0, 1], [1, 2]]], "expected": true },
  { "args": [4, [[0, 1], [1, 2], [2, 0]]], "expected": false }
]
```
