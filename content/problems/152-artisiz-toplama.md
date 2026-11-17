---
title: Artı İşaretsiz Toplama
difficulty: medium
tags: [bit-islemleri, matematik]
function: getSum
params:
  - { name: a, type: "int" }
  - { name: b, type: "int" }
returns: "int"
---
İki tam sayı `a` ve `b` veriliyor. `+` ve `-` operatörlerini **kullanmadan** toplamlarını döndürün.

### Örnek 1

```text
Girdi:  a = 1, b = 2
Çıktı:  3
```

### Örnek 2

```text
Girdi:  a = 2, b = 3
Çıktı:  5
```

### Kısıtlar

- `-1000 <= a, b <= 1000`

## İpuçları

- İki biti toplarken sonuç biti XOR'a, elde biti AND'e eşittir.
- `a ^ b` eldesiz toplamı, `(a & b) << 1` ise bir sola kaymış eldeleri verir. Bu ikisini toplamak yine aynı problemdir.
- Elde kalmayana kadar tekrarlayın. İkiye tümleyen gösterimde negatif sayılar da aynı şekilde çalışır.

## Çözüm

### XOR ve elde döngüsü

Her turda:

- `carry = (a & b) << 1`: iki sayının da `1` olduğu bitler bir üst basamağa elde verir.
- `a = a ^ b`: eldeleri yok sayan bit bit toplam.
- `b = carry`: eldeler bir sonraki turda eklenecek.

`b` (elde) sıfır olunca `a` toplamın kendisidir. İkiye tümleyen gösterimde toplama bitlerden bağımsız olarak aynı kurallarla çalıştığı için negatif sayılar ayrıca ele alınmaz; 32 bitlik taşmalar en fazla 32 turda eldeyi sıfırlar.

```csharp solution
public class Solution
{
    public int GetSum(int a, int b)
    {
        while (b != 0)
        {
            var carry = (a & b) << 1;
            a ^= b;
            b = carry;
        }

        return a;
    }
}
```

```typescript solution
function getSum(a: number, b: number): number {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }

  return a;
}
```

### Karmaşıklık

- **Zaman:** O(1). En fazla 32 tur (bit genişliği kadar).
- **Alan:** O(1).

Bu, donanımdaki "yarım toplayıcı" (half adder) mantığının yazılımdaki karşılığıdır: XOR toplam biti, AND elde bitidir.

## Testler

```json
[
  { "args": [1, 2], "expected": 3, "sample": true },
  { "args": [2, 3], "expected": 5, "sample": true },
  { "args": [-1, 1], "expected": 0 },
  { "args": [-2, -3], "expected": -5 },
  { "args": [0, 0], "expected": 0 },
  { "args": [1000, -1000], "expected": 0 },
  { "args": [-12, 7], "expected": -5 },
  { "args": [20, -1000], "expected": -980 }
]
```
