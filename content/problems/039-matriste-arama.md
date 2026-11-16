---
title: Matriste Arama
difficulty: medium
tags: [ikili-arama, matris]
function: searchMatrix
params:
  - { name: matrix, type: "int[][]" }
  - { name: target, type: "int" }
returns: "bool"
---
`m x n` boyutunda bir tam sayı matrisi `matrix` veriliyor. Matris şu iki özelliğe sahiptir:

- Her satır soldan sağa **artan** sıradadır.
- Her satırın ilk elemanı, bir önceki satırın son elemanından **büyüktür**.

`target` matriste varsa `true`, yoksa `false` döndürün.

Çözümünüz **O(log(m · n))** zamanda çalışmalıdır.

### Örnek 1

```text
Girdi:  matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3
Çıktı:  true
```

### Örnek 2

```text
Girdi:  matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13
Çıktı:  false
```

### Kısıtlar

- `1 <= m, n <= 100`
- `-10^4 <= matrix[i][j], target <= 10^4`

## İpuçları

- Satırları uç uca eklerseniz ne elde edersiniz? İki özellik birlikte, sonucun baştan sona sıralı tek bir dizi olduğunu söyler.
- Sıralı bir dizide arama için ikili arama kullanılır. Diziyi gerçekten oluşturmanıza gerek yok.
- `m · n` elemanlı sanal dizideki `k` numaralı eleman, matrisin hangi satır ve sütunundadır? Bölme ve kalan işlemlerini düşünün.

## Çözüm

Satırlar kendi içinde sıralı ve her satır bir öncekinin bittiği yerden daha büyük bir değerle başlıyor. Demek ki satırları uç uca eklersek `m · n` elemanlı, baştan sona **sıralı tek bir dizi** elde ederiz. Sıralı dizide de ikili arama yapılır.

Diziyi gerçekten oluşturmayız; yalnızca indeks dönüşümü yaparız. Sanal dizideki `mid` numaralı eleman matriste şuradadır:

- satır: `mid / cols` (kaç tam satır geçildi)
- sütun: `mid % cols` (o satırda kaçıncı eleman)

Geri kalanı bildiğimiz ikili aramadır: ortadaki değer hedefse bulduk; hedeften küçükse sol yarıyı, büyükse sağ yarıyı atarız.

```csharp solution
public class Solution
{
    public bool SearchMatrix(int[][] matrix, int target)
    {
        int rows = matrix.Length;
        int cols = matrix[0].Length;

        // Matrisi rows * cols elemanlı tek bir sıralı dizi gibi düşün.
        int left = 0;
        int right = rows * cols - 1;

        while (left <= right)
        {
            int mid = left + (right - left) / 2;
            int value = matrix[mid / cols][mid % cols];

            if (value == target)
                return true;

            if (value < target)
                left = mid + 1;
            else
                right = mid - 1;
        }

        return false;
    }
}
```

```typescript solution
function searchMatrix(matrix: number[][], target: number): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;

  let left = 0;
  let right = rows * cols - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const value = matrix[Math.floor(mid / cols)][mid % cols];

    if (value === target) return true;

    if (value < target) left = mid + 1;
    else right = mid - 1;
  }

  return false;
}
```

### Karmaşıklık

- **Zaman:** O(log(m · n)). Her adımda arama aralığı yarıya iner.
- **Alan:** O(1).

**Alternatif:** Önce ilk sütunda ikili aramayla doğru satırı, sonra o satırda ikili aramayla hedefi bulmak da aynı karmaşıklıktadır (log m + log n = log(m · n)), ama iki ayrı arama yazmak gerekir. Tek dizi gibi düşünmek daha kısadır ve hata yapma olasılığı daha düşüktür.

`mid` hesaplanırken `(left + right) / 2` yerine `left + (right - left) / 2` yazmak, büyük indekslerde toplamın taşmasını önleyen bir alışkanlıktır.

## Testler

```json
[
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], "expected": true, "sample": true },
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], "expected": false, "sample": true },
  { "args": [[[1]], 1], "expected": true },
  { "args": [[[1]], 2], "expected": false },
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 1], "expected": true },
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 60], "expected": true },
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 10], "expected": true },
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 0], "expected": false },
  { "args": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 61], "expected": false },
  { "args": [[[1], [3], [5]], 3], "expected": true },
  { "args": [[[1], [3], [5]], 4], "expected": false },
  { "args": [[[-5, -2, 0, 4]], -2], "expected": true }
]
```
