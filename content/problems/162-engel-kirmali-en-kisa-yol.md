---
title: Engel Kırmalı Izgarada En Kısa Yol
difficulty: hard
tags: [graf, bfs, matris]
function: shortestPath
params:
  - { name: grid, type: "int[][]" }
  - { name: k, type: "int" }
returns: "int"
---
`m x n` boyutlarında, her hücresi `0` (boş) veya `1` (engel) olan bir `grid` matrisi ve bir `k` tam sayısı veriliyor.

Sol üst köşeden `(0, 0)` başlayarak sağ alt köşeye `(m - 1, n - 1)` ulaşmak için gereken **en az adım sayısını** döndürün. Bir adımda yukarı, aşağı, sola veya sağa komşu bir hücreye geçebilirsiniz ve yol boyunca **en fazla `k` adet engeli** (`1` olan hücreyi) kaldırıp içinden geçebilirsiniz.

Eğer hedefe ulaşmak mümkün değilse `-1` döndürün.

### Örnek 1

```text
Girdi:  grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1
Çıktı:  6
Açıklama:
Engele hiç dokunmadan en kısa yol 10 adımdır.
Ancak (1, 0) konumundaki tek bir engeli kırarak (0,0) -> (1,0) -> (2,0) -> (3,0) -> (4,0) -> (4,1) -> (4,2) yoluyla 6 adımda hedefe ulaşılır.
```

### Örnek 2

```text
Girdi:  grid = [[0,1,1],[1,1,1],[1,0,0]], k = 1
Çıktı:  -1
Açıklama: Hedefe ulaşmak için en az 2 engeli kırmak gerekir; k = 1 olduğu için yol yoktur.
```

### Örnek 3

```text
Girdi:  grid = [[0,1,1],[1,1,1],[1,0,0]], k = 2
Çıktı:  4
Açıklama: (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2) yolu 2 engel kırarak 4 adımda hedefe varır.
```

### Kısıtlar

- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 40`
- `1 <= k <= m * n`
- `grid[i][j]` değeri `0` veya `1`'dir.
- `grid[0][0] == grid[m - 1][n - 1] == 0`

## İpuçları

- Standart BFS'te bir hücreyi ilk kez ziyaret ettiğimizde en kısa yoldan ulaştığımız için tekrar ziyaret etmeyiz. Ancak burada bir hücreye **daha az adımda ama daha az kırma hakkıyla** ulaşmak, ilerideki engelleri aşmamızı engelleyebilir.
- Bu nedenle durumumuz yalnızca `(r, c)` değil, `(r, c, kalanKirmaHakki)` üçlüsüdür.
- Her `(r, c, rem)` durumunu ayrı ayrı tutmak yerine, bir `(r, c)` hücresine daha önce ulaştığımız **en büyük kalan kırma hakkını** `bestRemaining[r, c]` içinde saklayabiliriz.
- Bir `(r, c)` hücresine BFS sırasında yeniden geldiğimizde, yalnızca elimizdeki `nextRem > bestRemaining[r, c]` ise bu yolu kuyruğa eklememiz yeterlidir (çünkü hem daha fazla adımda hem de daha az/eşit kırma hakkıyla gelmek hiçbir avantaj sağlamaz).

## Çözüm

Ağırlıksız bir ızgarada en kısa yolu bulmak için Genişlik Öncelikli Arama (BFS) kullanırız. Ancak klasik BFS'ten farklı olarak bir hücreye ulaşmanın "kalitesi" yalnız adım sayısına değil, o hücreye vardığımızda cebimizde kalan engel kırma hakkına (`rem`) da bağlıdır.

BFS kuyruğunda adımları katman katman ilerlettiğimiz için bir `(r, c)` hücresine ikinci kez ulaştığımızda adım sayımız ilk ziyarete göre **kesinlikle daha büyük veya eşittir**. Bu ikinci ziyaretin işimize yaraması için tek geçerli sebep, ilk ziyarete göre **daha fazla kalan kırma hakkı (`nextRem`)** ile gelmiş olmamızdır.

Bu gözlemle:
1. `bestRemaining[r, c]` dizisini tüm hücreler için `-1` ile başlatırız (`bestRemaining[0, 0] = k`).
2. Kuyruğa başlangıç durumu `(0, 0, k, 0)` eklenir.
3. Her adımda komşu `(nr, nc)` hücresine geçerken `nextRem = rem - grid[nr][nc]` hesaplanır.
4. Eğer `nextRem >= 0` ve `nextRem > bestRemaining[nr, nc]` ise `bestRemaining[nr, nc] = nextRem` güncellenir ve durum kuyruğa eklenir.

Hedef `(m - 1, n - 1)` hücresine ulaşılan ilk an, BFS doğası gereği en kısa yolu verir.

```csharp solution
public class Solution
{
    public int ShortestPath(int[][] grid, int k)
    {
        int m = grid.Length;
        int n = grid[0].Length;

        if (m == 1 && n == 1)
            return 0;

        if (k >= m + n - 2)
            return m + n - 2;

        int[,] bestRemaining = new int[m, n];
        for (int r = 0; r < m; r++)
        {
            for (int c = 0; c < n; c++)
            {
                bestRemaining[r, c] = -1;
            }
        }

        Queue<(int r, int c, int rem, int steps)> queue = new Queue<(int r, int c, int rem, int steps)>();
        queue.Enqueue((0, 0, k, 0));
        bestRemaining[0, 0] = k;

        int[] dr = { -1, 1, 0, 0 };
        int[] dc = { 0, 0, -1, 1 };

        while (queue.Count > 0)
        {
            var (r, c, rem, steps) = queue.Dequeue();

            for (int d = 0; d < 4; d++)
            {
                int nr = r + dr[d];
                int nc = c + dc[d];

                if (nr < 0 || nr >= m || nc < 0 || nc >= n)
                    continue;

                int nextRem = rem - grid[nr][nc];
                if (nextRem >= 0 && nextRem > bestRemaining[nr, nc])
                {
                    if (nr == m - 1 && nc == n - 1)
                        return steps + 1;

                    bestRemaining[nr, nc] = nextRem;
                    queue.Enqueue((nr, nc, nextRem, steps + 1));
                }
            }
        }

        return -1;
    }
}
```

```typescript solution
function shortestPath(grid: number[][], k: number): number {
  const m = grid.length;
  const n = grid[0].length;

  if (m === 1 && n === 1) return 0;
  if (k >= m + n - 2) return m + n - 2;

  const bestRemaining: number[][] = Array.from({ length: m }, () =>
    new Array<number>(n).fill(-1)
  );

  const queue: [number, number, number, number][] = [[0, 0, k, 0]];
  bestRemaining[0][0] = k;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let head = 0;
  while (head < queue.length) {
    const [r, c, rem, steps] = queue[head++];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;

      const nextRem = rem - grid[nr][nc];
      if (nextRem >= 0 && nextRem > bestRemaining[nr][nc]) {
        if (nr === m - 1 && nc === n - 1) return steps + 1;
        bestRemaining[nr][nc] = nextRem;
        queue.push([nr, nc, nextRem, steps + 1]);
      }
    }
  }

  return -1;
}
```

### Karmaşıklık

- **Zaman:** O(m * n * min(k, m + n)). Bir `(r, c)` hücresi `bestRemaining[r, c]` değeri her seferinde kesinlikle arttığı için kuyruğa en fazla `min(k, m + n)` kez girebilir.
- **Alan:** O(m * n * min(k, m + n)), BFS kuyruğu ve `bestRemaining` tablosu için.

## Testler

```json
[
  {
    "args": [[[0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 0]], 1],
    "expected": 6,
    "sample": true
  },
  {
    "args": [[[0, 1, 1], [1, 1, 1], [1, 0, 0]], 1],
    "expected": -1,
    "sample": true
  },
  {
    "args": [[[0, 1, 1], [1, 1, 1], [1, 0, 0]], 2],
    "expected": 4,
    "sample": true
  },
  {
    "args": [[[0]], 1],
    "expected": 0
  },
  {
    "args": [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], 0],
    "expected": 4
  },
  {
    "args": [[[0, 1, 0, 1], [0, 1, 0, 0], [0, 0, 0, 1], [1, 1, 1, 0]], 1],
    "expected": 6
  }
]
```
