---
title: Yükselen Suda Yüzme
difficulty: hard
tags: [graf, heap, matris, ikili-arama]
function: swimInWater
params:
  - { name: grid, type: "int[][]" }
returns: "int"
---
`n x n` boyutunda bir ızgara `grid` veriliyor; `grid[i][j]`, `(i, j)` noktasının yüksekliğidir ve bütün değerler `0` ile `n² - 1` arasında **birbirinden farklıdır**.

Yağmur yağmaya başlıyor. `t` anında her yerde suyun derinliği `t`'dir. Bir hücreden dört yönlü komşusuna, **iki hücrenin yüksekliği de en fazla `t`** ise yüzerek geçebilirsiniz. Yüzmek hiç zaman almaz; yalnızca su seviyesini beklemeniz gerekir.

Sol üst köşeden `(0, 0)` başlayarak sağ alt köşeye `(n - 1, n - 1)` ulaşabileceğiniz **en erken anı** döndürün.

### Örnek 1

```text
Girdi:  grid = [[0,2],[1,3]]
Çıktı:  3
Açıklama: Sağ alt hücrenin yüksekliği 3; ona ancak t = 3'te girilebilir.
```

### Örnek 2

```text
Girdi:  grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]
Çıktı:  16
```

### Kısıtlar

- `1 <= n <= 50`
- `0 <= grid[i][j] < n²`; bütün değerler birbirinden farklıdır.

## İpuçları

- Bir yolun "maliyeti", yol üzerindeki **en yüksek** hücredir. Maliyeti en küçük yolu arıyorsunuz.
- Dijkstra'yı toplam yerine maksimumla çalıştırın: heap'ten her seferinde o ana kadarki en düşük seviyeyle ulaşılabilen hücreyi çıkarın.
- Alternatif: `t` üzerinde ikili arama yapıp her `t` için BFS ile hedefe ulaşılıp ulaşılmadığına bakın.

## Çözüm

### Maksimuma göre Dijkstra

Heap `(seviye, r, c)` üçlülerini en düşük seviye önce gelecek şekilde tutar. Başlangıç `(grid[0][0], 0, 0)`'dır.

Heap'ten çıkan hücreye ulaşmak için gereken en düşük su seviyesi kesinleşmiştir. Hedef hücre çıktığında seviyesi cevaptır. Aksi halde ziyaret edilmemiş her komşu `max(seviye, grid[nr][nc])` ile heap'e eklenir.

Neden doğru? Heap her zaman ulaşılabilir sınırdaki en düşük hücreyi açar; su seviyesi `t` iken ulaşılabilen bölge, tam olarak heap'ten `t` ya da daha düşük seviyeyle çıkan hücrelerdir.

```csharp solution
public class Solution
{
    public int SwimInWater(int[][] grid)
    {
        var n = grid.Length;
        var seen = new bool[n, n];
        var heap = new PriorityQueue<(int R, int C), int>();
        heap.Enqueue((0, 0), grid[0][0]);
        seen[0, 0] = true;
        var directions = new (int Dr, int Dc)[] { (1, 0), (-1, 0), (0, 1), (0, -1) };

        while (heap.TryDequeue(out var cell, out var level))
        {
            if (cell.R == n - 1 && cell.C == n - 1)
            {
                return level;
            }

            foreach (var (dr, dc) in directions)
            {
                var nr = cell.R + dr;
                var nc = cell.C + dc;
                if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr, nc])
                {
                    continue;
                }

                seen[nr, nc] = true;
                heap.Enqueue((nr, nc), Math.Max(level, grid[nr][nc]));
            }
        }

        return -1;
    }
}
```

```typescript solution
function swimInWater(grid: number[][]): number {
  const n = grid.length;
  const seen = grid.map((row) => row.map(() => false));
  // Dizi üzerinde min-heap: [seviye, r, c].
  const heap: [number, number, number][] = [];

  const push = (item: [number, number, number]): void => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };

  const pop = (): [number, number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1;
        const r = l + 1;
        let s = i;
        if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
        if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
        if (s === i) break;
        [heap[s], heap[i]] = [heap[i], heap[s]];
        i = s;
      }
    }
    return top;
  };

  push([grid[0][0], 0, 0]);
  seen[0][0] = true;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (heap.length > 0) {
    const [level, r, c] = pop();
    if (r === n - 1 && c === n - 1) return level;

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;
      seen[nr][nc] = true;
      push([Math.max(level, grid[nr][nc]), nr, nc]);
    }
  }

  return -1;
}
```

### Karmaşıklık

- **Zaman:** O(n² log n). Her hücre heap'e bir kez girer.
- **Alan:** O(n²).

## Testler

```json
[
  { "args": [[[0, 2], [1, 3]]], "expected": 3, "sample": true },
  { "args": [[[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]]], "expected": 16, "sample": true },
  { "args": [[[0]]], "expected": 0 },
  { "args": [[[3, 2], [0, 1]]], "expected": 3 },
  { "args": [[[0, 1], [2, 3]]], "expected": 3 },
  { "args": [[[0, 3, 2], [4, 1, 5], [8, 7, 6]]], "expected": 6 }
]
```
