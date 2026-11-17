---
title: Maksimum Alt Dizi Toplamı
difficulty: medium
tags: [acgozlu, dinamik-programlama, dizi]
function: maxSubArray
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
Bir tam sayı dizisi `nums` veriliyor. En büyük toplama sahip **bitişik alt diziyi** (en az bir sayı içeren) bulun ve bu toplamı döndürün.

Alt dizi (subarray), bir dizinin bitişik (kesintisiz) bir parçasıdır.

### Örnek 1

```text
Girdi:  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Çıktı:  6
Açıklama: [4, -1, 2, 1] alt dizisinin toplamı 6 ile en büyüktür.
```

### Örnek 2

```text
Girdi:  nums = [1]
Çıktı:  1
Açıklama: Tek elemanlı [1] alt dizisinin toplamı 1'dir.
```

### Örnek 3

```text
Girdi:  nums = [5, 4, -1, 7, 8]
Çıktı:  23
Açıklama: [5, 4, -1, 7, 8] alt dizisinin tamamı seçildiğinde toplam 23 olur.
```

### Kısıtlar

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## İpuçları

- Soldan sağa ilerlerken mevcut alt dizinin toplamını (`curSum`) tutun.
- Eğer önceki elemanlardan gelen `curSum` negatifse, yeni gelen sayıya negatif bir toplam eklemek sonucu yalnızca küçültür.
- Bu durumda geçmişi tamamen bırakıp mevcut sayıdan yeni bir alt dizi başlatmak (`curSum = Math.Max(n, curSum + n)`) her zaman daha iyidir.
- Her adımda gördüğünüz en büyük `curSum` değerini `maxSum` içinde saklayın.

## Çözüm

**Kadane Algoritması**, diziyi soldan sağa tek geçişte tarayarak her indekste biten en büyük alt dizi toplamını (`curSum`) hesaplar.

`i`. elemana (`n = nums[i]`) geldiğimizde iki seçeneğimiz vardır:
1. Mevcut alt diziyi uzatmak: `curSum + n`
2. Önceki alt diziyi bırakıp `n` elemanından sıfırdan başlamak: `n`

Eğer `curSum < 0` ise `curSum + n < n` olacağından, negatif bir geçmişi taşımak yerine `n` ile yeni bir alt dizi başlatmak her zaman daha kârlıdır. Bu kararı `curSum = Math.Max(n, curSum + n)` satırı tek başına verir. Her adımda `maxSum = Math.Max(maxSum, curSum)` ile şimdiye kadarki en yüksek toplamı güncelleriz.

```csharp solution
public class Solution
{
    public int MaxSubArray(int[] nums)
    {
        int curSum = nums[0];
        int maxSum = nums[0];

        for (int i = 1; i < nums.Length; i++)
        {
            int n = nums[i];
            curSum = Math.Max(n, curSum + n);
            maxSum = Math.Max(maxSum, curSum);
        }

        return maxSum;
    }
}
```

```typescript solution
function maxSubArray(nums: number[]): number {
  let curSum = nums[0];
  let maxSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    curSum = Math.max(n, curSum + n);
    maxSum = Math.max(maxSum, curSum);
  }

  return maxSum;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizi baştan sona yalnızca bir kez taranır.
- **Alan:** O(1). Yalnızca `curSum` ve `maxSum` değişkenleri kullanılır.

## Testler

```json
[
  { "args": [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], "expected": 6, "sample": true },
  { "args": [[1]], "expected": 1, "sample": true },
  { "args": [[5, 4, -1, 7, 8]], "expected": 23, "sample": true },
  { "args": [[-1]], "expected": -1 },
  { "args": [[-5, -2, -8, -1, -4]], "expected": -1 },
  { "args": [[2, -1, 3, -2, 4]], "expected": 6 },
  { "args": [[1, 2, 3, 4]], "expected": 10 },
  { "args": [[8, -19, 5, -4, 20]], "expected": 21 }
]
```
