---
title: Tek Olan Sayı
difficulty: easy
tags: [bit-islemleri, dizi]
function: singleNumber
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
Boş olmayan bir tam sayı dizisi `nums` veriliyor. Bu dizideki bir eleman hariç **tüm elemanlar tam olarak iki kez** yer almaktadır. Yalnızca **bir kez** geçen o tek elemanı bulun ve döndürün.

Çözümünüz **doğrusal zaman karmaşıklığına** (`O(n)`) sahip olmalı ve yalnızca **sabit ek bellek** (`O(1)`) kullanmalıdır.

### Örnek 1

```text
Girdi:  nums = [2, 2, 1]
Çıktı:  1
Açıklama: 2 sayısı iki kez geçerken 1 sayısı yalnızca bir kez geçer.
```

### Örnek 2

```text
Girdi:  nums = [4, 1, 2, 1, 2]
Çıktı:  4
Açıklama: 1 ve 2 sayıları ikişer kez geçer; tek kalan sayı 4'tür.
```

### Örnek 3

```text
Girdi:  nums = [1]
Çıktı:  1
```

### Kısıtlar

- `1 <= nums.length <= 3 * 10^4`
- `-3 * 10^4 <= nums[i] <= 3 * 10^4`
- Dizideki bir eleman hariç her eleman tam olarak iki kez görünür.

## İpuçları

- Bir küme (`HashSet`) veya tablo (`Dictionary`) kullanarak elemanların kaç kez geçtiğini sayabilirsiniz; ancak bu `O(n)` ek bellek gerektirir.
- Sabit bellek (`O(1)`) kısıtını sağlamak için bit düzeyinde (bitwise) işlemleri düşünün.
- Bit düzeyinde XOR (`^`) işleminin iki temel özelliğini hatırlayın: `a ^ a = 0` ve `a ^ 0 = a`.
- XOR işlemi değişme ve birleşme özelliğine sahiptir; dolayısıyla sayıların dizide hangi sırada durduğu sonucu değiştirmez.

## Çözüm

Bu problemi sabit bellekte çözmenin anahtarı bit düzeyinde **XOR (`^`)** operatörüdür. XOR işlemi, karşılıklı iki bit birbirinden farklıysa `1`, aynıysa `0` üretir. Bu kuraldan üç önemli özellik doğar:

1. **Bir sayının kendisiyle XOR'u sıfırdır:** `a ^ a = 0` (çünkü tüm bitleri aynıdır).
2. **Bir sayının sıfırla XOR'u kendisidir:** `a ^ 0 = a`.
3. **Sıra önemsizdir (değişme ve birleşme özelliği):** `a ^ b ^ a = (a ^ a) ^ b = 0 ^ b = b`.

Başlangıçta `result = 0` alır ve dizideki tüm sayıları sırayla `result` ile XOR'larız. İki kez geçen her sayı, aralarında başka sayılar olsa bile sonunda birbirini sıfırlar (`x ^ x = 0`). Çiftlerin tamamı `0`'a dönüştüğünde geriye yalnızca bir kez geçen sayı (`0 ^ tek = tek`) kalır.

```csharp solution
public class Solution
{
    public int SingleNumber(int[] nums)
    {
        int result = 0;

        foreach (int num in nums)
        {
            // Çift olan sayılar birbirini sıfırlar (a ^ a = 0), tek olan kalır.
            result ^= num;
        }

        return result;
    }
}
```

```typescript solution
function singleNumber(nums: number[]): number {
  let result = 0;

  for (const num of nums) {
    result ^= num;
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** `O(n)`. Dizideki her elemana yalnızca bir kez bakılır ve her adımda sabit zamanlı (`O(1)`) XOR işlemi yapılır.
- **Alan:** `O(1)`. Girdi boyutu ne olursa olsun yalnızca tek bir tam sayı değişkeni (`result`) kullanılır.

## Testler

```json
[
  { "args": [[2, 2, 1]], "expected": 1, "sample": true },
  { "args": [[4, 1, 2, 1, 2]], "expected": 4, "sample": true },
  { "args": [[1]], "expected": 1, "sample": true },
  { "args": [[-1, -1, -2]], "expected": -2 },
  { "args": [[0, 7, 0, 9, 7]], "expected": 9 },
  { "args": [[10, 20, 30, 20, 10, 40, 30]], "expected": 40 },
  { "args": [[-5, 3, -5, 8, 3]], "expected": 8 }
]
```
