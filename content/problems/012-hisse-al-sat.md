---
title: Hisse Al Sat
difficulty: easy
tags: [dizi, acgozlu]
function: maxProfit
params:
  - { name: prices, type: "int[]" }
returns: "int"
---
`prices[i]`, bir hissenin `i`. gündeki fiyatıdır. Hisseyi **bir gün alıp daha sonraki bir gün satarak** elde edebileceğiniz en büyük kârı döndürün. Kâr elde etmek mümkün değilse `0` döndürün.

### Örnek 1

```text
Girdi:  prices = [7, 1, 5, 3, 6, 4]
Çıktı:  5
Açıklama: 2. gün al (fiyat 1), 5. gün sat (fiyat 6): kâr 5.
```

### Örnek 2

```text
Girdi:  prices = [7, 6, 4, 3, 1]
Çıktı:  0
Açıklama: Fiyat sürekli düşüyor; işlem yapılmaz.
```

### Kısıtlar

- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

## İpuçları

- Bütün alım–satım çiftlerini denemek O(n²)'dir.
- Belirli bir gün satacaksanız, en iyi alım günü o günden **önceki en düşük fiyatlı** gündür.
- Diziyi gezerken "şimdiye kadarki en düşük fiyatı" güncel tutun.

## Çözüm

Her günü olası bir **satış günü** olarak düşünürüz. O gün satılırsa elde edilecek en iyi kâr, günün fiyatı ile o güne kadar görülen en düşük fiyat arasındaki farktır. Diziyi bir kez gezerken iki değeri güncel tutmak yeterlidir: şimdiye kadarki en düşük fiyat ve şimdiye kadarki en büyük kâr.

```csharp solution
public class Solution
{
    public int MaxProfit(int[] prices)
    {
        var lowest = int.MaxValue;
        var best = 0;

        foreach (var price in prices)
        {
            lowest = Math.Min(lowest, price);
            best = Math.Max(best, price - lowest);
        }

        return best;
    }
}
```

```typescript solution
function maxProfit(prices: number[]): number {
  let lowest = Infinity;
  let best = 0;

  for (const price of prices) {
    lowest = Math.min(lowest, price);
    best = Math.max(best, price - lowest);
  }

  return best;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1).

Sık yapılan hata, en düşük ve en yüksek fiyatı bulup farkını almaktır. Bu yanlıştır: en yüksek fiyat en düşük fiyattan **önce** gelmiş olabilir (`[7, 1, 5]`). Alım satımdan önce olmalıdır; tek geçişli çözüm bunu kendiliğinden sağlar.

## Testler

```json
[
  { "args": [[7, 1, 5, 3, 6, 4]], "expected": 5, "sample": true },
  { "args": [[7, 6, 4, 3, 1]], "expected": 0, "sample": true },
  { "args": [[5]], "expected": 0 },
  { "args": [[1, 2]], "expected": 1 },
  { "args": [[2, 1]], "expected": 0 },
  { "args": [[2, 4, 1]], "expected": 2 },
  { "args": [[3, 3, 3]], "expected": 0 },
  { "args": [[3, 2, 6, 5, 0, 3]], "expected": 4 },
  { "args": [[0, 10000]], "expected": 10000 }
]
```
