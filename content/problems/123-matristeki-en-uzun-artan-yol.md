---
title: Matristeki En Uzun Artan Yol
difficulty: hard
tags: [dinamik-programlama, dfs, matris, topolojik-siralama]
function: longestIncreasingPath
params:
  - { name: matrix, type: "int[][]" }
returns: "int"
---
`m x n` boyutunda bir tam sayı matrisi `matrix` veriliyor. Matristeki **kesin artan** en uzun yolun uzunluğunu döndürün.

Her hücreden dört yöne (yukarı, aşağı, sol, sağ) gidebilirsiniz. Çapraz hareket ve matrisin dışına çıkmak yasaktır.

### Örnek 1

```text
Girdi:  matrix = [[9,9,4],[6,6,8],[2,1,1]]
Çıktı:  4
Açıklama: En uzun artan yol [1, 2, 6, 9].
```

### Örnek 2

```text
Girdi:  matrix = [[3,4,5],[3,2,6],[2,2,1]]
Çıktı:  4
Açıklama: En uzun artan yol [3, 4, 5, 6].
```

### Kısıtlar

- `1 <= m, n <= 200`
- `0 <= matrix[i][j] <= 2^31 - 1`

## İpuçları

- Her hücreden DFS başlatıp en uzun yolu aramak, aynı alt yolları tekrar tekrar hesaplar.
- Bir hücreden başlayan en uzun artan yol, hangi hücreden gelindiğinden **bağımsızdır**. Sonucu hücre başına bir kez hesaplayıp saklayın (memoization).
- Yol kesin artan olduğu için döngü oluşamaz; "ziyaret edildi" işaretine gerek yoktur.

## Çözüm

### Hafızalı DFS

`Dfs(r, c)`, `(r, c)` hücresinden başlayan en uzun artan yolun uzunluğunu döndürür:

- Sonuç daha önce hesaplandıysa `memo[r, c]` döner.
- Değilse uzunluk en az `1`'dir; değeri daha büyük olan her komşu için `1 + Dfs(komşu)` denenir ve en büyüğü saklanır.

Değerler yol boyunca kesin arttığı için bir DFS yolu aynı hücreye geri dönemez; hesaplama bir DAG üzerinde yapılır. Cevap bütün hücrelerin `Dfs` değerlerinin en büyüğüdür.

```csharp solution
public class Solution
{
    public int LongestIncreasingPath(int[][] matrix)
    {
        var rows = matrix.Length;
        var cols = matrix[0].Length;
        var memo = new int[rows, cols];
        var directions = new (int Dr, int Dc)[] { (1, 0), (-1, 0), (0, 1), (0, -1) };

        int Dfs(int r, int c)
        {
            if (memo[r, c] != 0)
            {
                return memo[r, c];
            }

            var best = 1;
            foreach (var (dr, dc) in directions)
            {
                var nr = r + dr;
                var nc = c + dc;
                if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && matrix[nr][nc] > matrix[r][c])
                {
                    best = Math.Max(best, 1 + Dfs(nr, nc));
                }
            }

            memo[r, c] = best;
            return best;
        }

        var answer = 0;
        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                answer = Math.Max(answer, Dfs(r, c));
            }
        }

        return answer;
    }
}
```

```typescript solution
function longestIncreasingPath(matrix: number[][]): number {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const memo = matrix.map((row) => row.map(() => 0));
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const dfs = (r: number, c: number): number => {
    if (memo[r][c] !== 0) return memo[r][c];

    let best = 1;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + dfs(nr, nc));
      }
    }

    memo[r][c] = best;
    return best;
  };

  let answer = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      answer = Math.max(answer, dfs(r, c));
    }
  }

  return answer;
}
```

### Karmaşıklık

- **Zaman:** O(m × n). Her hücrenin değeri bir kez hesaplanır; her hesap dört komşuya bakar.
- **Alan:** O(m × n) hafıza tablosu ve özyineleme.

Alternatif: hücreleri "kendisinden büyük komşu sayısına" göre katman katman soyan bir topolojik sıralama (Kahn). Katman sayısı cevaptır ve özyineleme gerektirmez.

## Testler

```json
[
  { "args": [[[9, 9, 4], [6, 6, 8], [2, 1, 1]]], "expected": 4, "sample": true },
  { "args": [[[3, 4, 5], [3, 2, 6], [2, 2, 1]]], "expected": 4, "sample": true },
  { "args": [[[1]]], "expected": 1 },
  { "args": [[[1, 2]]], "expected": 2 },
  { "args": [[[7, 7], [7, 7]]], "expected": 1 },
  { "args": [[[1, 2, 3], [6, 5, 4], [7, 8, 9]]], "expected": 9 }
]
```
