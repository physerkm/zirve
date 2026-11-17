---
title: Tam Sayıyı Ters Çevir
difficulty: medium
tags: [matematik]
function: reverse
params:
  - { name: x, type: "int" }
returns: "int"
---
32 bitlik işaretli bir tam sayı `x` veriliyor. Basamaklarını ters çevirip döndürün. Ters çevrilmiş sayı 32 bitlik işaretli tam sayı aralığının (`[-2^31, 2^31 - 1]`) dışına taşıyorsa `0` döndürün.

Ortamınızın 64 bitlik tam sayı saklayamadığını varsayın.

### Örnek 1

```text
Girdi:  x = 123
Çıktı:  321
```

### Örnek 2

```text
Girdi:  x = -123
Çıktı:  -321
```

### Örnek 3

```text
Girdi:  x = 120
Çıktı:  21
```

### Kısıtlar

- `-2^31 <= x <= 2^31 - 1`

## İpuçları

- Son basamağı `x % 10` ile alıp `x`'i `10`'a bölerek basamakları sağdan sola tek tek koparabilirsiniz.
- Sonucu `result * 10 + digit` ile kurun. Taşma, çarpmadan **önce** kontrol edilmelidir; çünkü taşmış bir değeri sonradan fark edemezsiniz.
- `result > MaxValue / 10` ise ya da eşit olup `digit > 7` ise bir sonraki adım taşar. Negatif taraf için de simetrik kontrol yapın.

## Çözüm

### Taşmayı önceden kontrol ederek basamak basamak kurma

Her turda son basamak `digit = x % 10` alınır ve `x /= 10` yapılır. C#'ta negatif bir sayının kalanı da negatiftir; bu yüzden aynı döngü negatif sayıları da doğru çevirir.

`result = result * 10 + digit` işleminden önce taşma kontrol edilir:

- `result > int.MaxValue / 10` ya da (`result == int.MaxValue / 10` ve `digit > 7`) ise üst sınır aşılır.
- `result < int.MinValue / 10` ya da (`result == int.MinValue / 10` ve `digit < -8`) ise alt sınır aşılır.

`2147483647`'nin son basamağı `7`, `-2147483648`'inki `8` olduğu için sınırlar bunlardır.

```csharp solution
public class Solution
{
    public int Reverse(int x)
    {
        var result = 0;

        while (x != 0)
        {
            var digit = x % 10;
            x /= 10;

            if (result > int.MaxValue / 10 || (result == int.MaxValue / 10 && digit > 7))
            {
                return 0;
            }

            if (result < int.MinValue / 10 || (result == int.MinValue / 10 && digit < -8))
            {
                return 0;
            }

            result = result * 10 + digit;
        }

        return result;
    }
}
```

```typescript solution
function reverse(x: number): number {
  const MAX = 2147483647;
  const MIN = -2147483648;
  let result = 0;

  while (x !== 0) {
    const digit = x % 10;
    x = Math.trunc(x / 10);

    if (result > Math.trunc(MAX / 10) || (result === Math.trunc(MAX / 10) && digit > 7)) return 0;
    if (result < Math.trunc(MIN / 10) || (result === Math.trunc(MIN / 10) && digit < -8)) return 0;

    result = result * 10 + digit;
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(log |x|). Basamak sayısı kadar tur.
- **Alan:** O(1).

## Testler

```json
[
  { "args": [123], "expected": 321, "sample": true },
  { "args": [-123], "expected": -321, "sample": true },
  { "args": [120], "expected": 21, "sample": true },
  { "args": [0], "expected": 0 },
  { "args": [1534236469], "expected": 0 },
  { "args": [-2147483648], "expected": 0 },
  { "args": [1463847412], "expected": 2147483641 },
  { "args": [-1463847412], "expected": -2147483641 },
  { "args": [2147483647], "expected": 0 }
]
```
