---
title: Dizgi Olarak Verilen Sayıları Çarp
difficulty: medium
tags: [matematik, dizgi]
function: multiply
params:
  - { name: num1, type: "string" }
  - { name: num2, type: "string" }
returns: "string"
---
Dizgi olarak gösterilen negatif olmayan iki tam sayı `num1` ve `num2` veriliyor. Çarpımlarını yine dizgi olarak döndürün.

Hazır büyük sayı kütüphanelerini (`BigInteger` gibi) kullanmayın ve girdileri doğrudan tam sayıya çevirmeyin.

### Örnek 1

```text
Girdi:  num1 = "2", num2 = "3"
Çıktı:  "6"
```

### Örnek 2

```text
Girdi:  num1 = "123", num2 = "456"
Çıktı:  "56088"
```

### Kısıtlar

- `1 <= num1.length, num2.length <= 200`
- Dizgiler yalnızca rakamlardan oluşur.
- `"0"` dışında hiçbiri sıfırla başlamaz.

## İpuçları

- Kâğıt üzerinde alt alta çarpma nasıl yapılır? Her basamak çarpımı sonucun hangi basamağına düşer?
- `num1[i] × num2[j]` çarpımı, sağdan sayınca sonucun `i + j` ve `i + j + 1` konumlarına etki eder.
- Sonuç en fazla `m + n` basamaklıdır. Bu uzunlukta bir dizi tutup çarpımları biriktirin, eldeleri anında taşıyın.

## Çözüm

### Basamak dizisinde birikimli çarpım

`m + n` uzunluğunda bir `digits` dizisi açarız. `i` ve `j`'yi sağdan sola gezerek her basamak çarpımı `p = num1[i] × num2[j]`, `digits[i + j + 1]`'deki mevcut değerle toplanır:

- `digits[i + j + 1] = toplam % 10`
- `digits[i + j] += toplam / 10` (elde bir sol basamağa geçer)

Bütün çarpımlar bittiğinde baştaki sıfırlar atlanır. Sonuç tamamen sıfırsa `"0"` döner.

```csharp solution
public class Solution
{
    public string Multiply(string num1, string num2)
    {
        var m = num1.Length;
        var n = num2.Length;
        var digits = new int[m + n];

        for (var i = m - 1; i >= 0; i--)
        {
            for (var j = n - 1; j >= 0; j--)
            {
                var product = (num1[i] - '0') * (num2[j] - '0');
                var sum = product + digits[i + j + 1];
                digits[i + j + 1] = sum % 10;
                digits[i + j] += sum / 10;
            }
        }

        var builder = new StringBuilder();
        foreach (var digit in digits)
        {
            if (builder.Length == 0 && digit == 0)
            {
                continue;
            }

            builder.Append(digit);
        }

        return builder.Length == 0 ? "0" : builder.ToString();
    }
}
```

```typescript solution
function multiply(num1: string, num2: string): string {
  const m = num1.length;
  const n = num2.length;
  const digits = new Array<number>(m + n).fill(0);

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const product = Number(num1[i]) * Number(num2[j]);
      const sum = product + digits[i + j + 1];
      digits[i + j + 1] = sum % 10;
      digits[i + j] += Math.floor(sum / 10);
    }
  }

  const result = digits.join('').replace(/^0+/, '');
  return result === '' ? '0' : result;
}
```

### Karmaşıklık

- **Zaman:** O(m × n). Her basamak çifti bir kez çarpılır.
- **Alan:** O(m + n).

## Testler

```json
[
  { "args": ["2", "3"], "expected": "6", "sample": true },
  { "args": ["123", "456"], "expected": "56088", "sample": true },
  { "args": ["0", "52"], "expected": "0" },
  { "args": ["999", "999"], "expected": "998001" },
  { "args": ["1", "1"], "expected": "1" },
  { "args": ["123456789", "987654321"], "expected": "121932631112635269" },
  { "args": ["9133", "0"], "expected": "0" }
]
```
