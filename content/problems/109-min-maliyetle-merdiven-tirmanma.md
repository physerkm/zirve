---
title: Minimum Maliyetle Merdiven Tırmanma
difficulty: easy
tags: [dinamik-programlama, dizi]
function: minCostClimbingStairs
params:
  - { name: cost, type: "int[]" }
returns: "int"
---

Size bir merdivenin basamak maliyetlerini temsil eden `cost` tam sayı dizisi veriliyor; `cost[i]`, `i`. basamağa bastığınızda ödemeniz gereken maliyettir. Maliyeti ödedikten sonra bir veya iki basamak yukarı çıkabilirsiniz.

Tırmanmaya `0` numaralı basamaktan veya `1` numaralı basamaktan başlayabilirsiniz. Merdivenin en tepesine (yani son basamağın bir ilerisine, `cost.length` konumuna) ulaşmak için gereken **minimum maliyeti** döndürün.

### Örnek 1

```text
Girdi:  cost = [10, 15, 20]
Çıktı:  15
Açıklama: 1. basamaktan başlarsınız (15 ödersiniz) ve doğrudan iki basamak çıkarak tepeye ulaşırsınız.
```

### Örnek 2

```text
Girdi:  cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]
Çıktı:  6
Açıklama: 0. basamaktan başlar, yalnızca 1 maliyetli basamaklara basarak (0 -> 2 -> 4 -> 6 -> 7 -> 9 -> tepe) toplam 6 maliyetle tepeye ulaşırsınız.
```

### Kısıtlar

- `2 <= cost.length <= 1000`
- `0 <= cost[i] <= 999`

## İpuçları

- `i`. basamağa yalnızca `i - 1` veya `i - 2` numaralı basamaktan gelebilirsiniz.
- Dolayısıyla `i`. basamağa ulaşıp onun maliyetini ödemenin en ucuz yolu: `cost[i] + min(dp[i - 1], dp[i - 2])` olur.
- Merdivenin tepesine (`n` konumuna) son basamaktan (`n - 1`) 1 adım atarak veya sondan bir önceki basamaktan (`n - 2`) 2 adım atarak ulaşabilirsiniz.
- Tüm diziyi tutmak yerine yalnızca son iki basamağın minimum maliyetini (`prev2` ve `prev1`) tutarak alanı O(1)'e düşürebilirsiniz.

## Çözüm

Her basamak için o basamağa basıp oradan devam etmeye hazır hale gelmenin minimum maliyetini hesaplayalım. Başlangıçta `0`. veya `1`. basamaktan doğrudan başlayabildiğimiz için bu iki basamağın taban maliyetleri `prev2 = cost[0]` ve `prev1 = cost[1]` olur.

`i = 2`'den `n - 1`'e kadar her basamakta:
- O basamağa gelmenin en ucuz yolu, bir önceki (`prev1`) veya iki önceki (`prev2`) basamaktan hangisi daha ucuzsa oradan zıplamaktır: `cur = cost[i] + Math.Min(prev1, prev2)`.
- Ardından pencereyi bir basamak kaydırırız: `prev2 = prev1`, `prev1 = cur`.

Döngü bittiğinde `prev1` son basamağın (`n - 1`), `prev2` ise sondan bir önceki basamağın (`n - 2`) toplam maliyetini tutar. Her iki basamaktan da tek hamlede tepeye çıkılabildiği için `Math.Min(prev1, prev2)` sonucu verir.

```csharp solution
public class Solution
{
    public int MinCostClimbingStairs(int[] cost)
    {
        int prev2 = cost[0];
        int prev1 = cost[1];

        for (int i = 2; i < cost.Length; i++)
        {
            int cur = cost[i] + Math.Min(prev1, prev2);
            prev2 = prev1;
            prev1 = cur;
        }

        return Math.Min(prev1, prev2);
    }
}
```

```typescript solution
function minCostClimbingStairs(cost: number[]): number {
  let prev2 = cost[0];
  let prev1 = cost[1];

  for (let i = 2; i < cost.length; i++) {
    const cur = cost[i] + Math.min(prev1, prev2);
    prev2 = prev1;
    prev1 = cur;
  }

  return Math.min(prev1, prev2);
}
```

### Karmaşıklık

- **Zaman:** O(n). Diziyi baştan sona tek geçişte tararız.
- **Alan:** O(1). Yalnızca son iki durumu tutan `prev2` ve `prev1` değişkenleri kullanılır.

## Testler

```json
[
  { "args": [[10, 15, 20]], "expected": 15, "sample": true },
  { "args": [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], "expected": 6, "sample": true },
  { "args": [[0, 0, 0, 0]], "expected": 0 },
  { "args": [[5, 10]], "expected": 5 },
  { "args": [[10, 5]], "expected": 5 },
  { "args": [[2, 5, 3, 1, 7, 3, 4]], "expected": 9 },
  { "args": [[100, 1, 100, 1, 100]], "expected": 2 }
]
```
