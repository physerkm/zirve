---
title: Toplantı Odaları
difficulty: easy
tags: [aralik, siralama]
function: canAttendMeetings
params:
  - { name: intervals, type: "int[][]" }
returns: "bool"
---
`intervals[i] = [start_i, end_i]` biçiminde toplantı zaman aralıklarının bulunduğu bir `intervals` dizisi veriliyor. Bir kişinin **tüm** toplantılara katılıp katılamayacağını belirleyin.

Bir toplantının bittiği anda başlayan başka bir toplantı (örneğin `[0, 8]` ve `[8, 10]`) çakışıyor **sayılmaz**.

### Örnek 1

```text
Girdi:  intervals = [[0,30],[5,10],[15,20]]
Çıktı:  false
Açıklama: [0,30] toplantısı hem [5,10] hem de [15,20] toplantısıyla çakışmaktadır.
```

### Örnek 2

```text
Girdi:  intervals = [[7,10],[2,4]]
Çıktı:  true
Açıklama: [2,4] toplantısı bittikten sonra [7,10] başlar; hiçbir çakışma yoktur.
```

### Kısıtlar

- `0 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i < end_i <= 10^6`

## İpuçları

- Bir kişinin tüm toplantılara katılabilmesi için hiçbir iki toplantının birbiriyle çakışmaması gerekir.
- Her toplantıyı diğer tüm toplantılarla karşılaştırmak O(n²) sürer. Toplantıları zaman sırasına koyarsak ne değişir?
- Toplantıları **başlangıç zamanına** göre sıraladığımızda, bir çakışma varsa bu mutlaka **komşu** iki toplantı arasında görülür.
- Sıralı dizide `intervals[i][0] < intervals[i - 1][1]` koşulu sağlanıyorsa `i`. toplantı, bir önceki toplantı bitmeden başlıyor demektir.

## Çözüm

Bir kişinin bütün toplantılara katılabilmesi, toplantı aralıklarının hiçbirinin çakışmaması anlamına gelir.

Aralıkları **başlangıç zamanına (`start`)** göre küçükten büyüğe sıraladığımızda toplantılar kronolojik sıraya girer. Artık her toplantıyı yalnızca kendisinden hemen önceki toplantıyla karşılaştırmamız yeterlidir:
- Eğer `i`. toplantının başlangıç saati (`intervals[i][0]`), `i - 1`. toplantının bitiş saatinden (`intervals[i - 1][1]`) **küçükse**, önceki toplantı bitmeden yenisi başlamış demektir; anında `false` döndürürüz.
- Döngü boyunca hiçbir komşu çift çakışmazsa tüm toplantılara katılmak mümkündür ve `true` döndürürüz.

```csharp solution
public class Solution
{
    public bool CanAttendMeetings(int[][] intervals)
    {
        // Toplantıları başlangıç zamanına göre kronolojik sıraya diz.
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));

        for (int i = 1; i < intervals.Length; i++)
        {
            // Sıradaki toplantı, önceki toplantı bitmeden başlıyorsa çakışma vardır.
            if (intervals[i][0] < intervals[i - 1][1])
                return false;
        }

        return true;
    }
}
```

```typescript solution
function canAttendMeetings(intervals: number[][]): boolean {
  intervals.sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) {
      return false;
    }
  }

  return true;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). Sıralama işlemi O(n log n), komşu aralıkları tarama döngüsü O(n) sürer.
- **Alan:** O(1) ek alan (sıralama algoritmasının kullandığı O(log n) yığın alanı dışında).

## Testler

```json
[
  { "args": [[[0, 30], [5, 10], [15, 20]]], "expected": false, "sample": true },
  { "args": [[[7, 10], [2, 4]]], "expected": true, "sample": true },
  { "args": [[]], "expected": true },
  { "args": [[[5, 10]]], "expected": true },
  { "args": [[[1, 5], [5, 8], [8, 12]]], "expected": true },
  { "args": [[[1, 5], [4, 8]]], "expected": false },
  { "args": [[[10, 20], [1, 10], [20, 30], [5, 15]]], "expected": false }
]
```
