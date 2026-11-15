---
title: Bozuk Para
difficulty: medium
tags: [dinamik-programlama, dizi]
function: coinChange
params:
  - { name: coins, type: "int[]" }
  - { name: amount, type: "int" }
returns: "int"
---
Farklı değerlerdeki madeni paraları gösteren bir dizi `coins` ve bir tutar `amount` veriliyor. Bu tutarı oluşturmak için gereken **en az para sayısını** döndürün. Tutar bu paralarla oluşturulamıyorsa `-1` döndürün.

Her para türünden sınırsız sayıda kullanabilirsiniz.

### Örnek 1

```text
Girdi:  coins = [1, 2, 5], amount = 11
Çıktı:  3
Açıklama: 11 = 5 + 5 + 1
```

### Örnek 2

```text
Girdi:  coins = [2], amount = 3
Çıktı:  -1
```

### Örnek 3

```text
Girdi:  coins = [1], amount = 0
Çıktı:  0
```

### Kısıtlar

- `1 <= coins.length <= 12`
- `1 <= coins[i] <= 2^31 - 1`
- `0 <= amount <= 10^4`

## İpuçları

- Her seferinde en büyük parayı almak (açgözlü yaklaşım) her zaman doğru sonucu vermez: `coins = [1, 3, 4]`, `amount = 6` için deneyin.
- `amount` tutarı için en iyi çözümün **son** parası `c` ise, geri kalan `amount - c` tutarı da en az parayla oluşturulmuş olmalıdır.
- `0`'dan `amount`'a kadar her tutar için en az para sayısını bir tabloda hesaplayın.

## Çözüm

`fewest[a]`, `a` tutarını oluşturmak için gereken en az para sayısı olsun. Son kullanılan para `c` ise kalan tutar `a - c`'dir, yani:

```text
fewest[a] = 1 + min(fewest[a - c])     (a'dan büyük olmayan her c için)
fewest[0] = 0
```

Tabloyu küçük tutarlardan büyüğe doğru doldururuz. Ulaşılamayan tutarlar için "sonsuz" yerine `amount + 1` kullanırız: hiçbir geçerli çözüm `amount`'tan fazla para içeremez (en küçük para 1'dir), ve bu değer toplama yapılırken taşmaz.

```csharp solution
public class Solution
{
    public int CoinChange(int[] coins, int amount)
    {
        var unreachable = amount + 1;
        var fewest = new int[amount + 1];
        Array.Fill(fewest, unreachable);
        fewest[0] = 0;

        for (var a = 1; a <= amount; a++)
        {
            foreach (var coin in coins)
            {
                if (coin <= a)
                {
                    fewest[a] = Math.Min(fewest[a], fewest[a - coin] + 1);
                }
            }
        }

        return fewest[amount] == unreachable ? -1 : fewest[amount];
    }
}
```

```typescript solution
function coinChange(coins: number[], amount: number): number {
  const unreachable = amount + 1;
  const fewest: number[] = new Array(amount + 1).fill(unreachable);
  fewest[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a) {
        fewest[a] = Math.min(fewest[a], fewest[a - coin] + 1);
      }
    }
  }

  return fewest[amount] === unreachable ? -1 : fewest[amount];
}
```

### Karmaşıklık

- **Zaman:** O(amount × coins.length).
- **Alan:** O(amount).

**Açgözlü yaklaşım neden yanlış?** `coins = [1, 3, 4]`, `amount = 6` için açgözlü çözüm `4 + 1 + 1` (3 para) bulur; en iyi çözüm `3 + 3`'tür (2 para). Açgözlü yöntem yalnızca bazı özel para sistemlerinde (ör. 1, 5, 10, 25) doğru çalışır.

## Testler

```json
[
  { "args": [[1, 2, 5], 11], "expected": 3, "sample": true },
  { "args": [[2], 3], "expected": -1, "sample": true },
  { "args": [[1], 0], "expected": 0, "sample": true },
  { "args": [[1, 3, 4], 6], "expected": 2 },
  { "args": [[1], 7], "expected": 7 },
  { "args": [[2, 5, 10, 1], 27], "expected": 4 },
  { "args": [[186, 419, 83, 408], 6249], "expected": 20 },
  { "args": [[5, 7], 1], "expected": -1 },
  { "args": [[2147483647], 2], "expected": -1 },
  { "args": [[3, 7], 14], "expected": 2 }
]
```
