---
title: Bozuk Para II
difficulty: medium
tags: [dinamik-programlama, dizi]
function: change
params:
  - { name: amount, type: "int" }
  - { name: coins, type: "int[]" }
returns: "int"
---
Bir tutar `amount` ve farklı değerlerde bozuk paralar `coins` veriliyor. Her paradan **sınırsız** sayıda kullanabilirsiniz. Tutarı oluşturmanın kaç **farklı kombinasyonu** olduğunu döndürün. Tutar oluşturulamıyorsa `0` döndürün.

Kombinasyonlarda sıra önemli değildir: `1 + 2` ile `2 + 1` aynı kombinasyondur. Cevap 32 bitlik bir tam sayıya sığar.

### Örnek 1

```text
Girdi:  amount = 5, coins = [1, 2, 5]
Çıktı:  4
Açıklama: 5 = 5, 5 = 2 + 2 + 1, 5 = 2 + 1 + 1 + 1, 5 = 1 + 1 + 1 + 1 + 1
```

### Örnek 2

```text
Girdi:  amount = 3, coins = [2]
Çıktı:  0
```

### Örnek 3

```text
Girdi:  amount = 10, coins = [10]
Çıktı:  1
```

### Kısıtlar

- `1 <= coins.length <= 300`
- `1 <= coins[i] <= 5000`; bütün değerler farklıdır.
- `0 <= amount <= 5000`

## İpuçları

- `dp[a]`: `a` tutarını oluşturmanın kombinasyon sayısı. `dp[0] = 1` (hiç para kullanmamak).
- Sıranın önemli olmaması için döngülerin sırası kritiktir: **dış döngü paralar**, iç döngü tutarlar olmalı.
- Her para için `dp[a] += dp[a - coin]`, `a` küçükten büyüğe. Aynı para tekrar kullanılabildiği için soldan sağa gitmek doğrudur.

## Çözüm

### Sınırsız sırt çantası, para başına bir tur

Paraları tek tek "açarız". `coin` açıldığında, `a` tutarına ulaşmanın yeni yolları, `a - coin` tutarına ulaşan her yola bir `coin` daha eklemektir: `dp[a] += dp[a - coin]`.

Dış döngü paralar üzerinde olduğu için her kombinasyon, paraları açılış sırasına göre dizilmiş **tek bir** biçimde sayılır; `1 + 2` ve `2 + 1` ayrı sayılmaz. (Döngüler yer değiştirseydi permütasyonlar sayılırdı.) İç döngünün küçükten büyüğe gitmesi aynı paranın birden fazla kez kullanılmasına izin verir.

```csharp solution
public class Solution
{
    public int Change(int amount, int[] coins)
    {
        var dp = new int[amount + 1];
        dp[0] = 1;

        foreach (var coin in coins)
        {
            for (var a = coin; a <= amount; a++)
            {
                dp[a] += dp[a - coin];
            }
        }

        return dp[amount];
    }
}
```

```typescript solution
function change(amount: number, coins: number[]): number {
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;

  for (const coin of coins) {
    for (let a = coin; a <= amount; a++) {
      dp[a] += dp[a - coin];
    }
  }

  return dp[amount];
}
```

### Karmaşıklık

- **Zaman:** O(n × amount).
- **Alan:** O(amount).

"Bozuk Para" (en az para sayısı) ile bu problemin tablosu aynı biçimdedir; farklı olan birleştirme işlemidir: `min` yerine **toplam**.

## Testler

```json
[
  { "args": [5, [1, 2, 5]], "expected": 4, "sample": true },
  { "args": [3, [2]], "expected": 0, "sample": true },
  { "args": [10, [10]], "expected": 1, "sample": true },
  { "args": [0, [7]], "expected": 1 },
  { "args": [4, [1, 2, 3]], "expected": 4 },
  { "args": [12, [2, 3, 5]], "expected": 5 }
]
```
