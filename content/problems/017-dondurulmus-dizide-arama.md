---
title: Döndürülmüş Sıralı Dizide Arama
difficulty: medium
tags: [dizi, ikili-arama]
function: search
params:
  - { name: nums, type: "int[]" }
  - { name: target, type: "int" }
returns: "int"
---
Artan sırada sıralı ve **elemanları birbirinden farklı** bir dizi, bilinmeyen bir `k` indeksinden döndürülmüş olarak veriliyor: `[nums[k], ..., nums[n-1], nums[0], ..., nums[k-1]]`. Örneğin `[0, 1, 2, 4, 5, 6, 7]`, 3. indeksten döndürülünce `[4, 5, 6, 7, 0, 1, 2]` olur.

`target` dizide varsa indeksini, yoksa `-1` döndürün. Algoritmanız `O(log n)` zamanda çalışmalıdır.

### Örnek 1

```text
Girdi:  nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Çıktı:  4
```

### Örnek 2

```text
Girdi:  nums = [4, 5, 6, 7, 0, 1, 2], target = 3
Çıktı:  -1
```

### Örnek 3

```text
Girdi:  nums = [1], target = 0
Çıktı:  -1
```

### Kısıtlar

- `1 <= nums.length <= 5000`
- `-10^4 <= nums[i], target <= 10^4`
- Bütün elemanlar birbirinden farklıdır.
- `nums` sıralı bir dizinin döndürülmüş halidir (hiç döndürülmemiş de olabilir).

## İpuçları

- Diziyi ortadan ikiye bölün. İki yarıdan **en az biri** mutlaka düzgün sıralıdır. Neden?
- Sıralı yarıyı `nums[lo] <= nums[mid]` karşılaştırmasıyla bulabilirsiniz.
- Hedefin sıralı yarının sınırları içinde olup olmadığı kolayca sınanır. İçindeyse oraya, değilse diğer yarıya gidin.

## Çözüm

### Sıralı yarıyı bularak ikili arama

Döndürülmüş dizide kırılma noktası tektir. `mid` ile ikiye bölünen aralığın kırılmayı içermeyen yarısı düzgün sıralıdır:

- `nums[lo] <= nums[mid]` ise **sol yarı** `[lo, mid]` sıralıdır. Hedef `nums[lo] <= target < nums[mid]` aralığındaysa sola (`hi = mid - 1`), değilse sağa (`lo = mid + 1`) gideriz.
- Değilse **sağ yarı** `[mid, hi]` sıralıdır. Hedef `nums[mid] < target <= nums[hi]` aralığındaysa sağa, değilse sola gideriz.

Sıralı bir yarıda "hedef burada mı?" sorusu yalnızca iki uca bakarak yanıtlanır. Diğer yarı karışık olsa bile bir sonraki adımda yine ikiye bölünür.

```csharp solution
public class Solution
{
    public int Search(int[] nums, int target)
    {
        var lo = 0;
        var hi = nums.Length - 1;

        while (lo <= hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (nums[mid] == target)
            {
                return mid;
            }

            if (nums[lo] <= nums[mid])
            {
                if (nums[lo] <= target && target < nums[mid])
                {
                    hi = mid - 1;
                }
                else
                {
                    lo = mid + 1;
                }
            }
            else
            {
                if (nums[mid] < target && target <= nums[hi])
                {
                    lo = mid + 1;
                }
                else
                {
                    hi = mid - 1;
                }
            }
        }

        return -1;
    }
}
```

```typescript solution
function search(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) {
      return mid;
    }

    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[hi]) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
  }

  return -1;
}
```

### Karmaşıklık

- **Zaman:** O(log n).
- **Alan:** O(1).

`nums[lo] <= nums[mid]` karşılaştırmasındaki eşitlik, `lo == mid` olduğu iki elemanlı aralıklar için gereklidir; o durumda sol "yarı" tek elemandır ve sıralı sayılır.

## Testler

```json
[
  { "args": [[4, 5, 6, 7, 0, 1, 2], 0], "expected": 4, "sample": true },
  { "args": [[4, 5, 6, 7, 0, 1, 2], 3], "expected": -1, "sample": true },
  { "args": [[1], 0], "expected": -1, "sample": true },
  { "args": [[1], 1], "expected": 0 },
  { "args": [[3, 1], 1], "expected": 1 },
  { "args": [[5, 1, 3], 5], "expected": 0 },
  { "args": [[4, 5, 6, 7, 8, 1, 2, 3], 8], "expected": 4 },
  { "args": [[1, 3], 3], "expected": 1 },
  { "args": [[6, 7, 1, 2, 3, 4, 5], 6], "expected": 0 },
  { "args": [[1, 2, 3, 4, 5, 6], 4], "expected": 3 }
]
```
