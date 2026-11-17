---
title: Döndürülmüş Sıralı Dizide Minimum
difficulty: medium
tags: [dizi, ikili-arama]
function: findMin
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
Artan sırada sıralı, **elemanları birbirinden farklı** bir dizi `1` ile `n` arasında bir kez döndürülmüş (rotate edilmiş) olarak veriliyor. Örneğin `[0, 1, 2, 4, 5, 6, 7]` dizisi 4 kez döndürülünce `[4, 5, 6, 7, 0, 1, 2]` olur; `n` kez döndürülünce kendisine geri döner.

Dizideki **en küçük elemanı** `O(log n)` zamanda bulun.

### Örnek 1

```text
Girdi:  nums = [3, 4, 5, 1, 2]
Çıktı:  1
Açıklama: Özgün dizi [1, 2, 3, 4, 5] idi ve 3 kez döndürüldü.
```

### Örnek 2

```text
Girdi:  nums = [4, 5, 6, 7, 0, 1, 2]
Çıktı:  0
```

### Örnek 3

```text
Girdi:  nums = [11, 13, 15, 17]
Çıktı:  11
Açıklama: Dizi n kez döndürülmüş, yani sıralı haldedir.
```

### Kısıtlar

- `1 <= nums.length <= 5000`
- `-5000 <= nums[i] <= 5000`
- Bütün elemanlar birbirinden farklıdır.
- `nums` sıralı bir dizinin 1 ile n kez döndürülmüş halidir.

## İpuçları

- Döndürülmüş dizi iki artan parçadan oluşur. Minimum, ikinci parçanın ilk elemanıdır.
- `nums[mid]` ile `nums[hi]`'yi karşılaştırın. `nums[mid] > nums[hi]` ise "kırılma noktası" nerededir?
- `nums[mid] > nums[hi]` ise minimum kesinlikle `mid`'in sağındadır; değilse minimum `mid` ya da solundadır.

## Çözüm

### Sağ uçla karşılaştırarak ikili arama

Dizi, sıralı iki parçadan oluşur ve sağ parçanın bütün elemanları sol parçanınkilerden küçüktür. `lo = 0`, `hi = n - 1` ile başlarız:

- `nums[mid] > nums[hi]` ise `mid` sol (büyük) parçadadır ve aradaki bir yerde düşüş vardır. Minimum `mid`'in **sağındadır**: `lo = mid + 1`.
- Değilse `mid`'den `hi`'ye kadar aralık artan sıradadır; minimum `mid` olabilir ya da daha soldadır: `hi = mid`.

`lo == hi` olduğunda aralık tek elemana iner ve bu eleman minimumdur. Dizi hiç döndürülmemişse ikinci kural hep çalışır ve `lo` başta kalır.

```csharp solution
public class Solution
{
    public int FindMin(int[] nums)
    {
        var lo = 0;
        var hi = nums.Length - 1;

        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (nums[mid] > nums[hi])
            {
                lo = mid + 1;
            }
            else
            {
                hi = mid;
            }
        }

        return nums[lo];
    }
}
```

```typescript solution
function findMin(nums: number[]): number {
  let lo = 0;
  let hi = nums.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] > nums[hi]) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return nums[lo];
}
```

### Karmaşıklık

- **Zaman:** O(log n). Her adımda aralık yarıya iner.
- **Alan:** O(1).

`nums[lo]` yerine `nums[hi]` ile karşılaştırmak bilinçli bir seçimdir: hiç döndürülmemiş dizide `nums[mid] > nums[lo]` her zaman doğrudur ve sol uçla karşılaştırma yanlış yöne götürür.

## Testler

```json
[
  { "args": [[3, 4, 5, 1, 2]], "expected": 1, "sample": true },
  { "args": [[4, 5, 6, 7, 0, 1, 2]], "expected": 0, "sample": true },
  { "args": [[11, 13, 15, 17]], "expected": 11, "sample": true },
  { "args": [[1]], "expected": 1 },
  { "args": [[2, 1]], "expected": 1 },
  { "args": [[5, 1, 2, 3, 4]], "expected": 1 },
  { "args": [[2, 3, 4, 5, 1]], "expected": 1 },
  { "args": [[-2, 0, 3, -5000, -4000, -3000]], "expected": -5000 }
]
```
