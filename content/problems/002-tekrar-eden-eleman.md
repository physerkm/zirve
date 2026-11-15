---
title: Tekrar Eden Eleman
difficulty: easy
tags: [dizi, hash-tablosu]
function: containsDuplicate
params:
  - { name: nums, type: "int[]" }
returns: "bool"
---
Bir tam sayı dizisi `nums` veriliyor. Herhangi bir değer dizide **en az iki kez** geçiyorsa `true`, bütün elemanlar birbirinden farklıysa `false` döndürün.

### Örnek 1

```text
Girdi:  nums = [1, 2, 3, 1]
Çıktı:  true
```

### Örnek 2

```text
Girdi:  nums = [1, 2, 3, 4]
Çıktı:  false
```

### Kısıtlar

- `1 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## İpuçları

- Bütün çiftleri karşılaştırmak O(n²) sürer. Bir değeri daha önce görüp görmediğinizi O(1)'de yanıtlayabilir misiniz?
- Gördüğünüz değerleri bir kümede (`HashSet` / `Set`) tutun.

## Çözüm

Diziyi bir kez gezeriz ve gördüğümüz her değeri bir kümeye ekleriz. Bir değer kümede zaten varsa tekrar bulunmuştur ve hemen `true` döneriz.

```csharp solution
public class Solution
{
    public bool ContainsDuplicate(int[] nums)
    {
        var seen = new HashSet<int>();

        foreach (var n in nums)
        {
            // Add, eleman zaten varsa false döndürür.
            if (!seen.Add(n)) return true;
        }

        return false;
    }
}
```

```typescript solution
function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();

  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }

  return false;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her eleman için sabit zamanlı bir küme işlemi.
- **Alan:** O(n).

**Alternatif:** Diziyi sıralayıp komşu elemanları karşılaştırmak O(n log n) zaman ve (yerinde sıralamayla) O(1) ek alan kullanır. Bellek kısıtlıysa tercih edilebilir; ödünleşimi mülakatta söyleyin.

## Testler

```json
[
  { "args": [[1, 2, 3, 1]], "expected": true, "sample": true },
  { "args": [[1, 2, 3, 4]], "expected": false, "sample": true },
  { "args": [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], "expected": true, "sample": true },
  { "args": [[7]], "expected": false },
  { "args": [[-1, -1]], "expected": true },
  { "args": [[0, 1000000000, -1000000000]], "expected": false },
  { "args": [[5, 4, 3, 2, 1, 5]], "expected": true }
]
```
