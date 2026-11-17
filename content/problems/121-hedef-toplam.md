---
title: Hedef Toplam
difficulty: medium
tags: [dinamik-programlama, geri-izleme, dizi]
function: findTargetSumWays
params:
  - { name: nums, type: "int[]" }
  - { name: target, type: "int" }
returns: "int"
---
Bir tam sayı dizisi `nums` ve bir tam sayı `target` veriliyor. Her sayının önüne `+` ya da `-` koyup hepsini sırayla birleştirerek bir ifade kuruyorsunuz. Örneğin `nums = [2, 1]` için `+2-1` ifadesi kurulabilir.

Değeri `target`'a eşit olan **farklı ifadelerin sayısını** döndürün.

### Örnek 1

```text
Girdi:  nums = [1, 1, 1, 1, 1], target = 3
Çıktı:  5
Açıklama: -1+1+1+1+1, +1-1+1+1+1, +1+1-1+1+1, +1+1+1-1+1, +1+1+1+1-1
```

### Örnek 2

```text
Girdi:  nums = [1], target = 1
Çıktı:  1
```

### Kısıtlar

- `1 <= nums.length <= 20`
- `0 <= nums[i] <= 1000`
- `0 <= sum(nums) <= 1000`
- `-1000 <= target <= 1000`

## İpuçları

- Her sayı için iki seçenek var: `2^n` ifadeyi denemek `n = 20` için bile mümkün ama yavaş. Aynı ara toplamlara tekrar tekrar ulaşıldığını fark edin.
- `+` alan sayıların kümesi `P`, `-` alanlarınki `N` olsun. `P - N = target` ve `P + N = sum`. Buradan `P = (sum + target) / 2`.
- Problem, toplamı `(sum + target) / 2` olan **alt küme sayısına** dönüşür: 0/1 sırt çantasıyla sayılır.

## Çözüm

### Alt küme toplamına dönüştürme

`+` işaretli sayıların toplamı `P`, `-` işaretlilerinki `N` olsun. `P - N = target` ve `P + N = sum` denklemlerini toplarsak `P = (sum + target) / 2` buluruz. Yani her geçerli ifade, toplamı bu değer olan **tek bir** alt kümeye karşılık gelir.

`|target| > sum` ise ya da `sum + target` tekse cevap `0`'dır. Aksi halde `dp[t]`, toplamı `t` olan alt küme sayısıdır: `dp[0] = 1` ve her `x` için `t` **azalarak** `dp[t] += dp[t - x]`. Sıfır değerli elemanlar da doğru sayılır: her biri her alt kümeyi ikiye katlar.

```csharp solution
public class Solution
{
    public int FindTargetSumWays(int[] nums, int target)
    {
        var sum = nums.Sum();
        if (Math.Abs(target) > sum || (sum + target) % 2 != 0)
        {
            return 0;
        }

        var goal = (sum + target) / 2;
        var dp = new int[goal + 1];
        dp[0] = 1;

        foreach (var x in nums)
        {
            for (var t = goal; t >= x; t--)
            {
                dp[t] += dp[t - x];
            }
        }

        return dp[goal];
    }
}
```

```typescript solution
function findTargetSumWays(nums: number[], target: number): number {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > sum || (sum + target) % 2 !== 0) return 0;

  const goal = (sum + target) / 2;
  const dp = new Array<number>(goal + 1).fill(0);
  dp[0] = 1;

  for (const x of nums) {
    for (let t = goal; t >= x; t--) {
      dp[t] += dp[t - x];
    }
  }

  return dp[goal];
}
```

### Karmaşıklık

- **Zaman:** O(n × sum).
- **Alan:** O(sum).

Dönüşümü görmeden de çözülür: `ara toplam → yol sayısı` sözlüğüyle her sayıda toplamları `±x` kaydırmak O(n × sum) sürer. Matematiksel dönüşüm ise kodu klasik bir alt küme sayımına indirger.

## Testler

```json
[
  { "args": [[1, 1, 1, 1, 1], 3], "expected": 5, "sample": true },
  { "args": [[1], 1], "expected": 1, "sample": true },
  { "args": [[1], 2], "expected": 0 },
  { "args": [[0, 0, 0, 0, 0, 0, 0, 0, 1], 1], "expected": 256 },
  { "args": [[1, 2, 1], 0], "expected": 2 },
  { "args": [[2, 3, 5], 0], "expected": 2 },
  { "args": [[100], -200], "expected": 0 },
  { "args": [[7, 9], -2], "expected": 1 }
]
```
