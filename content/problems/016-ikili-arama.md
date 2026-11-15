---
title: İkili Arama
difficulty: easy
tags: [ikili-arama, dizi]
function: search
params:
  - { name: nums, type: "int[]" }
  - { name: target, type: "int" }
returns: "int"
---
Artan sırada sıralanmış ve elemanları birbirinden farklı bir tam sayı dizisi `nums` ile bir `target` değeri veriliyor. `target` dizide varsa **indeksini**, yoksa `-1` döndürün.

Çözümünüz **O(log n)** zamanda çalışmalıdır.

### Örnek 1

```text
Girdi:  nums = [-1, 0, 3, 5, 9, 12], target = 9
Çıktı:  4
```

### Örnek 2

```text
Girdi:  nums = [-1, 0, 3, 5, 9, 12], target = 2
Çıktı:  -1
```

### Kısıtlar

- `1 <= nums.length <= 10^4`
- `nums` artan sıradadır ve bütün elemanları farklıdır.

## İpuçları

- Dizi sıralı olduğu için ortadaki elemana bakarak hedefin hangi yarıda olduğunu söyleyebilirsiniz.
- Arama aralığını `[left, right]` olarak tutun ve her adımda yarıya indirin.
- `mid` değerini aralıktan çıkarmayı unutmayın (`mid + 1` / `mid - 1`); aksi halde sonsuz döngüye girersiniz.

## Çözüm

Kapalı aralık `[left, right]` üzerinde çalışırız. Ortadaki eleman hedefe eşitse indeksi döndürürüz; hedeften küçükse hedef sağ yarıdadır, büyükse sol yarıdadır. Aralık boşaldığında (`left > right`) hedef dizide yoktur.

```csharp solution
public class Solution
{
    public int Search(int[] nums, int target)
    {
        var left = 0;
        var right = nums.Length - 1;

        while (left <= right)
        {
            var mid = left + (right - left) / 2;

            if (nums[mid] == target) return mid;

            if (nums[mid] < target)
            {
                left = mid + 1;
            }
            else
            {
                right = mid - 1;
            }
        }

        return -1;
    }
}
```

```typescript solution
function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) return mid;

    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
```

### Karmaşıklık

- **Zaman:** O(log n). Her adımda aralık yarılanır.
- **Alan:** O(1).

`left + (right - left) / 2` biçimi, `(left + right) / 2` ifadesinin büyük dizilerde yol açabileceği tam sayı taşmasını önler. JavaScript'te bölme ondalıklı sonuç verdiği için `Math.floor` gerekir.

## Testler

```json
[
  { "args": [[-1, 0, 3, 5, 9, 12], 9], "expected": 4, "sample": true },
  { "args": [[-1, 0, 3, 5, 9, 12], 2], "expected": -1, "sample": true },
  { "args": [[5], 5], "expected": 0 },
  { "args": [[5], -5], "expected": -1 },
  { "args": [[1, 3], 1], "expected": 0 },
  { "args": [[1, 3], 3], "expected": 1 },
  { "args": [[1, 3], 2], "expected": -1 },
  { "args": [[-1, 0, 3, 5, 9, 12], -1], "expected": 0 },
  { "args": [[-1, 0, 3, 5, 9, 12], 12], "expected": 5 },
  { "args": [[-1, 0, 3, 5, 9, 12], 13], "expected": -1 }
]
```
