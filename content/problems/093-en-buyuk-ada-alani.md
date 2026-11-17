---
title: En Büyük Ada Alanı
difficulty: medium
tags: [graf, dfs, bfs, matris]
function: maxAreaOfIsland
params:
  - { name: grid, type: "int[][]" }
returns: "int"
---
`m x n` boyutlarında ikili bir matris `grid` veriliyor. Bir **ada**, yatay veya dikey (4 yönlü) olarak birbirine bağlı `1` değerindeki hücrelerden (karalardan) oluşan bir gruptur. Matrisin dört kenarının da tamamen suyla (`0`) çevrili olduğunu varsayabilirsiniz.

Bir adanın **alanı**, o adayı oluşturan `1` değerindeki hücrelerin sayısıdır.

`grid` içindeki bir adanın sahip olabileceği **en büyük alanı** döndürün. Hiç ada yoksa `0` döndürün.

### Örnek 1

```text
Girdi:  grid = [
  [0,0,1,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,1,1,0,1,0,0,0,0,0,0,0,0],
  [0,1,0,0,1,1,0,0,1,0,1,0,0],
  [0,1,0,0,1,1,0,0,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,1,1,0,0,0,0]
]
Çıktı:  6
Açıklama: En büyük ada sağ orta kısımda yer alan 6 hücreli adadır. Köşegen bağlantılar aynı adaya dahil edilmez.
```

### Örnek 2

```text
Girdi:  grid = [[0,0,0,0,0,0,0,0]]
Çıktı:  0
Açıklama: Matriste hiç kara hücresi (1) bulunmadığından en büyük alan 0'dır.
```

### Kısıtlar

- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 50`
- `grid[i][j]` yalnızca `0` veya `1` değerini alır.

## İpuçları

- Matristeki her `(r, c)` hücresini gezin; `1` gördüğünüzde yeni bir adaya ayak basmışsınız demektir.
- Bu hücreye yatay ve dikey olarak bağlı tüm `1` hücrelerini saymak için Derinlik Öncelikli Arama (DFS) kullanabilirsiniz.
- Aynı hücreyi tekrar saymamak ve sonsuz döngüye girmemek için ziyaret ettiğiniz her `1` hücresini anında `0`'a çevirin (batırın).
- Bir hücreden başlayan DFS, `1 + Dfs(yukarı) + Dfs(aşağı) + Dfs(sol) + Dfs(sağ)` toplamını döndürerek o adanın toplam alanını hesaplar.

## Çözüm

Matrisin her hücresini bir graf düğümü, yatay/dikey komşulukları ise kenar olarak düşünebiliriz. Amacımız en fazla düğüme sahip bağlı bileşenin (connected component) boyutunu bulmaktır.

Matrisi baştan sona tararız. `grid[r][c] == 1` olan bir hücreyle karşılaştığımızda `Dfs(r, c)` fonksiyonunu çağırırız:
1. Koordinat matris sınırları dışındaysa veya hücre değeri `0` ise alan katkısı `0`'dır; hemen `0` döndürürüz.
2. Hücreyi ziyaret edildi olarak işaretlemek için `grid[r][c] = 0` yaparız. Böylece ek bir `visited` matrisine ihtiyaç duymadan aynı hücrenin tekrar sayılmasını önleriz.
3. Mevcut hücre için `1` sayıp dört komşusundan (`r - 1`, `r + 1`, `c - 1`, `c + 1`) gelen alanları toplarız.

Her adadan dönen alanı `maxArea` ile karşılaştırarak en büyüğünü tutarız.

```csharp solution
public class Solution
{
    public int MaxAreaOfIsland(int[][] grid)
    {
        int rows = grid.Length;
        int cols = grid[0].Length;
        int maxArea = 0;

        int Dfs(int r, int c)
        {
            if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == 0)
                return 0;

            // Ziyaret edilen kara hücresini batırarak tekrar sayılmasını önle
            grid[r][c] = 0;

            return 1
                + Dfs(r - 1, c)
                + Dfs(r + 1, c)
                + Dfs(r, c - 1)
                + Dfs(r, c + 1);
        }

        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (grid[r][c] == 1)
                    maxArea = Math.Max(maxArea, Dfs(r, c));
            }
        }

        return maxArea;
    }
}
```

```typescript solution
function maxAreaOfIsland(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let maxArea = 0;

  function dfs(r: number, c: number): number {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === 0) {
      return 0;
    }

    grid[r][c] = 0;

    return (
      1 +
      dfs(r - 1, c) +
      dfs(r + 1, c) +
      dfs(r, c - 1) +
      dfs(r, c + 1)
    );
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        maxArea = Math.max(maxArea, dfs(r, c));
      }
    }
  }

  return maxArea;
}
```

### Karmaşıklık

- **Zaman:** O(m · n). Matristeki her hücre dış döngüde bir kez kontrol edilir ve `1` olan her hücre DFS tarafından en fazla bir kez ziyaret edilip `0`'a çevrilir.
- **Alan:** O(m · n). Matrisin tamamı `1`'lerden oluştuğunda DFS özyineleme yığını en kötü durumda `m · n` derinliğe ulaşabilir.

## Testler

```json
[
  {
    "args": [
      [
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
      ]
    ],
    "expected": 6,
    "sample": true
  },
  {
    "args": [[[0, 0, 0, 0, 0, 0, 0, 0]]],
    "expected": 0,
    "sample": true
  },
  {
    "args": [[[1]]],
    "expected": 1
  },
  {
    "args": [
      [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ]
    ],
    "expected": 9
  },
  {
    "args": [
      [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        [1, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1],
        [0, 0, 1, 1, 1]
      ]
    ],
    "expected": 5
  },
  {
    "args": [
      [
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 1]
      ]
    ],
    "expected": 7
  }
]
```
