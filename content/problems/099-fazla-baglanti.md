---
title: Fazla Bağlantı
difficulty: medium
tags: [graf, birlik-bul, dfs]
function: findRedundantConnection
params:
  - { name: edges, type: "int[][]" }
returns: "int[]"
---
`1`'den `n`'ye numaralanmış `n` düğümlü bir **ağaca** fazladan **bir kenar** eklenmiş. Eklenen kenar iki farklı düğümü birleştiriyor ve daha önce var olan bir kenar değil. Graf, `edges[i] = [a, b]` biçiminde `n` kenarlık bir listeyle veriliyor.

Graftan çıkarıldığında geriye `n` düğümlü bir ağaç kalan kenarı döndürün. Birden fazla cevap varsa girdide **en son** geleni döndürün.

### Örnek 1

```text
Girdi:  edges = [[1,2],[1,3],[2,3]]
Çıktı:  [2,3]
```

### Örnek 2

```text
Girdi:  edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Çıktı:  [1,4]
```

### Kısıtlar

- `n == edges.length`, `3 <= n <= 1000`
- `edges[i].length == 2`, `1 <= a < b <= n` ya da `1 <= b < a <= n`
- Tekrarlayan kenar yoktur ve graf bağlantılıdır.

## İpuçları

- Ağaçta döngü yoktur. Fazla kenar, bir döngü oluşturan kenardır.
- Kenarları sırayla ekleyin. Bir kenarın iki ucu **zaten** aynı bileşendeyse, bu kenar bir döngü kapatır.
- "İki düğüm aynı bileşende mi?" sorusunu neredeyse sabit zamanda yanıtlayan yapı: Birlik-Bul (Union-Find / DSU).

## Çözüm

### Birlik-Bul

Her düğüm başlangıçta kendi kümesinin temsilcisidir (`parent[x] = x`). Kenarları sırayla işleriz:

- `Find(a)` ve `Find(b)` aynı temsilciyi veriyorsa `a` ile `b` zaten bağlıdır; bu kenar döngü oluşturur ve cevaptır. Kenarlar sırayla işlendiği için ilk döngü kenarı aynı zamanda döngüdeki **en son** kenardır.
- Değilse iki küme birleştirilir.

`Find` sırasında **yol sıkıştırma** (path compression) ve birleştirmede **boyuta göre birleştirme** (union by size) ağaçları sığ tutar.

```csharp solution
public class Solution
{
    public int[] FindRedundantConnection(int[][] edges)
    {
        var n = edges.Length;
        var parent = new int[n + 1];
        var size = new int[n + 1];
        for (var i = 0; i <= n; i++)
        {
            parent[i] = i;
            size[i] = 1;
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
                return edge;
            }

            if (size[a] < size[b])
            {
                (a, b) = (b, a);
            }

            parent[b] = a;
            size[a] += size[b];
        }

        return Array.Empty<int>();
    }
}
```

```typescript solution
function findRedundantConnection(edges: number[][]): number[] {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const size = new Array<number>(n + 1).fill(1);

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  for (const edge of edges) {
    let a = find(edge[0]);
    let b = find(edge[1]);
    if (a === b) return edge;
    if (size[a] < size[b]) [a, b] = [b, a];
    parent[b] = a;
    size[a] += size[b];
  }

  return [];
}
```

### Karmaşıklık

- **Zaman:** O(n · α(n)). `α`, pratikte 4'ü geçmeyen ters Ackermann fonksiyonudur.
- **Alan:** O(n).

## Testler

```json
[
  { "args": [[[1, 2], [1, 3], [2, 3]]], "expected": [2, 3], "sample": true },
  { "args": [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], "expected": [1, 4], "sample": true },
  { "args": [[[1, 4], [3, 4], [1, 3], [1, 2], [4, 5]]], "expected": [1, 3] },
  { "args": [[[2, 1], [3, 1], [4, 2], [1, 4]]], "expected": [1, 4] },
  { "args": [[[1, 2], [2, 3], [3, 1]]], "expected": [3, 1] }
]
```
