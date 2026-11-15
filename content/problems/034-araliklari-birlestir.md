---
title: Aralıkları Birleştir
difficulty: medium
tags: [aralik, siralama, dizi]
function: merge
params:
  - { name: intervals, type: "int[][]" }
returns: "int[][]"
---
`intervals[i] = [başlangıç, bitiş]` biçiminde aralıklardan oluşan bir dizi veriliyor. **Çakışan bütün aralıkları birleştirin** ve girdideki bütün aralıkları kapsayan, birbiriyle çakışmayan aralıkları **başlangıç değerine göre sıralı** olarak döndürün.

Uç noktaları eşit olan aralıklar da çakışır: `[1, 4]` ile `[4, 5]` birleşerek `[1, 5]` olur.

### Örnek 1

```text
Girdi:  intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
Çıktı:  [[1, 6], [8, 10], [15, 18]]
Açıklama: [1, 3] ve [2, 6] çakışır.
```

### Örnek 2

```text
Girdi:  intervals = [[1, 4], [4, 5]]
Çıktı:  [[1, 5]]
```

### Kısıtlar

- `1 <= intervals.length <= 10^4`
- `0 <= başlangıç <= bitiş <= 10^4`

## İpuçları

- Aralıklar rastgele sıradayken hangilerinin çakıştığını bulmak zordur. Hangi sıralama işi kolaylaştırır?
- Aralıkları **başlangıç değerine** göre sıralarsanız, çakışan aralıklar yan yana gelir.
- Sıralı aralıkları gezerken her birini sonuçtaki **son** aralıkla karşılaştırın: çakışıyorsa son aralığın bitişini uzatın, çakışmıyorsa yeni aralık olarak ekleyin.

## Çözüm

Aralıkları başlangıç değerine göre sıralarız. Sonra sırayla gezeriz ve her aralığı, sonuç listesindeki son aralıkla karşılaştırırız:

- Aralığın başlangıcı, son aralığın bitişinden **büyükse** çakışma yoktur; yeni aralık olarak ekleriz.
- Değilse çakışırlar; son aralığın bitişini ikisinin bitişlerinden **büyük olanı** yaparız.

Bitişlerin büyüğünü almak önemlidir: `[1, 10]` ile `[2, 3]` birleştiğinde sonuç `[1, 10]` olmalıdır; bitişi körlemesine yeni aralığınkiyle değiştirmek `[1, 3]` gibi yanlış bir sonuç üretir.

```csharp solution
public class Solution
{
    public int[][] Merge(int[][] intervals)
    {
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));

        var merged = new List<int[]>();

        foreach (var interval in intervals)
        {
            if (merged.Count == 0 || interval[0] > merged[^1][1])
            {
                merged.Add(new[] { interval[0], interval[1] });
            }
            else
            {
                merged[^1][1] = Math.Max(merged[^1][1], interval[1]);
            }
        }

        return merged.ToArray();
    }
}
```

```typescript solution
function merge(intervals: number[][]): number[][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];

  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];

    if (last === undefined || start > last[1]) {
      merged.push([start, end]);
    } else {
      last[1] = Math.max(last[1], end);
    }
  }

  return merged;
}
```

### Karmaşıklık

- **Zaman:** O(n log n); sıralama baskındır, gezme O(n)'dir.
- **Alan:** O(n) (çıktı ve sıralamanın kullandığı alan).

Aralık problemlerinin neredeyse hepsi "önce sırala" ile başlar: toplantı odaları, çakışmayan aralıklar, araya aralık ekleme. Hangi uca göre sıralanacağı probleme göre değişir.

## Testler

```json
[
  { "args": [[[1, 3], [2, 6], [8, 10], [15, 18]]], "expected": [[1, 6], [8, 10], [15, 18]], "sample": true },
  { "args": [[[1, 4], [4, 5]]], "expected": [[1, 5]], "sample": true },
  { "args": [[[5, 7]]], "expected": [[5, 7]] },
  { "args": [[[1, 10], [2, 3], [4, 5]]], "expected": [[1, 10]] },
  { "args": [[[8, 10], [1, 3], [2, 6]]], "expected": [[1, 6], [8, 10]] },
  { "args": [[[1, 4], [0, 4]]], "expected": [[0, 4]] },
  { "args": [[[1, 4], [0, 0]]], "expected": [[0, 0], [1, 4]] },
  { "args": [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]], "expected": [[1, 10]] },
  { "args": [[[0, 0], [0, 0]]], "expected": [[0, 0]] }
]
```
