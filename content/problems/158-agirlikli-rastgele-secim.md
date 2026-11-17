---
title: Ağırlıklı Rastgele Seçim
difficulty: medium
tags: [ikili-arama, on-ek-toplami, tasarim, matematik]
kind: class
class: WeightedPicker
constructor:
  - { name: w, type: "int[]" }
methods:
  - { name: pickIndex, params: [{ name: r, type: "int" }], returns: "int" }
---
Pozitif tam sayılardan oluşan, 0 tabanlı bir ağırlık dizisi `w` veriliyor; `w[i]`, `i`. indeksin ağırlığıdır. `[0, w.length - 1]` aralığından bir indeksi, **ağırlığıyla orantılı olasılıkla** seçmeniz gerekiyor: `i`. indeksin seçilme olasılığı `w[i] / sum(w)`'dir.

Örneğin `w = [1, 3]` ise `0` indeksinin seçilme olasılığı `%25`, `1` indeksininki `%75`'tir.

Rastgelelik testlerde doğrulanamayacağı için, rastgele sayı üretimi dışarıdan verilir: `pickIndex(r)` çağrısında `r`, `[1, sum(w)]` aralığından **düzgün dağılımla** seçilmiş bir tam sayıdır (gerçek uygulamada `r = random.Next(1, total + 1)`). Sizin işiniz `r`'yi doğru indekse eşlemektir: ağırlıkları yan yana dizilmiş aralıklar gibi düşünün; `r` hangi indeksin aralığına düşüyorsa o indeksi döndürün.

`WeightedPicker` sınıfını gerçekleştirin:

- `WeightedPicker(w)` nesneyi ağırlıklarla oluşturur.
- `pickIndex(r)` `prefix[i-1] < r <= prefix[i]` koşulunu sağlayan `i` indeksini döndürür (`prefix`, ağırlıkların ön ek toplamıdır).

### Örnek

```text
İşlemler:  WeightedPicker([1, 3]), pickIndex(1), pickIndex(2), pickIndex(4)
Çıktı:     null,                   0,            1,            1
Açıklama:  Aralıklar: 0 → [1, 1], 1 → [2, 4]. r düzgün seçilirse 1 indeksi 4 değerden 3'ünü kapsar.
```

### Kısıtlar

- `1 <= w.length <= 10^4`
- `1 <= w[i] <= 10^5`
- `1 <= r <= sum(w)`
- `pickIndex` en fazla `10^4` kez çağrılır.

## İpuçları

- Ağırlıkları bir sayı doğrusunda art arda dizilmiş aralıklar olarak düşünün: `w = [2, 5, 3]` → `[1..2]`, `[3..7]`, `[8..10]`.
- Ön ek toplamları `[2, 7, 10]` bu aralıkların bitiş noktalarıdır ve artan sıradadır.
- `r`'yi içeren aralık, `prefix[i] >= r` koşulunu sağlayan **ilk** `i`'dir: ikili arama.

## Çözüm

### Ön ek toplamı ve ikili arama

Kurucu `prefix` dizisini hesaplar: `prefix[i] = w[0] + ... + w[i]`. `i`. indeksin aralığı `(prefix[i-1], prefix[i]]`'dir ve uzunluğu tam olarak `w[i]`'dir. `r` bu aralıklara düzgün dağıldığı için her indeks ağırlığıyla orantılı olasılıkla seçilir.

`pickIndex(r)`, `prefix[i] >= r` olan ilk `i`'yi ikili aramayla bulur: `prefix[mid] < r` ise cevap sağdadır, değilse `mid` ya da solundadır.

```csharp solution
public class WeightedPicker
{
    private readonly long[] prefix;

    public WeightedPicker(int[] w)
    {
        prefix = new long[w.Length];
        long running = 0;
        for (var i = 0; i < w.Length; i++)
        {
            running += w[i];
            prefix[i] = running;
        }
    }

    public int PickIndex(int r)
    {
        var lo = 0;
        var hi = prefix.Length - 1;
        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (prefix[mid] < r)
            {
                lo = mid + 1;
            }
            else
            {
                hi = mid;
            }
        }

        return lo;
    }
}
```

```typescript solution
class WeightedPicker {
  private prefix: number[] = [];

  constructor(w: number[]) {
    let running = 0;
    for (const weight of w) {
      running += weight;
      this.prefix.push(running);
    }
  }

  pickIndex(r: number): number {
    let lo = 0;
    let hi = this.prefix.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.prefix[mid] < r) lo = mid + 1;
      else hi = mid;
    }

    return lo;
  }
}
```

### Karmaşıklık

- **Zaman:** Kurucu O(n), `pickIndex` O(log n).
- **Alan:** O(n).

LeetCode'daki asıl problemde `pickIndex()` parametresizdir ve `r`'yi kendisi üretir. Mülakatta da önemli olan aynı eşlemedir; rastgele sayının `[1, total]` aralığında **tam sayı** olarak üretilmesine (ya da `[0, total)` ondalıklıysa karşılaştırmanın uyarlanmasına) dikkat edin.

## Testler

```json
[
  {
    "ops": ["WeightedPicker", "pickIndex", "pickIndex", "pickIndex"],
    "args": [[[1, 3]], [1], [2], [4]],
    "expected": [null, 0, 1, 1],
    "sample": true
  },
  {
    "ops": ["WeightedPicker", "pickIndex"],
    "args": [[[1]], [1]],
    "expected": [null, 0]
  },
  {
    "ops": ["WeightedPicker", "pickIndex", "pickIndex", "pickIndex", "pickIndex", "pickIndex", "pickIndex", "pickIndex", "pickIndex"],
    "args": [[[2, 5, 3, 4]], [1], [2], [3], [7], [8], [10], [11], [14]],
    "expected": [null, 0, 0, 1, 1, 2, 2, 3, 3]
  },
  {
    "ops": ["WeightedPicker", "pickIndex", "pickIndex"],
    "args": [[[100000, 100000]], [100000], [100001]],
    "expected": [null, 0, 1]
  }
]
```
