---
title: Muz Yiyen Koko
difficulty: medium
tags: [dizi, ikili-arama]
function: minEatingSpeed
params:
  - { name: piles, type: "int[]" }
  - { name: h, type: "int" }
returns: "int"
---
Koko'nun önünde `n` muz yığını var; `i`. yığında `piles[i]` muz bulunuyor. Bekçiler `h` saat sonra geri dönecek.

Koko saatte `k` muz yeme hızını kendisi seçer. Her saat bir yığın seçer ve o yığından `k` muz yer. Yığında `k`'dan az muz varsa hepsini yer ve o saat içinde başka yığına geçmez.

Koko yavaş yemeyi sever ama bekçiler dönmeden bütün muzları bitirmek ister. **Bütün muzları `h` saat içinde yiyebileceği en küçük `k` tam sayısını** döndürün.

### Örnek 1

```text
Girdi:  piles = [3, 6, 7, 11], h = 8
Çıktı:  4
Açıklama: k = 4 ile saatler 1 + 2 + 2 + 3 = 8. k = 3 ile 1 + 2 + 3 + 4 = 10 saat sürer.
```

### Örnek 2

```text
Girdi:  piles = [30, 11, 23, 4, 20], h = 5
Çıktı:  30
```

### Örnek 3

```text
Girdi:  piles = [30, 11, 23, 4, 20], h = 6
Çıktı:  23
```

### Kısıtlar

- `1 <= piles.length <= 10^4`
- `piles.length <= h <= 10^9`
- `1 <= piles[i] <= 10^9`

## İpuçları

- Hız `k` ile gereken saat `ceil(piles[i] / k)` değerlerinin toplamıdır. `k` arttıkça bu toplam artar mı, azalır mı?
- Cevap `1` ile `max(piles)` arasındadır. Bu aralıkta "yetişiyor / yetişmiyor" ayrımı tek bir sınırla bölünür.
- Değer aralığında ikili arama yapın: orta hız yetişiyorsa daha küçüğünü, yetişmiyorsa daha büyüğünü deneyin.

## Çözüm

### Cevap üzerinde ikili arama

Gereken toplam saat, `k` büyüdükçe **artmayan** bir fonksiyondur. Bu yüzden `[1, max(piles)]` aralığı iki parçaya bölünür: soldaki hızlar yetişmez, sağdakiler yetişir. Aradığımız, yetişen ilk hızdır.

`lo = 1`, `hi = max(piles)` ile başlarız. `mid` hızında gereken saat `h`'yi geçmiyorsa cevap `mid` ya da daha küçüktür (`hi = mid`); geçiyorsa daha büyük bir hız gerekir (`lo = mid + 1`). Aralık tek değere inince cevap odur.

`ceil(p / k)` tam sayılarla `(p + k - 1) / k` olarak hesaplanır. `k = 1` iken toplam saat `10^13`'e kadar çıkabildiği için toplam `long` tutulur.

```csharp solution
public class Solution
{
    public int MinEatingSpeed(int[] piles, int h)
    {
        var lo = 1;
        var hi = piles.Max();

        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2;
            long hours = 0;
            foreach (var pile in piles)
            {
                hours += (pile + (long)mid - 1) / mid;
            }

            if (hours <= h)
            {
                hi = mid;
            }
            else
            {
                lo = mid + 1;
            }
        }

        return lo;
    }
}
```

```typescript solution
function minEatingSpeed(piles: number[], h: number): number {
  let lo = 1;
  let hi = Math.max(...piles);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / mid);
    }

    if (hours <= h) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return lo;
}
```

### Karmaşıklık

- **Zaman:** O(n log m). `m = max(piles)`; her ikili arama adımında bütün yığınlar gezilir.
- **Alan:** O(1).

"Cevabın kendisi üzerinde ikili arama", yalnızca sıralı dizilerde değil, **monoton bir koşulun** olduğu her yerde işe yarar. Mülakatta bu monotonluğu açıkça söylemek önemlidir.

## Testler

```json
[
  { "args": [[3, 6, 7, 11], 8], "expected": 4, "sample": true },
  { "args": [[30, 11, 23, 4, 20], 5], "expected": 30, "sample": true },
  { "args": [[30, 11, 23, 4, 20], 6], "expected": 23, "sample": true },
  { "args": [[1], 1], "expected": 1 },
  { "args": [[1000000000], 2], "expected": 500000000 },
  { "args": [[312884470], 312884469], "expected": 2 },
  { "args": [[5, 5, 5, 5], 4], "expected": 5 },
  { "args": [[5, 5, 5, 5], 20], "expected": 1 },
  { "args": [[1000000000, 1000000000, 1000000000], 1000000000], "expected": 4 }
]
```
