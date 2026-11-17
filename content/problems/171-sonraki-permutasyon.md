---
title: Sonraki Permütasyon
difficulty: medium
tags: [dizi, iki-isaretci]
function: nextPermutation
params:
  - { name: nums, type: "int[]" }
returns: "int[]"
---
Bir tam sayı dizisinin **sonraki permütasyonu**, elemanlarının sözlük sırasına göre bir sonraki büyük dizilişidir. Örneğin `[1, 2, 3]`'ün sonraki permütasyonu `[1, 3, 2]`, `[2, 3, 1]`'inki `[3, 1, 2]`'dir. Daha büyük bir diziliş yoksa (dizi azalan sıradaysa) dizi **en küçük** dizilişine, yani artan sıraya döner: `[3, 2, 1]` → `[1, 2, 3]`.

`nums` dizisini sonraki permütasyonuna **yerinde** dönüştürün ve testlerin görebilmesi için diziyi döndürün. Yalnızca sabit ek alan kullanın.

### Örnek 1

```text
Girdi:  nums = [1, 2, 3]
Çıktı:  [1, 3, 2]
```

### Örnek 2

```text
Girdi:  nums = [3, 2, 1]
Çıktı:  [1, 2, 3]
```

### Örnek 3

```text
Girdi:  nums = [1, 1, 5]
Çıktı:  [1, 5, 1]
```

### Kısıtlar

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 100`

## İpuçları

- Sağdan bakın: azalan sıradaki en uzun **son ek**, kendi içinde zaten en büyük dizilişindedir. Değiştirilmesi gereken, bu son ekin hemen solundaki elemandır.
- O elemanı (`nums[i]`), son ekteki ondan **büyük en küçük** elemanla değiştirin.
- Değiştirdikten sonra son ek hâlâ azalan sıradadır; onu ters çevirmek en küçük dizilişi verir.

## Çözüm

### Pivot, takas, ters çevirme

1. **Pivotu bul:** Sağdan başlayıp `nums[i] < nums[i + 1]` olan ilk `i` aranır. Bulunamazsa dizi tamamen azalandır; bütün dizi ters çevrilir.
2. **Takas:** Sağdan başlayıp `nums[j] > nums[i]` olan ilk `j` bulunur. Son ek azalan olduğu için bu, `nums[i]`'den büyük **en küçük** elemandır. `nums[i]` ile `nums[j]` yer değiştirir.
3. **Ters çevir:** `i + 1`'den sona kadar olan kısım hâlâ azalan sıradadır; ters çevrilince artan, yani en küçük diziliş olur.

Böylece dizi, yalnızca gerektiği kadar büyür: pivot konumu bir adım büyür, sağı en küçük haline iner.

```csharp solution
public class Solution
{
    public int[] NextPermutation(int[] nums)
    {
        var i = nums.Length - 2;
        while (i >= 0 && nums[i] >= nums[i + 1])
        {
            i--;
        }

        if (i >= 0)
        {
            var j = nums.Length - 1;
            while (nums[j] <= nums[i])
            {
                j--;
            }

            (nums[i], nums[j]) = (nums[j], nums[i]);
        }

        Array.Reverse(nums, i + 1, nums.Length - i - 1);
        return nums;
    }
}
```

```typescript solution
function nextPermutation(nums: number[]): number[] {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) {
    i--;
  }

  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) {
      j--;
    }
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }

  let left = i + 1;
  let right = nums.length - 1;
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }

  return nums;
}
```

### Karmaşıklık

- **Zaman:** O(n). En fazla üç doğrusal geçiş.
- **Alan:** O(1).

## Testler

```json
[
  { "args": [[1, 2, 3]], "expected": [1, 3, 2], "sample": true },
  { "args": [[3, 2, 1]], "expected": [1, 2, 3], "sample": true },
  { "args": [[1, 1, 5]], "expected": [1, 5, 1], "sample": true },
  { "args": [[1]], "expected": [1] },
  { "args": [[1, 3, 2]], "expected": [2, 1, 3] },
  { "args": [[2, 3, 1]], "expected": [3, 1, 2] },
  { "args": [[1, 5, 1]], "expected": [5, 1, 1] },
  { "args": [[5, 4, 7, 5, 3, 2]], "expected": [5, 5, 2, 3, 4, 7] }
]
```
