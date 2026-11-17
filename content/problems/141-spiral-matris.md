---
title: Spiral Matris
difficulty: medium
tags: [matris]
function: spiralOrder
params:
  - { name: matrix, type: "int[][]" }
returns: "List<int>"
---
`m x n` boyutlarında bir `matrix` veriliyor. Matrisin tüm elemanlarını sol üst köşeden başlayarak saat yönünde **spiral (sarmal) sırayla** içeren bir liste döndürün.

### Örnek 1

```text
Girdi:  matrix = [[1,2,3],[4,5,6],[7,8,9]]
Çıktı:  [1,2,3,6,9,8,7,4,5]
Açıklama: Dış çerçeveden saat yönünde (1->2->3->6->9->8->7->4) dönülür ve merkezdeki 5 ile bitirilir.
```

### Örnek 2

```text
Girdi:  matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Çıktı:  [1,2,3,4,8,12,11,10,9,5,6,7]
```

### Kısıtlar

- `m == matrix.length`
- `n == matrix[i].length`
- `1 <= m, n <= 10`
- `-100 <= matrix[i][j] <= 100`

## İpuçları

- Ziyaret edilmemiş bölgeyi sınırlayan dört duvar düşünün: `top` (üst satır), `bottom` (alt satır), `left` (sol sütun) ve `right` (sağ sütun).
- Her turda sırasıyla: üst satırı soldan sağa, sağ sütunu yukarıdan aşağıya, alt satırı sağdan sola ve sol sütunu aşağıdan yukarıya gezin.
- Bir kenarı tamamen gezdikten sonra o duvarı bir adım içeri daraltın (`top++`, `right--`, `bottom--`, `left++`).
- Tek satırlı veya tek sütunlu bir şerit kaldığında aynı hücreleri tersten tekrar okumamak için alt satırı gezmeden önce `top <= bottom`, sol sütunu gezmeden önce `left <= right` kontrolü yapmayı unutmayın.

## Çözüm

Matris üzerinde sarmal hareketi simüle etmenin en anlaşılır yolu, henüz gezilmemiş dikdörtgen bölgeyi dört sınır değişkeniyle takip etmektir:
- `top = 0`, `bottom = m - 1`
- `left = 0`, `right = n - 1`

`top <= bottom && left <= right` koşulu sağlandığı sürece sırasıyla dört yönü tararız:
1. **Soldan Sağa (Üst Kenar):** `top` satırında `left`'ten `right`'a kadar tüm elemanları listeye ekleriz ve üst sınırı aşağı indiririz (`top++`).
2. **Yukarıdan Aşağıya (Sağ Kenar):** `right` sütununda `top`'tan `bottom`'a kadar tüm elemanları listeye ekleriz ve sağ sınırı sola çekeriz (`right--`).
3. **Sağdan Sola (Alt Kenar):** Üst sınır aşağı indikten sonra hala geçerli bir satır kaldıysa (`top <= bottom`), `bottom` satırında `right`'tan `left`'e doğru ilerleriz ve alt sınırı yukarı çekeriz (`bottom--`).
4. **Aşağıdan Yukarıya (Sol Kenar):** Sağ sınır sola çekildikten sonra hala geçerli bir sütun kaldıysa (`left <= right`), `left` sütununda `bottom`'dan `top`'a doğru ilerleriz ve sol sınırı sağa çekeriz (`left++`).

```csharp solution
public class Solution
{
    public IList<int> SpiralOrder(int[][] matrix)
    {
        List<int> result = new List<int>();
        int top = 0, bottom = matrix.Length - 1;
        int left = 0, right = matrix[0].Length - 1;

        while (top <= bottom && left <= right)
        {
            // 1. Üst satırı soldan sağa gez.
            for (int c = left; c <= right; c++)
                result.Add(matrix[top][c]);
            top++;

            // 2. Sağ sütunu yukarıdan aşağıya gez.
            for (int r = top; r <= bottom; r++)
                result.Add(matrix[r][right]);
            right--;

            // 3. Kalan satır varsa alt satırı sağdan sola gez.
            if (top <= bottom)
            {
                for (int c = right; c >= left; c--)
                    result.Add(matrix[bottom][c]);
                bottom--;
            }

            // 4. Kalan sütun varsa sol sütunu aşağıdan yukarıya gez.
            if (left <= right)
            {
                for (int r = bottom; r >= top; r--)
                    result.Add(matrix[r][left]);
                left++;
            }
        }

        return result;
    }
}
```

```typescript solution
function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = [];
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      result.push(matrix[top][c]);
    }
    top++;

    for (let r = top; r <= bottom; r++) {
      result.push(matrix[r][right]);
    }
    right--;

    if (top <= bottom) {
      for (let c = right; c >= left; c--) {
        result.push(matrix[bottom][c]);
      }
      bottom--;
    }

    if (left <= right) {
      for (let r = bottom; r >= top; r--) {
        result.push(matrix[r][left]);
      }
      left++;
    }
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(m · n). Matristeki `m x n` elemanın her biri tam olarak bir kez ziyaret edilir.
- **Alan:** O(1) ek alan (çıktı listesi `result` hariç yalnızca dört sınır değişkeni kullanılır).

## Testler

```json
[
  { "args": [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], "expected": [1, 2, 3, 6, 9, 8, 7, 4, 5], "sample": true },
  { "args": [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], "expected": [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7], "sample": true },
  { "args": [[[7]]], "expected": [7] },
  { "args": [[[1, 2, 3, 4]]], "expected": [1, 2, 3, 4] },
  { "args": [[[1], [2], [3], [4]]], "expected": [1, 2, 3, 4] },
  { "args": [[[1, 2], [3, 4], [5, 6]]], "expected": [1, 2, 4, 6, 5, 3] }
]
```
