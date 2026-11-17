---
title: Bitleri Ters Çevir
difficulty: easy
tags: [bit-islemleri, matematik]
function: reverseBits
params:
  - { name: n, type: "long" }
returns: "long"
---
32 bitlik **işaretsiz** bir tam sayı `n` veriliyor. `n`'in 32 bitini ters sıraya dizin ve elde edilen işaretsiz sayıyı döndürün.

Testlerde girdi ve çıktı, işaretsiz değeri taşıyabilmek için `long` (TypeScript'te `number`) olarak verilir; değerler her zaman `0 <= n < 2^32` aralığındadır.

### Örnek 1

```text
Girdi:  n = 43261596
Çıktı:  964176192
Açıklama: 00000010100101000001111010011100 → 00111001011110000010100101000000
```

### Örnek 2

```text
Girdi:  n = 4294967293
Çıktı:  3221225471
Açıklama: 11111111111111111111111111111101 → 10111111111111111111111111111111
```

### Kısıtlar

- `0 <= n < 2^32`

**Devam sorusu:** Fonksiyon çok kez çağrılacaksa nasıl hızlandırırdınız?

## İpuçları

- `n`'in en düşük bitini `n & 1` ile okuyup bir sağa kaydırarak bitleri sağdan sola tek tek alabilirsiniz.
- Sonucu sola kaydırıp okunan biti en sağa ekleyin. 32 tur sonunda bitler ters sıradadır.
- Baştaki sıfırları atlamayın: tam 32 tur dönmelisiniz.

## Çözüm

### 32 turda bit bit aktarma

`result` başta `0`'dır. Her turda `result` bir sola kaydırılır ve `n`'in en düşük biti `result`'ın en sağına eklenir; ardından `n` bir sağa kaydırılır. 32 turda `n`'in en sağdaki biti `result`'ın en soluna ulaşır.

C#'ta işlemler `uint` ile yapılır ki kaydırmalar işaret bitinden etkilenmesin. TypeScript'te bit işlemleri 32 bitlik **işaretli** sayılarla çalıştığı için sonuç çarpma ve toplamayla kurulur, `n` ise `>>> 1` (işaretsiz kaydırma) ile kaydırılır.

```csharp solution
public class Solution
{
    public long ReverseBits(long n)
    {
        var value = (uint)n;
        uint result = 0;

        for (var i = 0; i < 32; i++)
        {
            result = (result << 1) | (value & 1);
            value >>= 1;
        }

        return result;
    }
}
```

```typescript solution
function reverseBits(n: number): number {
  let value = n >>> 0;
  let result = 0;

  for (let i = 0; i < 32; i++) {
    result = result * 2 + (value & 1);
    value = value >>> 1;
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(1). Her zaman 32 tur.
- **Alan:** O(1).

Devam sorusu için 8 bitlik parçaların tersleri 256 elemanlı bir tabloda önceden hesaplanabilir; 32 bit dört tablo okumasıyla ters çevrilir. Ya da bitler böl-ve-yönet maskeleriyle (`0x55555555`, `0x33333333`, …) beş adımda yer değiştirir.

## Testler

```json
[
  { "args": [43261596], "expected": 964176192, "sample": true },
  { "args": [4294967293], "expected": 3221225471, "sample": true },
  { "args": [0], "expected": 0 },
  { "args": [1], "expected": 2147483648 },
  { "args": [4294967295], "expected": 4294967295 },
  { "args": [2147483648], "expected": 1 }
]
```
