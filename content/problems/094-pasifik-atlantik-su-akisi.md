---
title: Pasifik-Atlantik Su Akışı
difficulty: medium
tags: [graf, dfs, bfs, matris]
function: pacificAtlantic
params:
  - { name: heights, type: "int[][]" }
returns: "List<List<int>>"
compare: unordered
---
`m x n` boyutunda dikdörtgen bir ada, her hücrenin deniz seviyesinden yüksekliğini veren `heights` matrisiyle veriliyor. **Pasifik Okyanusu** adanın sol ve üst kenarlarına, **Atlantik Okyanusu** sağ ve alt kenarlarına değer.

Yağmur suyu bir hücreden yüksekliği **küçük ya da eşit** olan komşu hücreye (yukarı, aşağı, sol, sağ) akabilir. Okyanusa komşu hücrelerden su doğrudan okyanusa akar.

Suyun hem Pasifik'e hem Atlantik'e akabildiği bütün hücrelerin `[r, c]` koordinatlarını herhangi bir sırada döndürün.

### Örnek 1

```text
Girdi:  heights = [[1,2,2,3,5],
                   [3,2,3,4,4],
                   [2,4,5,3,1],
                   [6,7,1,4,5],
                   [5,1,1,2,4]]
Çıktı:  [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
```

### Örnek 2

```text
Girdi:  heights = [[1]]
Çıktı:  [[0,0]]
```

### Kısıtlar

- `1 <= m, n <= 200`
- `0 <= heights[r][c] <= 10^5`

## İpuçları

- Her hücreden su akıtmayı denemek çok tekrar içerir. Tersini düşünün: okyanustan hangi hücrelere **yukarı doğru** çıkılabilir?
- Pasifik kenarındaki bütün hücrelerden bir DFS/BFS başlatın ve yalnızca **yüksekliği büyük ya da eşit** komşulara geçin. Atlantik için de aynısını yapın.
- İki aramada da ulaşılan hücreler cevaptır.

## Çözüm

### Okyanuslardan geriye doğru arama

Suyun bir hücreden okyanusa akabilmesi, okyanustan o hücreye "yokuş yukarı" (yüksekliği azalmayan) bir yol olmasıyla aynıdır. Bu yüzden iki arama yaparız:

1. Pasifik kenarındaki (üst satır, sol sütun) hücrelerden başlayan DFS, yüksekliği mevcut hücreden küçük olmayan komşulara ilerler. Ulaşılan hücreler `pacific` kümesine girer.
2. Atlantik kenarından (alt satır, sağ sütun) aynısı yapılır.

İki kümede de bulunan hücreler cevaptır. Her hücre her aramada en fazla bir kez ziyaret edilir.

```csharp solution
public class Solution
{
    public IList<IList<int>> PacificAtlantic(int[][] heights)
    {
        var rows = heights.Length;
        var cols = heights[0].Length;
        var pacific = new bool[rows, cols];
        var atlantic = new bool[rows, cols];

        void Dfs(int r, int c, bool[,] seen, int previous)
        {
            if (r < 0 || c < 0 || r >= rows || c >= cols || seen[r, c] || heights[r][c] < previous)
            {
                return;
            }

            seen[r, c] = true;
            Dfs(r + 1, c, seen, heights[r][c]);
            Dfs(r - 1, c, seen, heights[r][c]);
            Dfs(r, c + 1, seen, heights[r][c]);
            Dfs(r, c - 1, seen, heights[r][c]);
        }

        for (var r = 0; r < rows; r++)
        {
            Dfs(r, 0, pacific, int.MinValue);
            Dfs(r, cols - 1, atlantic, int.MinValue);
        }

        for (var c = 0; c < cols; c++)
        {
            Dfs(0, c, pacific, int.MinValue);
            Dfs(rows - 1, c, atlantic, int.MinValue);
        }

        var result = new List<IList<int>>();
        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                if (pacific[r, c] && atlantic[r, c])
                {
                    result.Add(new List<int> { r, c });
                }
            }
        }

        return result;
    }
}
```

```typescript solution
function pacificAtlantic(heights: number[][]): number[][] {
  const rows = heights.length;
  const cols = heights[0].length;
  const pacific = heights.map((row) => row.map(() => false));
  const atlantic = heights.map((row) => row.map(() => false));

  const dfs = (r: number, c: number, seen: boolean[][], previous: number): void => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || seen[r][c] || heights[r][c] < previous) return;
    seen[r][c] = true;
    dfs(r + 1, c, seen, heights[r][c]);
    dfs(r - 1, c, seen, heights[r][c]);
    dfs(r, c + 1, seen, heights[r][c]);
    dfs(r, c - 1, seen, heights[r][c]);
  };

  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pacific, -Infinity);
    dfs(r, cols - 1, atlantic, -Infinity);
  }

  for (let c = 0; c < cols; c++) {
    dfs(0, c, pacific, -Infinity);
    dfs(rows - 1, c, atlantic, -Infinity);
  }

  const result: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) result.push([r, c]);
    }
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(m × n). Her hücre iki aramanın her birinde en fazla bir kez işlenir.
- **Alan:** O(m × n). İki ziyaret tablosu ve en kötü durumda o kadar derin özyineleme.

"Kaynaktan hedefe" yerine "hedeften geriye" aramak, çok kaynaklı problemlerde tekrarlı işi ortadan kaldıran genel bir tekniktir (Duvarlar ve Kapılar, Kuşatılmış Bölgeler).

## Testler

```json
[
  {
    "args": [[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]],
    "expected": [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]],
    "sample": true
  },
  { "args": [[[1]]], "expected": [[0, 0]], "sample": true },
  { "args": [[[1, 1], [1, 1]]], "expected": [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { "args": [[[3, 3, 3], [3, 1, 3], [0, 2, 4]]], "expected": [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]] },
  { "args": [[[1, 2, 3]]], "expected": [[0, 0], [0, 1], [0, 2]] }
]
```
