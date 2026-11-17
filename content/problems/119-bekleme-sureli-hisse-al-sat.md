---
title: Bekleme Süreli Hisse Al-Sat
difficulty: medium
tags: [dinamik-programlama, dizi]
function: maxProfit
params:
  - { name: prices, type: "int[]" }
returns: "int"
---
`prices[i]`, bir hissenin `i`. gündeki fiyatıdır. İstediğiniz kadar işlem (al ve sat) yapabilirsiniz, ancak:

- Aynı anda en fazla bir hisse tutabilirsiniz (yeniden almadan önce satmalısınız).
- Sattığınız günün **ertesi günü** alım yapamazsınız (bir günlük bekleme süresi).

Elde edilebilecek **en yüksek kârı** döndürün.

### Örnek 1

```text
Girdi:  prices = [1, 2, 3, 0, 2]
Çıktı:  3
Açıklama: al (1) → sat (2) → bekle → al (0) → sat (2)
```

### Örnek 2

```text
Girdi:  prices = [1]
Çıktı:  0
```

### Kısıtlar

- `1 <= prices.length <= 5000`
- `0 <= prices[i] <= 1000`

## İpuçları

- Her günün sonunda üç durumdan birindesiniz: hisse **tutuyorsunuz**, bugün **sattınız** ya da hisse tutmadan **dinleniyorsunuz**.
- Her durumun en iyi kârını bir önceki günün durumlarından hesaplayın. Bekleme kuralı, "sattım" durumundan doğrudan "tutuyorum" durumuna geçişi yasaklar.
- Yalnızca bir önceki gün gerektiği için üç değişken yeterlidir.

## Çözüm

### Üç durumlu durum makinesi

- `hold`: gün sonunda elinde hisse var.
- `sold`: bugün sattın (yarın alamazsın).
- `rest`: elinde hisse yok ve bugün satmadın (yarın alabilirsin).

Geçişler:

- `hold' = max(hold, rest - p)`: ya tutmaya devam ya da dinlenme durumundan bugün al.
- `sold' = hold + p`: elindekini bugün sat.
- `rest' = max(rest, sold)`: dinlenmeye devam ya da dünkü satıştan sonra bekleme günü.

Başlangıçta `hold = -∞` (henüz alınmadı), `sold = 0`, `rest = 0`. Cevap `max(sold, rest)`.

```csharp solution
public class Solution
{
    public int MaxProfit(int[] prices)
    {
        var hold = int.MinValue / 2;
        var sold = 0;
        var rest = 0;

        foreach (var price in prices)
        {
            var previousSold = sold;
            sold = hold + price;
            hold = Math.Max(hold, rest - price);
            rest = Math.Max(rest, previousSold);
        }

        return Math.Max(sold, rest);
    }
}
```

```typescript solution
function maxProfit(prices: number[]): number {
  let hold = -Infinity;
  let sold = 0;
  let rest = 0;

  for (const price of prices) {
    const previousSold = sold;
    sold = hold + price;
    hold = Math.max(hold, rest - price);
    rest = Math.max(rest, previousSold);
  }

  return Math.max(sold, rest);
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1).

Güncelleme sırası önemlidir: `sold` eski `hold`'u, `hold` eski `rest`'i, `rest` eski `sold`'u kullanmalıdır. Eski `sold` bu yüzden önceden saklanır.

## Testler

```json
[
  { "args": [[1, 2, 3, 0, 2]], "expected": 3, "sample": true },
  { "args": [[1]], "expected": 0, "sample": true },
  { "args": [[1, 2]], "expected": 1 },
  { "args": [[2, 1]], "expected": 0 },
  { "args": [[1, 2, 4]], "expected": 3 },
  { "args": [[6, 1, 3, 2, 4, 7]], "expected": 6 },
  { "args": [[1, 4, 2]], "expected": 3 }
]
```
