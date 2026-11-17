---
title: Çürüyen Portakallar
difficulty: medium
tags: [graf, bfs, kuyruk, matris]
function: orangesRotting
params:
  - { name: grid, type: "int[][]" }
returns: "int"
---
`m x n` boyutunda bir ızgara `grid` veriliyor. Her hücre şu üç değerden birini taşır:

- `0`: boş hücre,
- `1`: taze portakal,
- `2`: çürük portakal.

Her dakika, çürük bir portakala dört yönde komşu olan taze portakallar çürür. **Hiç taze portakal kalmayana kadar geçen en az dakikayı** döndürün. Bu mümkün değilse `-1` döndürün.

### Örnek 1

```text
Girdi:  grid = [[2,1,1],[1,1,0],[0,1,1]]
Çıktı:  4
```

### Örnek 2

```text
Girdi:  grid = [[2,1,1],[0,1,1],[1,0,1]]
Çıktı:  -1
Açıklama: Sol alttaki portakal hiçbir çürük portakala komşu olamaz.
```

### Örnek 3

```text
Girdi:  grid = [[0,2]]
Çıktı:  0
Açıklama: Başlangıçta zaten taze portakal yok.
```

### Kısıtlar

- `1 <= m, n <= 10`
- `grid[i][j]`, `0`, `1` ya da `2`'dir.

## İpuçları

- Çürüme bütün çürük portakallardan **aynı anda** yayılır. Bu hangi arama türünü akla getiriyor?
- Başlangıçtaki bütün çürük portakalları aynı kuyruğa koyun (çok kaynaklı BFS). Her BFS seviyesi bir dakikadır.
- Taze portakal sayısını tutun; BFS bittiğinde hâlâ taze portakal varsa cevap `-1`'dir.

## Çözüm

### Çok kaynaklı BFS

Bütün çürük portakallar başlangıçta kuyruğa girer ve taze portakallar sayılır. Ardından BFS seviye seviye ilerler: her turda kuyruktaki bütün portakallar işlenir, komşu taze portakallar çürütülüp kuyruğa eklenir ve taze sayısı azalır. Bir turda en az bir portakal çürüdüyse bir dakika geçmiş demektir.

BFS bittiğinde taze portakal kalmadıysa geçen dakika, kaldıysa `-1` döner.

```csharp solution
public class Solution
{
    public int OrangesRotting(int[][] grid)
    {
        var rows = grid.Length;
        var cols = grid[0].Length;
        var queue = new Queue<(int R, int C)>();
        var fresh = 0;

        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                if (grid[r][c] == 2) queue.Enqueue((r, c));
                else if (grid[r][c] == 1) fresh++;
            }
        }

        var minutes = 0;
        var directions = new (int Dr, int Dc)[] { (1, 0), (-1, 0), (0, 1), (0, -1) };

        while (queue.Count > 0 && fresh > 0)
        {
            var size = queue.Count;
            for (var i = 0; i < size; i++)
            {
                var (r, c) = queue.Dequeue();
                foreach (var (dr, dc) in directions)
                {
                    var nr = r + dr;
                    var nc = c + dc;
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] != 1)
                    {
                        continue;
                    }

                    grid[nr][nc] = 2;
                    fresh--;
                    queue.Enqueue((nr, nc));
                }
            }

            minutes++;
        }

        return fresh == 0 ? minutes : -1;
    }
}
```

```typescript solution
function orangesRotting(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let queue: [number, number][] = [];
  let fresh = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }

  let minutes = 0;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length > 0 && fresh > 0) {
    const next: [number, number][] = [];
    for (const [r, c] of queue) {
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2;
        fresh--;
        next.push([nr, nc]);
      }
    }

    queue = next;
    minutes++;
  }

  return fresh === 0 ? minutes : -1;
}
```

### Karmaşıklık

- **Zaman:** O(m × n). Her hücre kuyruğa en fazla bir kez girer.
- **Alan:** O(m × n) kuyruk.

Döngü koşulundaki `fresh > 0`, son çürüme turundan sonra fazladan bir dakika sayılmasını engeller.

## Testler

```json
[
  { "args": [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], "expected": 4, "sample": true },
  { "args": [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], "expected": -1, "sample": true },
  { "args": [[[0, 2]]], "expected": 0, "sample": true },
  { "args": [[[0]]], "expected": 0 },
  { "args": [[[1]]], "expected": -1 },
  { "args": [[[2, 2], [1, 1]]], "expected": 1 },
  { "args": [[[2, 1, 1, 1, 1]]], "expected": 4 },
  { "args": [[[1, 2, 1], [1, 1, 1], [1, 1, 2]]], "expected": 2 }
]
```
