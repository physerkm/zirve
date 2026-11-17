---
title: Çakışmayan Aralıklar
difficulty: medium
tags: [aralik, acgozlu, siralama]
function: eraseOverlapIntervals
params:
  - { name: intervals, type: "int[][]" }
returns: "int"
---
`intervals[i] = [start_i, end_i]` biçiminde aralıkların bulunduğu bir `intervals` dizisi veriliyor. Geriye kalan aralıkların birbirleriyle **çakışmaması** için diziden çıkarılması gereken **en az** aralık sayısını döndürün.

Uç noktaları yalnızca birbirine değen aralıklar (örneğin `[1, 2]` ve `[2, 3]`) çakışıyor **sayılmaz**.

### Örnek 1

```text
Girdi:  intervals = [[1,2],[2,3],[3,4],[1,3]]
Çıktı:  1
Açıklama: [1,3] aralığı çıkarıldığında geriye kalan [1,2], [2,3] ve [3,4] aralıkları çakışmaz.
```

### Örnek 2

```text
Girdi:  intervals = [[1,2],[1,2],[1,2]]
Çıktı:  2
Açıklama: Geriye çakışmayan tek bir [1,2] kalması için iki adet [1,2] aralığını çıkarmalıyız.
```

### Örnek 3

```text
Girdi:  intervals = [[1,2],[2,3]]
Çıktı:  0
Açıklama: Aralıklar yalnızca uç noktada değdiği için zaten çakışmıyor.
```

### Kısıtlar

- `1 <= intervals.length <= 10^5`
- `intervals[i].length == 2`
- `-5 * 10^4 <= start_i < end_i <= 5 * 10^4`

## İpuçları

- "En az kaç aralık çıkarılmalı?" sorusu, "birbiriyle çakışmayan **en fazla** kaç aralık seçilebilir?" sorusuyla birebir aynıdır.
- İki aralık birbiriyle çakıştığında hangisini tutmak gelecekteki aralıklar için daha çok boş yer bırakır?
- Aralıkları **bitiş zamanına** göre küçükten büyüğe sıralarsanız, her adımda en erken biten aralığı seçmek açgözlü (greedy) olarak en iyi tercihtir.
- Tutulan son aralığın bitiş noktasını (`prevEnd`) saklayın; sıradaki aralığın başlangıcı `prevEnd` değerinden küçükse çakışma vardır ve o aralığı çıkarırsınız.

## Çözüm

Bu problem klasik **etkinlik seçimi (interval scheduling)** probleminin tersinden sorulmuş halidir. En az sayıda aralığı silmek, birbirleriyle çakışmayan en fazla sayıda aralığı tutmak demektir.

Açgözlü (greedy) fikir şudur: Çakışan iki aralık arasında seçim yapmamız gerektiğinde **her zaman daha erken biten aralığı** tutmalıyız. Çünkü daha erken biten bir aralık, sağ tarafta gelecek aralıklar için daha geniş bir alan bırakır.

Bunu tek geçişte uygulamak için:
1. Aralıkları **bitiş zamanına (`end`)** göre küçükten büyüğe sıralarız.
2. İlk aralığı tutarız ve bitiş noktasını `prevEnd = intervals[0][1]` olarak kaydederiz.
3. Sıradaki her `[start, end]` aralığına bakarız:
   - Eğer `start < prevEnd` ise bu aralık önceki tutulan aralıkla çakışıyordur. Sıralama sayesinde `end >= prevEnd` olduğundan, yeni aralığı silmek (`removed++`) ve daha erken biten önceki aralığı korumak her zaman en doğrusudur.
   - Eğer `start >= prevEnd` ise çakışma yoktur; bu aralığı tutarız ve sınırımızı `prevEnd = end` olarak güncelleriz.

```csharp solution
public class Solution
{
    public int EraseOverlapIntervals(int[][] intervals)
    {
        // Gelecekte en fazla yeri bırakmak için aralıkları bitiş zamanına göre sırala.
        Array.Sort(intervals, (a, b) => a[1].CompareTo(b[1]));

        int removed = 0;
        int prevEnd = intervals[0][1];

        for (int i = 1; i < intervals.Length; i++)
        {
            if (intervals[i][0] < prevEnd)
            {
                // Çakışma var: daha geç (veya aynı anda) biten mevcut aralığı çıkar.
                removed++;
            }
            else
            {
                // Çakışma yok: bu aralığı tut ve bitiş sınırını güncelle.
                prevEnd = intervals[i][1];
            }
        }

        return removed;
    }
}
```

```typescript solution
function eraseOverlapIntervals(intervals: number[][]): number {
  intervals.sort((a, b) => a[1] - b[1]);

  let removed = 0;
  let prevEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < prevEnd) {
      removed++;
    } else {
      prevEnd = intervals[i][1];
    }
  }

  return removed;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). Aralıkları bitiş zamanına göre sıralamak O(n log n), ardından tek geçişli döngü O(n) sürer.
- **Alan:** O(1) ek alan (sıralama algoritmasının kullandığı O(log n) yığın alanı dışında).

## Testler

```json
[
  { "args": [[[1, 2], [2, 3], [3, 4], [1, 3]]], "expected": 1, "sample": true },
  { "args": [[[1, 2], [1, 2], [1, 2]]], "expected": 2, "sample": true },
  { "args": [[[1, 2], [2, 3]]], "expected": 0, "sample": true },
  { "args": [[[1, 10]]], "expected": 0 },
  { "args": [[[1, 100], [11, 22], [1, 11], [2, 12]]], "expected": 2 },
  { "args": [[[-50, -30], [-40, -20], [-30, -10], [-10, 0]]], "expected": 1 },
  { "args": [[[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]]], "expected": 2 }
]
```
