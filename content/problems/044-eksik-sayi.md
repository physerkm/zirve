---
title: Eksik Sayı
difficulty: easy
tags: [dizi, matematik]
function: missingNumber
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
`n` elemanlı bir dizi `nums` veriliyor. Dizi, `[0, n]` aralığındaki sayılardan **birbirinden farklı** `n` tanesini içerir. Bu aralıkta olup dizide **bulunmayan** tek sayıyı döndürün.

### Örnek 1

```text
Girdi:  nums = [3, 0, 1]
Çıktı:  2
Açıklama: n = 3 olduğundan sayılar [0, 3] aralığındadır. Dizide 2 yoktur.
```

### Örnek 2

```text
Girdi:  nums = [0, 1]
Çıktı:  2
```

### Örnek 3

```text
Girdi:  nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]
Çıktı:  8
```

### Kısıtlar

- `1 <= n <= 10^4`
- `0 <= nums[i] <= n`
- Bütün elemanlar birbirinden farklıdır.

**Devam sorusu:** O(n) zaman ve O(1) ek bellekle çözebilir misiniz?

## İpuçları

- Sıralamak ya da bir küme kullanmak işe yarar ama daha fazla zaman ya da bellek ister.
- Hiçbir sayı eksik olmasaydı dizinin toplamı ne olurdu? `0 + 1 + … + n` için kapalı bir formül vardır.
- Olması gereken toplam ile gerçek toplam arasındaki fark size ne söyler?

## Çözüm

Dizide `0`'dan `n`'ye kadar olan sayılardan tam biri eksik; `n` de dizinin uzunluğudur.

Hiçbir sayı eksik olmasaydı toplam `0 + 1 + … + n = n · (n + 1) / 2` olurdu (Gauss formülü). Dizideki sayıları toplayıp bu değerden çıkarırsak diğer bütün sayılar iki toplamda da bulunduğu için birbirini götürür; geriye yalnızca eksik sayı kalır.

`n` en fazla 10.000 olduğundan beklenen toplam en fazla 50.005.000'dir ve `int`'e rahatça sığar; taşma endişesi yoktur.

```csharp solution
public class Solution
{
    public int MissingNumber(int[] nums)
    {
        // nums, 0..n sayılarından biri eksik olacak biçimde verilir; n dizinin uzunluğudur.
        int n = nums.Length;

        // Hiçbiri eksik olmasaydı toplam 0 + 1 + ... + n = n * (n + 1) / 2 olurdu.
        // n en fazla 10.000 olduğundan bu en fazla 50.005.000'dir ve int'e sığar.
        int expectedSum = n * (n + 1) / 2;

        int actualSum = 0;
        foreach (int num in nums)
        {
            actualSum += num;
        }

        // Diğer her sayı iki toplamda da vardır ve birbirini götürür; geriye yalnızca eksik olan kalır.
        return expectedSum - actualSum;
    }
}
```

```typescript solution
function missingNumber(nums: number[]): number {
  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;

  let actualSum = 0;
  for (const num of nums) {
    actualSum += num;
  }

  return expectedSum - actualSum;
}
```

### Karmaşıklık

- **Zaman:** O(n), tek geçiş.
- **Alan:** O(1).

**Alternatif (XOR):** `0..n` arasındaki bütün sayıları ve dizideki bütün elemanları birbiriyle XOR'layın. Aynı sayı iki kez XOR'lanınca kendini götürür (`x ^ x = 0`); geriye eksik sayı kalır. Bu yöntem hiç toplama yapmadığı için `n` çok büyük olsa bile taşma riski taşımaz.

## Testler

```json
[
  { "args": [[3, 0, 1]], "expected": 2, "sample": true },
  { "args": [[0, 1]], "expected": 2, "sample": true },
  { "args": [[9, 6, 4, 2, 3, 5, 7, 0, 1]], "expected": 8, "sample": true },
  { "args": [[0]], "expected": 1 },
  { "args": [[1]], "expected": 0 },
  { "args": [[1, 2, 3]], "expected": 0 },
  { "args": [[0, 2]], "expected": 1 },
  { "args": [[4, 3, 2, 1, 0, 6]], "expected": 5 }
]
```
