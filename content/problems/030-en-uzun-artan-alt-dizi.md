---
title: En Uzun Artan Alt Dizi
difficulty: medium
tags: [dinamik-programlama, ikili-arama, dizi]
function: lengthOfLIS
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
Bir tam sayı dizisi `nums` veriliyor. **Kesin artan** en uzun alt dizinin (subsequence) uzunluğunu döndürün.

Alt dizi, bazı elemanlar silinerek (ya da hiç silinmeden) ve kalanların sırası korunarak elde edilir. Örneğin `[3, 6, 2, 7]`, `[0, 3, 1, 6, 2, 2, 7]` dizisinin bir alt dizisidir.

### Örnek 1

```text
Girdi:  nums = [10, 9, 2, 5, 3, 7, 101, 18]
Çıktı:  4
Açıklama: En uzun artan alt dizilerden biri [2, 3, 7, 101].
```

### Örnek 2

```text
Girdi:  nums = [0, 1, 0, 3, 2, 3]
Çıktı:  4
```

### Örnek 3

```text
Girdi:  nums = [7, 7, 7, 7, 7, 7, 7]
Çıktı:  1
```

### Kısıtlar

- `1 <= nums.length <= 2500`
- `-10^4 <= nums[i] <= 10^4`

**Devam sorusu:** O(n log n) zamanda çözebilir misiniz?

## İpuçları

- `dp[i]`: `nums[i]` ile **biten** en uzun artan alt dizinin uzunluğu. `dp[i] = 1 + max(dp[j])`, `j < i` ve `nums[j] < nums[i]`. Bu O(n²) sürer.
- O(n log n) için: `tails[k]`, uzunluğu `k + 1` olan artan alt dizilerin alabileceği **en küçük son eleman** olsun. Bu dizi her zaman artan sıradadır.
- Her yeni sayı için `tails` içinde ondan büyük ya da eşit ilk elemanı ikili aramayla bulun ve yerine yazın; yoksa sona ekleyin.

## Çözüm

### Sabır sıralaması (tails dizisi)

`tails[k]`, uzunluğu `k + 1` olan bütün artan alt diziler arasında **en küçük son elemanı** tutar. Küçük bir son eleman, ileride daha fazla sayının eklenebilmesi demektir; bu yüzden her uzunluk için en "umut verici" diziyi saklarız.

Her `x` için:

- `x`, `tails`'teki bütün elemanlardan büyükse en uzun diziyi bir uzatır: sona eklenir.
- Değilse `x`'ten büyük ya da eşit **ilk** `tails[k]` bulunur ve `x` ile değiştirilir: uzunluğu `k + 1` olan bir dizi artık daha küçük bir sayıyla bitebilir.

`tails` artan sırada kaldığı için arama ikili aramayla yapılır. Sonunda `tails`'in uzunluğu cevaptır. (`tails`'in kendisi gerçek bir alt dizi olmak zorunda değildir.)

```csharp solution
public class Solution
{
    public int LengthOfLIS(int[] nums)
    {
        var tails = new List<int>();
        foreach (var x in nums)
        {
            var lo = 0;
            var hi = tails.Count;
            while (lo < hi)
            {
                var mid = (lo + hi) / 2;
                if (tails[mid] < x)
                {
                    lo = mid + 1;
                }
                else
                {
                    hi = mid;
                }
            }

            if (lo == tails.Count)
            {
                tails.Add(x);
            }
            else
            {
                tails[lo] = x;
            }
        }

        return tails.Count;
    }
}
```

```typescript solution
function lengthOfLIS(nums: number[]): number {
  const tails: number[] = [];
  for (const x of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }

    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }

  return tails.length;
}
```

### Karmaşıklık

- **Zaman:** O(n log n).
- **Alan:** O(n).

Mülakatta önce O(n²) DP'yi kurup ardından `tails` iyileştirmesine geçmek iyi bir akıştır. "Büyük ya da eşit" ilk elemanı aramak, **kesin** artan koşulu sağlar; eşit elemanlar diziyi uzatmaz.

## Testler

```json
[
  { "args": [[10, 9, 2, 5, 3, 7, 101, 18]], "expected": 4, "sample": true },
  { "args": [[0, 1, 0, 3, 2, 3]], "expected": 4, "sample": true },
  { "args": [[7, 7, 7, 7, 7, 7, 7]], "expected": 1, "sample": true },
  { "args": [[1]], "expected": 1 },
  { "args": [[5, 4, 3, 2, 1]], "expected": 1 },
  { "args": [[1, 3, 6, 7, 9, 4, 10, 5, 6]], "expected": 6 },
  { "args": [[4, 10, 4, 3, 8, 9]], "expected": 3 }
]
```
