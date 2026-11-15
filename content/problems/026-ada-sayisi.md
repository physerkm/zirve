---
title: Ada Sayısı
difficulty: medium
tags: [graf, dfs, bfs, matris]
function: numIslands
params:
  - { name: grid, type: "char[][]" }
returns: "int"
---
`'1'` (kara) ve `'0'` (su) karakterlerinden oluşan iki boyutlu bir ızgara `grid` veriliyor. **Ada sayısını** döndürün.

Ada, yatay ya da dikey olarak birbirine komşu kara hücrelerinin oluşturduğu ve suyla çevrili bölgedir. Çapraz komşuluk sayılmaz. Izgaranın dört kenarının suyla çevrili olduğunu varsayın.

### Örnek 1

```text
Girdi:
  1 1 1 1 0
  1 1 0 1 0
  1 1 0 0 0
  0 0 0 0 0
Çıktı:  1
```

### Örnek 2

```text
Girdi:
  1 1 0 0 0
  1 1 0 0 0
  0 0 1 0 0
  0 0 0 1 1
Çıktı:  3
```

### Kısıtlar

- `1 <= satır sayısı, sütun sayısı <= 300`

## İpuçları

- Izgara örtük bir graftır: her kara hücresi bir düğüm, komşu kara hücreleri arasında kenar vardır. Soru, **bağlı bileşen sayısını** soruyor.
- Ziyaret edilmemiş bir kara hücresi bulduğunuzda yeni bir ada bulmuşsunuzdur. O adanın **tamamını** ziyaret edildi olarak işaretleyin ki bir daha sayılmasın.
- İşaretlemek için ayrı bir dizi tutabilir ya da hücreyi doğrudan `'0'` yapabilirsiniz.

## Çözüm

Izgarayı satır satır gezeriz. Bir `'1'` gördüğümüzde ada sayacını artırır ve o hücreden başlayan bir derinlik öncelikli arama (DFS) ile adanın bütün hücrelerini `'0'` yaparak "batırırız". Böylece aynı adanın diğer hücreleri sonradan yeni ada olarak sayılmaz.

```csharp solution
public class Solution
{
    public int NumIslands(char[][] grid)
    {
        var count = 0;

        for (var row = 0; row < grid.Length; row++)
        {
            for (var col = 0; col < grid[row].Length; col++)
            {
                if (grid[row][col] != '1') continue;

                count++;
                Sink(grid, row, col);
            }
        }

        return count;
    }

    private void Sink(char[][] grid, int row, int col)
    {
        if (row < 0 || col < 0 || row >= grid.Length || col >= grid[row].Length || grid[row][col] != '1')
        {
            return;
        }

        grid[row][col] = '0';

        Sink(grid, row + 1, col);
        Sink(grid, row - 1, col);
        Sink(grid, row, col + 1);
        Sink(grid, row, col - 1);
    }
}
```

```typescript solution
function numIslands(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  const sink = (row: number, col: number): void => {
    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== '1') return;

    grid[row][col] = '0';

    sink(row + 1, col);
    sink(row - 1, col);
    sink(row, col + 1);
    sink(row, col - 1);
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] !== '1') continue;

      count++;
      sink(row, col);
    }
  }

  return count;
}
```

### Karmaşıklık

- **Zaman:** O(satır × sütun). Her hücre sabit sayıda kez ziyaret edilir.
- **Alan:** En kötü durumda O(satır × sütun); ızgaranın tamamı kara ise özyineleme o kadar derinleşebilir.

Bu çözüm girdiyi **değiştirir**. Mülakatta bunun kabul edilebilir olup olmadığını sorun; değilse ayrı bir `visited` yapısı tutun. Çok büyük ızgaralarda özyineleme yerine kuyrukla BFS kullanmak çağrı yığını taşmasını önler.

## Testler

```json
[
  { "args": [[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]], "expected": 1, "sample": true },
  { "args": [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], "expected": 3, "sample": true },
  { "args": [[["0"]]], "expected": 0 },
  { "args": [[["1"]]], "expected": 1 },
  { "args": [[["1","0","1","0","1"]]], "expected": 3 },
  { "args": [[["1","0"],["0","1"]]], "expected": 2 },
  { "args": [[["1","1","1"],["0","1","0"],["1","1","1"]]], "expected": 1 },
  { "args": [[["1","0","1"],["0","0","0"],["1","0","1"]]], "expected": 4 }
]
```
