---
title: Aralık Ekle
difficulty: medium
tags: [aralik, dizi]
function: insert
params:
  - { name: intervals, type: "int[][]" }
  - { name: newInterval, type: "int[]" }
returns: "int[][]"
---
Başlangıçlarına göre **sıralı** ve birbiriyle **çakışmayan** aralıklardan oluşan bir dizi `intervals` ve yeni bir aralık `newInterval = [start, end]` veriliyor.

`newInterval`'ı ekleyin; gerekirse çakışan aralıkları birleştirerek dizinin sıralı ve çakışmasız kalmasını sağlayın. Sonucu döndürün. Uç noktaları ortak olan aralıklar (`[1, 5]` ve `[5, 7]`) çakışır.

### Örnek 1

```text
Girdi:  intervals = [[1,3],[6,9]], newInterval = [2,5]
Çıktı:  [[1,5],[6,9]]
```

### Örnek 2

```text
Girdi:  intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Çıktı:  [[1,2],[3,10],[12,16]]
Açıklama: [4,8], [3,5], [6,7] ve [8,10] ile çakışır.
```

### Kısıtlar

- `0 <= intervals.length <= 10^4`
- `intervals[i].length == 2`, `0 <= start_i <= end_i <= 10^5`
- `intervals` başlangıca göre artan sıradadır ve çakışma içermez.
- `newInterval.length == 2`, `0 <= start <= end <= 10^5`

## İpuçları

- Aralıklar sıralı olduğu için üç gruba ayrılır: yeni aralıktan tamamen **önce** bitenler, onunla **çakışanlar** ve tamamen **sonra** başlayanlar.
- Önce bitenleri olduğu gibi ekleyin. Çakışanları yeni aralıkla birleştirin: başlangıç en küçüğü, bitiş en büyüğü olur.
- Birleşmiş aralığı ekledikten sonra kalanları olduğu gibi ekleyin.

## Çözüm

### Üç aşamalı tek geçiş

1. `intervals[i][1] < newInterval[0]` olan aralıklar yeni aralıktan önce biter; sonuca aynen eklenir.
2. `intervals[i][0] <= newInterval[1]` olduğu sürece aralık yeni aralıkla çakışır. Yeni aralık genişletilir: `start = min(...)`, `end = max(...)`.
3. Birleşmiş aralık eklenir, sonra kalan aralıklar aynen eklenir.

Dizi zaten sıralı olduğu için yeniden sıralamaya gerek yoktur.

```csharp solution
public class Solution
{
    public int[][] Insert(int[][] intervals, int[] newInterval)
    {
        var result = new List<int[]>();
        var i = 0;
        var n = intervals.Length;

        while (i < n && intervals[i][1] < newInterval[0])
        {
            result.Add(intervals[i++]);
        }

        var start = newInterval[0];
        var end = newInterval[1];
        while (i < n && intervals[i][0] <= end)
        {
            start = Math.Min(start, intervals[i][0]);
            end = Math.Max(end, intervals[i][1]);
            i++;
        }

        result.Add(new[] { start, end });

        while (i < n)
        {
            result.Add(intervals[i++]);
        }

        return result.ToArray();
    }
}
```

```typescript solution
function insert(intervals: number[][], newInterval: number[]): number[][] {
  const result: number[][] = [];
  let i = 0;
  const n = intervals.length;

  while (i < n && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i++]);
  }

  let [start, end] = newInterval;
  while (i < n && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }

  result.push([start, end]);

  while (i < n) {
    result.push(intervals[i++]);
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(n) çıktı.

Yeni aralığı listeye ekleyip "Aralıkları Birleştir"i çalıştırmak da doğru sonuç verir ama sıralama yüzünden O(n log n) sürer; burada girdinin sıralı olmasından yararlanılır.

## Testler

```json
[
  { "args": [[[1, 3], [6, 9]], [2, 5]], "expected": [[1, 5], [6, 9]], "sample": true },
  { "args": [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], "expected": [[1, 2], [3, 10], [12, 16]], "sample": true },
  { "args": [[], [5, 7]], "expected": [[5, 7]] },
  { "args": [[[1, 5]], [2, 3]], "expected": [[1, 5]] },
  { "args": [[[1, 5]], [6, 8]], "expected": [[1, 5], [6, 8]] },
  { "args": [[[3, 5]], [1, 2]], "expected": [[1, 2], [3, 5]] },
  { "args": [[[1, 5]], [5, 7]], "expected": [[1, 7]] }
]
```
