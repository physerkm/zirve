---
title: Üç Sayının Toplamı
difficulty: medium
tags: [dizi, iki-isaretci, siralama]
function: threeSum
params:
  - { name: nums, type: "int[]" }
returns: "List<List<int>>"
compare: unordered-nested
---
Bir tam sayı dizisi `nums` veriliyor. Toplamı **sıfır** olan bütün üçlüleri `[nums[i], nums[j], nums[k]]` döndürün; `i`, `j` ve `k` birbirinden farklı indeksler olmalıdır.

Sonuçta **aynı üçlü birden fazla kez yer almamalıdır**. Üçlüleri ve üçlü içindeki sayıları istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  nums = [-1, 0, 1, 2, -1, -4]
Çıktı:  [[-1, -1, 2], [-1, 0, 1]]
```

### Örnek 2

```text
Girdi:  nums = [0, 1, 1]
Çıktı:  []
```

### Örnek 3

```text
Girdi:  nums = [0, 0, 0]
Çıktı:  [[0, 0, 0]]
```

### Kısıtlar

- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`

## İpuçları

- Bütün üçlüleri denemek O(n³)'tür. Bir sayıyı sabitlerseniz geriye "toplamı belirli bir değer olan iki sayı" problemi kalır.
- Diziyi sıralarsanız, kalan iki sayıyı karşıdan yaklaşan iki işaretçiyle O(n)'de bulabilirsiniz.
- Tekrar eden üçlülerden kaçınmak için, sıralı dizide aynı değeri ikinci kez sabitlemeyin ve bir çift bulduktan sonra eş değerleri atlayın.

## Çözüm

Diziyi sıralarız. Her `i` için `nums[i]` değerini sabitler, geri kalan kısımda toplamı `-nums[i]` olan iki sayıyı iki işaretçiyle ararız: toplam küçükse sol işaretçiyi, büyükse sağ işaretçiyi ilerletiriz.

Tekrarları önlemenin iki noktası vardır:

1. Sabitlenen değer bir öncekiyle aynıysa atlanır; aynı üçlüleri yeniden üretirdi.
2. Bir üçlü bulunduktan sonra sol işaretçi, aynı değerdeki elemanların sonuna kadar ilerletilir.

Sıralı dizide sabitlenen değer pozitifse aramayı kesebiliriz: sağındaki bütün sayılar da pozitiftir ve toplam sıfır olamaz.

```csharp solution
public class Solution
{
    public IList<IList<int>> ThreeSum(int[] nums)
    {
        Array.Sort(nums);
        var result = new List<IList<int>>();

        for (var i = 0; i < nums.Length - 2; i++)
        {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;

            var left = i + 1;
            var right = nums.Length - 1;

            while (left < right)
            {
                var sum = nums[i] + nums[left] + nums[right];

                if (sum < 0)
                {
                    left++;
                }
                else if (sum > 0)
                {
                    right--;
                }
                else
                {
                    result.Add(new List<int> { nums[i], nums[left], nums[right] });
                    left++;
                    right--;
                    while (left < right && nums[left] == nums[left - 1]) left++;
                }
            }
        }

        return result;
    }
}
```

```typescript solution
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        result.push([nums[i], nums[left], nums[right]]);
        left++;
        right--;
        while (left < right && nums[left] === nums[left - 1]) left++;
      }
    }
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n²). Sıralama O(n log n); her sabit eleman için iki işaretçi O(n).
- **Alan:** Sıralamanın kullandığı alan dışında O(1) (çıktı hariç).

JavaScript'te `sort()` varsayılan olarak elemanları **dizgi** gibi karşılaştırır (`[10, 9, 1]` → `[1, 10, 9]`). Sayıları sıralarken karşılaştırma fonksiyonunu mutlaka verin.

## Testler

```json
[
  { "args": [[-1, 0, 1, 2, -1, -4]], "expected": [[-1, -1, 2], [-1, 0, 1]], "sample": true },
  { "args": [[0, 1, 1]], "expected": [], "sample": true },
  { "args": [[0, 0, 0]], "expected": [[0, 0, 0]], "sample": true },
  { "args": [[0, 0, 0, 0]], "expected": [[0, 0, 0]] },
  { "args": [[-2, 0, 1, 1, 2]], "expected": [[-2, 0, 2], [-2, 1, 1]] },
  { "args": [[1, 2, 3]], "expected": [] },
  { "args": [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]], "expected": [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]] },
  { "args": [[3, -2, 1, 0]], "expected": [] },
  { "args": [[-1, -1, -1, 2, 2]], "expected": [[-1, -1, 2]] }
]
```
