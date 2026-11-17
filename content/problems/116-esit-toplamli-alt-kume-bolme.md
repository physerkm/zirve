---
title: Eşit Toplamlı Alt Kümelere Bölme
difficulty: medium
tags: [dinamik-programlama, dizi]
function: canPartition
params:
  - { name: nums, type: "int[]" }
returns: "bool"
---
Pozitif tam sayılardan oluşan bir dizi `nums` veriliyor. Diziyi, eleman toplamları **eşit** olan iki alt kümeye bölmek mümkünse `true`, değilse `false` döndürün.

### Örnek 1

```text
Girdi:  nums = [1, 5, 11, 5]
Çıktı:  true
Açıklama: [1, 5, 5] ve [11].
```

### Örnek 2

```text
Girdi:  nums = [1, 2, 3, 5]
Çıktı:  false
```

### Kısıtlar

- `1 <= nums.length <= 200`
- `1 <= nums[i] <= 100`

## İpuçları

- Toplam tekse cevap hemen `false`'tur. Çiftse soru şuna dönüşür: toplamı `sum / 2` olan bir alt küme var mı?
- Bu bir 0/1 sırt çantası problemidir: her eleman ya seçilir ya seçilmez.
- `dp[t]`: şimdiye kadar bakılan elemanlarla `t` toplamı oluşturulabiliyor mu? Her eleman için `t`'yi **büyükten küçüğe** gezin ki aynı eleman iki kez kullanılmasın.

## Çözüm

### 0/1 sırt çantası, tek boyutlu tablo

`target = sum / 2` olsun. `dp[t]`, o ana kadar işlenen elemanların bir alt kümesiyle `t` toplamına ulaşılabiliyorsa `true`'dur. Başlangıçta yalnızca `dp[0] = true` (boş küme).

Her `x` elemanı için `t = target .. x` aralığında, **azalan** sırayla `dp[t] = dp[t] || dp[t - x]`. Azalan sıra önemlidir: `dp[t - x]` henüz bu turda güncellenmemiştir, yani `x` en fazla bir kez kullanılır. `dp[target]` `true` olursa erkenden dönebiliriz.

```csharp solution
public class Solution
{
    public bool CanPartition(int[] nums)
    {
        var sum = nums.Sum();
        if (sum % 2 != 0)
        {
            return false;
        }

        var target = sum / 2;
        var dp = new bool[target + 1];
        dp[0] = true;

        foreach (var x in nums)
        {
            for (var t = target; t >= x; t--)
            {
                dp[t] = dp[t] || dp[t - x];
            }

            if (dp[target])
            {
                return true;
            }
        }

        return dp[target];
    }
}
```

```typescript solution
function canPartition(nums: number[]): boolean {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;

  const target = sum / 2;
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;

  for (const x of nums) {
    for (let t = target; t >= x; t--) {
      dp[t] = dp[t] || dp[t - x];
    }
    if (dp[target]) return true;
  }

  return dp[target];
}
```

### Karmaşıklık

- **Zaman:** O(n × target). En fazla 200 × 10.000.
- **Alan:** O(target).

## Testler

```json
[
  { "args": [[1, 5, 11, 5]], "expected": true, "sample": true },
  { "args": [[1, 2, 3, 5]], "expected": false, "sample": true },
  { "args": [[1, 1]], "expected": true },
  { "args": [[1]], "expected": false },
  { "args": [[2, 2, 3, 5]], "expected": false },
  { "args": [[3, 3, 3, 4, 5]], "expected": true },
  { "args": [[100, 100, 100, 100, 100, 100, 100, 100]], "expected": true }
]
```
