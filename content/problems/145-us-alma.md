---
title: Üs Alma (Pow)
difficulty: medium
tags: [matematik, ozyineleme, bit-islemleri]
function: myPow
params:
  - { name: x, type: "double" }
  - { name: n, type: "int" }
returns: "double"
---
`x` sayısının `n`. kuvvetini (`x^n`) hesaplayan `myPow(x, n)` fonksiyonunu yazın. Hazır üs fonksiyonları (`Math.Pow`, `**`) kullanmayın.

### Örnek 1

```text
Girdi:  x = 2.0, n = 10
Çıktı:  1024.0
```

### Örnek 2

```text
Girdi:  x = 2.1, n = 3
Çıktı:  9.261
```

### Örnek 3

```text
Girdi:  x = 2.0, n = -2
Çıktı:  0.25
Açıklama: 2^-2 = 1 / 2^2 = 0.25
```

### Kısıtlar

- `-100.0 < x < 100.0`
- `-2^31 <= n <= 2^31 - 1`
- `n` bir tam sayıdır; `x` sıfırsa `n > 0`'dır.
- `-10^4 <= x^n <= 10^4`

## İpuçları

- `x`'i `n` kez çarpmak `n = 2^31` için çok yavaş.
- `x^n = (x²)^(n/2)` olduğunu kullanın. `n` tekse fazladan bir `x` çarpımı gerekir.
- Negatif üs için `x`'i `1/x` yapıp üssü pozitife çevirin. `n = -2^31`'in mutlak değeri `int`'e sığmaz; `long` kullanın.

## Çözüm

### Hızlı üs alma (kare alarak)

`n`'in ikili gösterimini düşünelim: `x^13 = x^8 · x^4 · x^1` (13 = 1101₂). Döngüde `base` sırasıyla `x, x², x⁴, x⁸, ...` olur; `n`'in en düşük biti `1` ise o anki `base` sonuca çarpılır, sonra `base` kendisiyle çarpılıp `n` bir bit sağa kaydırılır.

Negatif üste önce `x = 1 / x`, `n = -n` yapılır. `n = -2^31` olduğunda `-n` `int`'e sığmadığı için üs `long`'a çevrilir.

```csharp solution
public class Solution
{
    public double MyPow(double x, int n)
    {
        long power = n;
        if (power < 0)
        {
            x = 1 / x;
            power = -power;
        }

        var result = 1.0;
        var current = x;
        while (power > 0)
        {
            if ((power & 1) == 1)
            {
                result *= current;
            }

            current *= current;
            power >>= 1;
        }

        return result;
    }
}
```

```typescript solution
function myPow(x: number, n: number): number {
  let power = n;
  if (power < 0) {
    x = 1 / x;
    power = -power;
  }

  let result = 1;
  let current = x;
  while (power > 0) {
    if (power % 2 === 1) {
      result *= current;
    }

    current *= current;
    power = Math.floor(power / 2);
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(log |n|). Her adımda üs yarıya iner.
- **Alan:** O(1).

TypeScript çözümünde `power & 1` ve `>>` yerine `% 2` ve bölme kullanılır; çünkü JavaScript'in bit işlemleri 32 bitlik işaretli tam sayılarla çalışır ve `2^31` değerini bozar.

## Testler

```json
[
  { "args": [2.0, 10], "expected": 1024.0, "sample": true },
  { "args": [2.1, 3], "expected": 9.261, "sample": true },
  { "args": [2.0, -2], "expected": 0.25, "sample": true },
  { "args": [1.0, -2147483648], "expected": 1.0 },
  { "args": [0.5, 3], "expected": 0.125 },
  { "args": [-2.0, 3], "expected": -8.0 },
  { "args": [2.0, 0], "expected": 1.0 },
  { "args": [0.0, 5], "expected": 0.0 },
  { "args": [-1.0, 2147483647], "expected": -1.0 }
]
```
