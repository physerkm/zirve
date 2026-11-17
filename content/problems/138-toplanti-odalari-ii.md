---
title: Toplantı Odaları II
difficulty: medium
tags: [aralik, iki-isaretci, heap, siralama]
function: minMeetingRooms
params:
  - { name: intervals, type: "int[][]" }
returns: "int"
---
`intervals[i] = [start_i, end_i]` biçiminde toplantı zaman aralıklarının bulunduğu bir `intervals` dizisi veriliyor. Tüm toplantıların çakışmadan gerçekleştirilebilmesi için gereken **en az toplantı odası sayısını** döndürün.

Bir toplantının bittiği anda (`end_i`), aynı odada başka bir toplantı (`start_j == end_i`) başlayabilir.

### Örnek 1

```text
Girdi:  intervals = [[0,30],[5,10],[15,20]]
Çıktı:  2
Açıklama: Birinci odaya [0,30] toplantısı, ikinci odaya ise sırasıyla [5,10] ve [15,20] toplantıları yerleştirilebilir.
```

### Örnek 2

```text
Girdi:  intervals = [[7,10],[2,4]]
Çıktı:  1
Açıklama: Toplantılar çakışmadığı için tek bir oda yeterlidir.
```

### Kısıtlar

- `1 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i < end_i <= 10^6`

## İpuçları

- İhtiyaç duyulan en az oda sayısı, herhangi bir anda **eşzamanlı olarak devam eden** toplantı sayısının maksimumuna eşittir.
- Bir toplantı başladığında kullanılan oda sayısı 1 artar, bir toplantı bittiğinde ise 1 azalır.
- Hangi toplantının hangisiyle eşleştiği önemli değildir; yalnızca yeni bir toplantı başladığında daha önce bitmiş bir toplantı olup olmadığı önemlidir.
- Başlangıç saatlerini (`starts`) ve bitiş saatlerini (`ends`) iki ayrı dizide sıralayıp iki işaretçiyle zaman çizgisinde ilerleyin.

## Çözüm

Gereken en az toplantı odası sayısı, zaman çizgisi üzerinde **aynı anda aktif olan maksimum toplantı sayısına** eşittir.

Yeni bir toplantı başladığında boşalmış bir oda varsa o odayı devralabiliriz; yoksa yeni bir oda açmamız gerekir. Hangi spesifik toplantının bittiği önemli değildir, yalnızca en erken biten toplantının yeni toplantıdan önce bitip bitmediği önemlidir.

Bu yüzden başlangıç ve bitiş zamanlarını iki ayrı dizide (`starts` ve `ends`) küçükten büyüğe sıralarız ve iki işaretçi (`s` ve `e`) ile zaman üzerinde ilerleriz:
1. Eğer `starts[s] < ends[e]` ise en erken biten toplantı henüz bitmeden yeni bir toplantı başlamıştır. Aktif oda sayısını artırırız (`rooms++`), `maxRooms` değerini güncelleriz ve `s` işaretçisini ilerletiriz.
2. Aksi halde (`starts[s] >= ends[e]`), bir toplantı sona ermiştir ve odası boşalmıştır. Aktif oda sayısını azaltırız (`rooms--`) ve `e` işaretçisini ilerletiriz.

Tüm başlangıçlar işlendiğinde `maxRooms` bize gereken en az oda sayısını verir.

```csharp solution
public class Solution
{
    public int MinMeetingRooms(int[][] intervals)
    {
        int n = intervals.Length;
        int[] starts = new int[n];
        int[] ends = new int[n];

        for (int i = 0; i < n; i++)
        {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }

        Array.Sort(starts);
        Array.Sort(ends);

        int rooms = 0;
        int maxRooms = 0;
        int s = 0;
        int e = 0;

        while (s < n)
        {
            if (starts[s] < ends[e])
            {
                // En erken biten toplantı henüz bitmedi; yeni oda gerekiyor.
                rooms++;
                maxRooms = Math.Max(maxRooms, rooms);
                s++;
            }
            else
            {
                // Bir toplantı bitti; odası boşaldı.
                rooms--;
                e++;
            }
        }

        return maxRooms;
    }
}
```

```typescript solution
function minMeetingRooms(intervals: number[][]): number {
  const n = intervals.length;
  const starts = new Array<number>(n);
  const ends = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    starts[i] = intervals[i][0];
    ends[i] = intervals[i][1];
  }

  starts.sort((a, b) => a - b);
  ends.sort((a, b) => a - b);

  let rooms = 0;
  let maxRooms = 0;
  let s = 0;
  let e = 0;

  while (s < n) {
    if (starts[s] < ends[e]) {
      rooms++;
      maxRooms = Math.max(maxRooms, rooms);
      s++;
    } else {
      rooms--;
      e++;
    }
  }

  return maxRooms;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). Başlangıç ve bitiş dizilerini sıralamak O(n log n), iki işaretçiyle taramak O(n) sürer.
- **Alan:** O(n), `starts` ve `ends` dizileri için.

## Testler

```json
[
  { "args": [[[0, 30], [5, 10], [15, 20]]], "expected": 2, "sample": true },
  { "args": [[[7, 10], [2, 4]]], "expected": 1, "sample": true },
  { "args": [[[1, 5], [5, 10], [10, 15]]], "expected": 1 },
  { "args": [[[1, 10], [2, 7], [3, 19], [8, 12], [10, 20], [11, 30]]], "expected": 4 },
  { "args": [[[1, 4], [1, 4], [1, 4]]], "expected": 3 },
  { "args": [[[5, 8]]], "expected": 1 }
]
```
