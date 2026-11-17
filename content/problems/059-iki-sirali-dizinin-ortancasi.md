---
title: İki Sıralı Dizinin Ortancası
difficulty: hard
tags: [ikili-arama, dizi]
function: findMedianSortedArrays
params:
  - { name: nums1, type: "int[]" }
  - { name: nums2, type: "int[]" }
returns: "double"
---
Boyutları sırasıyla `m` ve `n` olan, küçükten büyüğe sıralanmış iki tam sayı dizisi `nums1` ve `nums2` veriliyor. Bu iki dizinin birleşiminin **ortancasını (medyanını)** döndürün.

Algoritmanızın toplam çalışma zamanı karmaşıklığı **O(log(m + n))** olmalıdır.

### Örnek 1

```text
Girdi:  nums1 = [1, 3], nums2 = [2]
Çıktı:  2.0
Açıklama: Birleştirilmiş dizi [1, 2, 3] olur ve ortancası 2'dir.
```

### Örnek 2

```text
Girdi:  nums1 = [1, 2], nums2 = [3, 4]
Çıktı:  2.5
Açıklama: Birleştirilmiş dizi [1, 2, 3, 4] olur ve ortancası (2 + 3) / 2 = 2.5'tir.
```

### Kısıtlar

- `nums1.length == m`
- `nums2.length == n`
- `0 <= m <= 1000`
- `0 <= n <= 1000`
- `1 <= m + n <= 2000`
- `-10^6 <= nums1[i], nums2[i] <= 10^6`

## İpuçları

- İki diziyi gerçekten birleştirmek O(m + n) sürer. O(log(min(m, n))) hedeflemek için ikili arama düşünmelisiniz.
- Ortanca, birleşik diziyi iki eşit (veya sol tarafı 1 eleman fazla) parçaya bölen sınır noktasıdır: sol yarıdaki tüm elemanlar sağ yarıdaki tüm elemanlardan küçük veya eşit olmalıdır.
- Daha kısa olan dizinin sol yarıya kaç eleman (`i`) vereceğini seçtiğinizde, diğer dizinin sol yarıya kaç eleman (`j = half - i`) vereceği otomatik olarak belirlenir.
- Doğru bölünme noktası için yalnızca sınırın hemen solundaki ve sağındaki dört elemanı (`maxLeftA <= minRightB` ve `maxLeftB <= minRightA`) karşılaştırmanız yeterlidir.

## Çözüm

Bir dizinin ortancası, diziyi uzunlukları eşit iki yarıya (toplam eleman sayısı tekse sol yarı 1 eleman daha kalabalık olacak şekilde) bölen noktadır. İki sıralı dizimiz olduğunda, `nums1`'i `i` noktasından ve `nums2`'yi `j` noktasından kesersek:
- Sol yarıda `nums1`'in ilk `i` elemanı ile `nums2`'nin ilk `j` elemanı bulunur (`i + j = (m + n + 1) / 2`).
- Sağ yarıda ise kalan elemanlar yer alır.

Bu kesimin geçerli bir ortanca kesimi olması için **sol yarıdaki en büyük elemanın, sağ yarıdaki en küçük elemandan küçük veya ona eşit olması** gerekir. Diziler kendi içlerinde zaten sıralı olduğundan yalnızca çapraz sınırları kontrol etmemiz yeterlidir:
1. `nums1[i - 1] <= nums2[j]` (`maxLeftA <= minRightB`)
2. `nums2[j - 1] <= nums1[i]` (`maxLeftB <= minRightA`)

Her zaman daha kısa olan dizide (`nums1`) `0` ile `m` arasında ikili arama yaparız:
- Eğer `maxLeftA > minRightB` ise `nums1`'den sol yarıya fazla büyük eleman almışızdır; kesimi sola kaydırırız (`right = i - 1`).
- Eğer `maxLeftB > minRightA` ise `nums1`'den sol yarıya az eleman almışızdır; kesimi sağa kaydırırız (`left = i + 1`).
- Her iki koşul da sağlandığında doğru kesimi bulmuşuzdur: toplam uzunluk tekse sol yarının en büyüğü (`Math.Max(maxLeftA, maxLeftB)`), çiftse sol yarının en büyüğü ile sağ yarının en küçüğünün ortalaması ortancayı verir.

```csharp solution
public class Solution
{
    public double FindMedianSortedArrays(int[] nums1, int[] nums2)
    {
        // İkili aramayı her zaman daha kısa olan dizide yap.
        if (nums1.Length > nums2.Length)
        {
            return FindMedianSortedArrays(nums2, nums1);
        }

        int m = nums1.Length;
        int n = nums2.Length;
        int half = (m + n + 1) / 2;
        int left = 0;
        int right = m;

        while (left <= right)
        {
            int i = left + (right - left) / 2;
            int j = half - i;

            int maxLeftA = i == 0 ? int.MinValue : nums1[i - 1];
            int minRightA = i == m ? int.MaxValue : nums1[i];
            int maxLeftB = j == 0 ? int.MinValue : nums2[j - 1];
            int minRightB = j == n ? int.MaxValue : nums2[j];

            if (maxLeftA <= minRightB && maxLeftB <= minRightA)
            {
                if ((m + n) % 2 == 1)
                {
                    return Math.Max(maxLeftA, maxLeftB);
                }

                return ((double)Math.Max(maxLeftA, maxLeftB) + Math.Min(minRightA, minRightB)) / 2.0;
            }
            else if (maxLeftA > minRightB)
            {
                right = i - 1;
            }
            else
            {
                left = i + 1;
            }
        }

        return 0.0;
    }
}
```

```typescript solution
function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  if (nums1.length > nums2.length) {
    return findMedianSortedArrays(nums2, nums1);
  }

  const m = nums1.length;
  const n = nums2.length;
  const half = Math.floor((m + n + 1) / 2);
  let left = 0;
  let right = m;

  while (left <= right) {
    const i = Math.floor((left + right) / 2);
    const j = half - i;

    const maxLeftA = i === 0 ? -Infinity : nums1[i - 1];
    const minRightA = i === m ? Infinity : nums1[i];
    const maxLeftB = j === 0 ? -Infinity : nums2[j - 1];
    const minRightB = j === n ? Infinity : nums2[j];

    if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
      if ((m + n) % 2 === 1) {
        return Math.max(maxLeftA, maxLeftB);
      }

      return (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2;
    } else if (maxLeftA > minRightB) {
      right = i - 1;
    } else {
      left = i + 1;
    }
  }

  return 0;
}
```

### Karmaşıklık

- **Zaman:** O(log(min(m, n))). İkili arama yalnızca kısa olan dizinin kesim noktaları üzerinde yapılır ve her adımda arama aralığı yarıya iner.
- **Alan:** O(1). Yalnızca sınır indeksleri ve sınır değerleri için sabit sayıda değişken kullanılır.

## Testler

```json
[
  { "args": [[1, 3], [2]], "expected": 2.0, "sample": true },
  { "args": [[1, 2], [3, 4]], "expected": 2.5, "sample": true },
  { "args": [[0, 0], [0, 0]], "expected": 0.0 },
  { "args": [[], [1]], "expected": 1.0 },
  { "args": [[2], []], "expected": 2.0 },
  { "args": [[1, 3, 8, 9, 15], [7, 11, 18, 19, 21, 25]], "expected": 11.0 },
  { "args": [[-5, 3, 6, 12, 15], [-12, -10, -6, -3, 4, 10]], "expected": 3.0 },
  { "args": [[1, 2, 3], [4, 5, 6, 7, 8]], "expected": 4.5 }
]
```
