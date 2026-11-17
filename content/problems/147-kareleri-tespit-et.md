---
title: Kareleri Tespit Et
difficulty: medium
tags: [tasarim, hash-tablosu, matematik]
kind: class
class: DetectSquares
constructor: []
methods:
  - { name: add, params: [{ name: point, type: "int[]" }], returns: "void" }
  - { name: count, params: [{ name: point, type: "int[]" }], returns: "int" }
---
Düzlemde noktalardan oluşan bir akış veriliyor. Aşağıdaki işlemleri destekleyen bir veri yapısı tasarlayın:

- **Ekleme:** Yeni bir nokta eklenir. Aynı nokta birden fazla kez eklenebilir ve her biri ayrı nokta sayılır.
- **Sayma:** Sorgu noktası `point` verildiğinde, eklenmiş noktalardan üçünü seçerek sorgu noktasıyla birlikte **pozitif alanlı, kenarları eksenlere paralel bir kare** oluşturmanın kaç yolu olduğunu döndürür.

`DetectSquares` sınıfını gerçekleştirin:

- `DetectSquares()` boş bir yapı oluşturur.
- `add(point)` `point = [x, y]` noktasını ekler.
- `count(point)` yukarıda tanımlanan kare sayısını döndürür.

### Örnek

```text
İşlemler:  DetectSquares, add([3,10]), add([11,2]), add([3,2]), count([11,10]), count([14,8]), add([11,2]), count([11,10])
Çıktı:     null,          null,        null,        null,       1,               0,              null,        2
Açıklama:  Son sorguda [11,2] iki kez eklendiği için iki farklı kare seçimi vardır.
```

### Kısıtlar

- `point.length == 2`
- `0 <= x, y <= 1000`
- `add` ve `count` toplamda en fazla `3000` kez çağrılır.

## İpuçları

- Sorgu noktası karenin bir köşesiyse, karşı (çapraz) köşeyi seçmek kareyi tamamen belirler.
- Her eklenmiş nokta için çapraz köşe olabilir mi diye bakın: `|px - qx| == |py - qy| != 0` olmalı.
- Diğer iki köşe `(qx, py)` ve `(px, qy)`'dir. Nokta sayılarını bir hash tablosunda tutarsanız katkı `sayı(p) × sayı(qx, py) × sayı(px, qy)` olur.

## Çözüm

### Çapraz köşe üzerinden sayma

Her noktanın kaç kez eklendiğini bir sözlükte, farklı noktaları da bir listede tutarız.

`count(q)` için listedeki her `p` noktasını çapraz köşe adayı olarak deneriz. `p`, `q` ile aynı satır ya da sütunda değilse ve iki eksendeki uzaklıklar eşitse (`|px - qx| == |py - qy|`) bir kare oluşabilir. Kalan iki köşe `(qx, py)` ve `(px, qy)`'dir. Her köşe birden fazla kez eklenmiş olabileceği için katkı, üç köşenin sayılarının çarpımıdır.

```csharp solution
public class DetectSquares
{
    private readonly Dictionary<(int X, int Y), int> counts = new();
    private readonly List<(int X, int Y)> points = new();

    public void Add(int[] point)
    {
        var key = (point[0], point[1]);
        if (!counts.TryGetValue(key, out var c))
        {
            points.Add(key);
        }

        counts[key] = c + 1;
    }

    public int Count(int[] point)
    {
        var qx = point[0];
        var qy = point[1];
        var total = 0;

        foreach (var (px, py) in points)
        {
            if (px == qx || Math.Abs(px - qx) != Math.Abs(py - qy))
            {
                continue;
            }

            counts.TryGetValue((qx, py), out var a);
            counts.TryGetValue((px, qy), out var b);
            total += counts[(px, py)] * a * b;
        }

        return total;
    }
}
```

```typescript solution
class DetectSquares {
  private counts = new Map<string, number>();
  private points: [number, number][] = [];

  add(point: number[]): void {
    const key = `${point[0]},${point[1]}`;
    const c = this.counts.get(key);
    if (c === undefined) {
      this.points.push([point[0], point[1]]);
    }

    this.counts.set(key, (c ?? 0) + 1);
  }

  count(point: number[]): number {
    const [qx, qy] = point;
    let total = 0;

    for (const [px, py] of this.points) {
      if (px === qx || Math.abs(px - qx) !== Math.abs(py - qy)) continue;

      const a = this.counts.get(`${qx},${py}`) ?? 0;
      const b = this.counts.get(`${px},${qy}`) ?? 0;
      total += this.counts.get(`${px},${py}`)! * a * b;
    }

    return total;
  }
}
```

### Karmaşıklık

- **Zaman:** `add` O(1), `count` O(farklı nokta sayısı).
- **Alan:** O(farklı nokta sayısı).

`px == qx` kontrolü sıfır alanlı "kareleri" eler: eşit uzaklık koşuluyla birlikte `py == qy` olmasını da dışarıda bırakır.

## Testler

```json
[
  {
    "ops": ["DetectSquares", "add", "add", "add", "count", "count", "add", "count"],
    "args": [[], [[3, 10]], [[11, 2]], [[3, 2]], [[11, 10]], [[14, 8]], [[11, 2]], [[11, 10]]],
    "expected": [null, null, null, null, 1, 0, null, 2],
    "sample": true
  },
  {
    "ops": ["DetectSquares", "add", "add", "add", "add", "count", "add", "add", "count"],
    "args": [[], [[0, 0]], [[0, 0]], [[0, 1]], [[1, 0]], [[1, 1]], [[2, 0]], [[2, 1]], [[1, 1]]],
    "expected": [null, null, null, null, null, 2, null, null, 3]
  },
  {
    "ops": ["DetectSquares", "add", "count"],
    "args": [[], [[5, 5]], [[5, 5]]],
    "expected": [null, null, 0]
  }
]
```
