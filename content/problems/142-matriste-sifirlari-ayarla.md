---
title: Matriste Sıfırları Ayarla
difficulty: medium
tags: [matris]
function: setZeroes
params:
  - { name: matrix, type: "int[][]" }
returns: "int[][]"
---
`m x n` boyutlarında bir `matrix` tam sayı matrisi veriliyor. Bir hücrenin değeri `0` ise, o hücrenin bulunduğu **tüm satırı** ve **tüm sütunu** `0` yapın ve güncellenmiş matrisi döndürün.

Bu işlemi **yerinde** (in-place), yani **O(1)** ek bellek kullanarak gerçekleştirmelisiniz.

### Örnek 1

```text
Girdi:  matrix = [[1,1,1],[1,0,1],[1,1,1]]
Çıktı:  [[1,0,1],[0,0,0],[1,0,1]]
Açıklama: (1, 1) konumundaki 0 nedeniyle 1. satır ve 1. sütun tamamen 0 yapılır.
```

### Örnek 2

```text
Girdi:  matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
Çıktı:  [[0,0,0,0],[0,4,5,0],[0,3,1,0]]
Açıklama: İlk satırdaki (0, 0) ve (0, 3) hücreleri 0 olduğu için 0. satır ile 0. ve 3. sütunlar tamamen 0 yapılır.
```

### Kısıtlar

- `m == matrix.length`
- `n == matrix[0].length`
- `1 <= m, n <= 200`
- `-2^31 <= matrix[i][j] <= 2^31 - 1`

## İpuçları

- Matrisi gezerken gördüğünüz her `0` için o satır ve sütunu hemen sıfırlarsanız, sonradan sıfırlanan hücreleri orijinal sıfırlardan ayırt edemezsiniz.
- Hangi satır ve sütunların sıfırlanacağını iki ayrı dizide (`bool[m]` ve `bool[n]`) tutmak O(m + n) ek alan kullanır.
- Ek dizi açmak yerine bu bayrakları bizzat matrisin **ilk satırında** ve **ilk sütununda** saklayabilir misiniz?
- `matrix[0][0]` hücresi hem ilk satırı hem ilk sütunu temsil etmeye çalışırsa çakışma olur; ilk satırın sıfırlanıp sıfırlanmayacağını tek bir `firstRowZero` değişkeninde tutun.

## Çözüm

Hangi satırların ve sütunların sıfırlanması gerektiğini hatırlamak için ek diziler açmak yerine, matrisin **0. satırını** sütun bayrakları, **0. sütununu** ise satır bayrakları olarak kullanırız:

1. **Bayrakları işaretleme:** Matristeki her `(r, c)` hücresini tararız. Eğer `matrix[r][c] == 0` ise:
   - `c` sütununun sıfırlanacağını belirtmek için `matrix[0][c] = 0` yaparız.
   - `r > 0` ise `r` satırının sıfırlanacağını belirtmek için `matrix[r][0] = 0` yaparız; `r == 0` ise ilk satırın sıfırlanacağını `firstRowZero = true` değişkeninde tutarız. Böylece `matrix[0][0]` yalnızca 0. sütunun bayrağı olur.
2. **İç hücreleri sıfırlama:** `r = 1..m-1` ve `c = 1..n-1` aralığındaki hücreleri gezeriz. Satır bayrağı (`matrix[r][0] == 0`) veya sütun bayrağı (`matrix[0][c] == 0`) sıfırsa `matrix[r][c] = 0` yaparız. (İlk satır ve sütuna henüz dokunmayız ki bayraklar bozulmasın.)
3. **İlk sütun ve ilk satırı sıfırlama:** Önce `matrix[0][0] == 0` ise 0. sütunu, ardından `firstRowZero == true` ise 0. satırı sıfırlarız.

```csharp solution
public class Solution
{
    public int[][] SetZeroes(int[][] matrix)
    {
        int rows = matrix.Length;
        int cols = matrix[0].Length;
        bool firstRowZero = false;

        // 1. Adım: Sıfır olan hücrelerin satır ve sütun başlarını işaretle.
        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (matrix[r][c] == 0)
                {
                    matrix[0][c] = 0;
                    if (r > 0)
                        matrix[r][0] = 0;
                    else
                        firstRowZero = true;
                }
            }
        }

        // 2. Adım: İlk satır ve sütun hariç iç hücreleri bayraklara göre sıfırla.
        for (int r = 1; r < rows; r++)
        {
            for (int c = 1; c < cols; c++)
            {
                if (matrix[r][0] == 0 || matrix[0][c] == 0)
                    matrix[r][c] = 0;
            }
        }

        // 3. Adım: Gerekliyse ilk sütunu sıfırla.
        if (matrix[0][0] == 0)
        {
            for (int r = 0; r < rows; r++)
                matrix[r][0] = 0;
        }

        // 4. Adım: Gerekliyse ilk satırı sıfırla.
        if (firstRowZero)
        {
            for (int c = 0; c < cols; c++)
                matrix[0][c] = 0;
        }

        return matrix;
    }
}
```

```typescript solution
function setZeroes(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let firstRowZero = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[0][c] = 0;
        if (r > 0) {
          matrix[r][0] = 0;
        } else {
          firstRowZero = true;
        }
      }
    }
  }

  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
  }

  if (matrix[0][0] === 0) {
    for (let r = 0; r < rows; r++) {
      matrix[r][0] = 0;
    }
  }

  if (firstRowZero) {
    for (let c = 0; c < cols; c++) {
      matrix[0][c] = 0;
    }
  }

  return matrix;
}
```

### Karmaşıklık

- **Zaman:** O(m · n). Matris sabit sayıda (en fazla iki tam geçiş ve kenar geçişleri) taranır.
- **Alan:** O(1). Bayraklar matrisin kendi ilk satır ve sütununda tutulduğu için yalnızca `firstRowZero` değişkeni kullanılır.

## Testler

```json
[
  {
    "args": [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]],
    "expected": [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
    "sample": true
  },
  {
    "args": [[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]],
    "expected": [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]],
    "sample": true
  },
  {
    "args": [[[1, 2, 3], [4, 5, 6]]],
    "expected": [[1, 2, 3], [4, 5, 6]]
  },
  {
    "args": [[[1, 2, 3], [0, 4, 5]]],
    "expected": [[0, 2, 3], [0, 0, 0]]
  },
  {
    "args": [[[1, 0, 3], [4, 5, 6]]],
    "expected": [[0, 0, 0], [4, 0, 6]]
  },
  {
    "args": [[[0]]],
    "expected": [[0]]
  },
  {
    "args": [[[1, 0], [2, 3], [4, 5]]],
    "expected": [[0, 0], [2, 0], [4, 0]]
  }
]
```
