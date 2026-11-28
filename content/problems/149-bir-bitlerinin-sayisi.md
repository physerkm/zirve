---
title: 1 Bitlerinin Sayısı
difficulty: easy
tags: [bit-islemleri]
function: hammingWeight
params:
  - { name: n, type: "int" }
returns: "int"
---
Negatif olmayan bir tam sayı `n` veriliyor. Bu sayının ikili (binary) gösterimindeki **`1` bitlerinin sayısını** (diğer adıyla **Hamming ağırlığını**) döndüren bir fonksiyon yazın.

### Örnek 1

```text
Girdi:  n = 11
Çıktı:  3
Açıklama: 11 sayısının ikili gösterimi 1011'dir ve toplam 3 adet '1' biti içerir.
```

### Örnek 2

```text
Girdi:  n = 128
Çıktı:  1
Açıklama: 128 sayısının ikili gösterimi 10000000'dır ve yalnızca 1 adet '1' biti içerir.
```

### Örnek 3

```text
Girdi:  n = 2147483645
Çıktı:  30
Açıklama: İkili gösterimi 01111111111111111111111111111101 şeklindedir ve 30 adet '1' biti içerir.
```

### Kısıtlar

- `0 <= n <= 2^31 - 1`

## İpuçları

- Sayının 32 bitini tek tek sağa kaydırıp (`n >> i`) en sağdaki bitin `1` olup olmadığını `(n & 1)` ile kontrol edebilirsiniz.
- Peki `0` olan bitleri hiç ziyaret etmeden, doğrudan yalnızca `1` olan bitler üzerinden atlamak mümkün müdür?
- Bir sayıdan `1` çıkardığınızda (`n - 1`), en sağdaki `1` biti `0`'a dönüşür ve onun sağındaki tüm `0` bitleri `1` olur.
- `n & (n - 1)` işlemi tam olarak ne yapar? Birkaç örnek üzerinde kağıt-kalemle deneyin.

## Çözüm

Standart yaklaşım 32 bitin tamamını döngüyle kontrol etmektir. Ancak **Brian Kernighan Hilesi** olarak bilinen bit tekniğiyle döngüyü yalnızca `1` bitlerinin sayısı kadar çalıştırabiliriz.

Bir `n` sayısından `1` çıkardığımızda (`n - 1`) ikili gösterimde şu değişim yaşanır:
- `n` sayısının **en sağdaki `1` biti `0` olur**,
- Bu bitin sağındaki tüm `0`'lar `1`'e dönüşür,
- Solundaki bitler ise hiç değişmeden kalır.

Örneğin `n = 12` (`1100`) için `n - 1 = 11` (`1011`) olur. Bu iki sayıyı bit düzeyinde VE (`&`) işlemine soktuğumuzda:
`1100 & 1011 = 1000` (`8`) elde edilir. Görüldüğü gibi `n & (n - 1)` işlemi, `n`'nin **en sağdaki `1` bitini tek adımda siler**.

Sayımız `0` olana kadar her adımda `n = n & (n - 1)` uygular ve sayacı (`count`) bir artırırız. Kaç adımda `0`'a ulaştıysak, sayıda o kadar `1` biti var demektir.

```csharp solution
public class Solution
{
    public int HammingWeight(int n)
    {
        int count = 0;

        while (n != 0)
        {
            // Brian Kernighan hilesi: en sağdaki 1 bitini siler.
            n &= (n - 1);
            count++;
        }

        return count;
    }
}
```

```typescript solution
function hammingWeight(n: number): number {
  let count = 0;

  while (n !== 0) {
    n &= n - 1;
    count++;
  }

  return count;
}
```

### Karmaşıklık

- **Zaman:** `O(1)`. 32-bitlik bir tam sayıda en fazla 31 adet `1` biti bulunabilir; döngü en fazla `1` bitlerinin sayısı (`k <= 31`) kadar çalışır.
- **Alan:** `O(1)`. Yalnızca sayaç (`count`) değişkeni için sabit bellek kullanılır.

## Testler

```json
[
  { "args": [11], "expected": 3, "sample": true },
  { "args": [128], "expected": 1, "sample": true },
  { "args": [2147483645], "expected": 30, "sample": true },
  { "args": [1], "expected": 1 },
  { "args": [0], "expected": 0 },
  { "args": [255], "expected": 8 },
  { "args": [1023], "expected": 10 },
  { "args": [2147483647], "expected": 31 }
]
```
