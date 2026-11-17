---
title: Veri Akışının Ortancası
difficulty: hard
tags: [heap, tasarim, siralama]
kind: class
class: MedianFinder
constructor: []
methods:
  - { name: addNum, params: [{ name: num, type: "int" }], returns: "void" }
  - { name: findMedian, params: [], returns: "double" }
---
**Ortanca (medyan)**, sıralı bir listenin ortasındaki değerdir. Eleman sayısı çiftse ortanca, ortadaki iki değerin ortalamasıdır. Örneğin `[2, 3, 4]` için ortanca `3`, `[2, 3]` için `2.5`'tir.

Bir sayı akışından gelen sayıları saklayan ve her an ortancayı verebilen `MedianFinder` sınıfını gerçekleştirin:

- `MedianFinder()` boş bir nesne oluşturur.
- `addNum(num)` akıştan gelen `num` sayısını ekler.
- `findMedian()` şimdiye kadar eklenen bütün sayıların ortancasını döndürür. `10^-5` içindeki yanıtlar kabul edilir.

### Örnek

```text
İşlemler:  MedianFinder, addNum(1), addNum(2), findMedian(), addNum(3), findMedian()
Çıktı:     null,         null,      null,      1.5,          null,      2.0
```

### Kısıtlar

- `-10^5 <= num <= 10^5`
- `findMedian` çağrılmadan önce en az bir sayı eklenmiş olur.
- Toplamda en fazla `5 * 10^4` çağrı yapılır.

**Devam soruları:** Bütün sayılar `[0, 100]` aralığındaysa nasıl iyileştirirdiniz? Sayıların %99'u bu aralıktaysa?

## İpuçları

- Her eklemeden sonra sıralamak ya da sıralı listeye yerleştirmek O(n) sürer. Ortanca için bütün sıralamaya ihtiyacınız yok.
- Sayıları iki yarıya ayırın: küçük yarı ve büyük yarı. Ortanca yalnızca küçük yarının en büyüğüne ve büyük yarının en küçüğüne bağlıdır.
- Küçük yarıyı bir **max-heap**'te, büyük yarıyı bir **min-heap**'te tutun ve boyutlarını dengeli bırakın (fark en fazla 1).

## Çözüm

### İki heap

- `low`: küçük yarı, **max-heap** (tepesi küçük yarının en büyüğü).
- `high`: büyük yarı, **min-heap** (tepesi büyük yarının en küçüğü).

Değişmez: `low`'daki her sayı `high`'dakilerden küçük ya da eşittir ve `low.Count`, `high.Count` ile ya eşittir ya da bir fazladır.

`addNum(num)`:

1. Sayı önce `low`'a eklenir.
2. `low`'un en büyüğü `high`'a taşınır. Böylece sıralama değişmezi korunur: `high`'a giden sayı, küçük yarının en büyüğüdür.
3. `high` daha kalabalık olduysa en küçüğü `low`'a geri taşınır.

`findMedian()`: Sayı adedi tekse ortanca `low`'un tepesi, çiftse iki tepenin ortalamasıdır.

```csharp solution
public class MedianFinder
{
    // Küçük yarı: en büyük önce çıksın diye öncelik olarak sayının eksisi kullanılır.
    private readonly PriorityQueue<int, int> low = new();
    private readonly PriorityQueue<int, int> high = new();

    public void AddNum(int num)
    {
        low.Enqueue(num, -num);

        var largestLow = low.Dequeue();
        high.Enqueue(largestLow, largestLow);

        if (high.Count > low.Count)
        {
            var smallestHigh = high.Dequeue();
            low.Enqueue(smallestHigh, -smallestHigh);
        }
    }

    public double FindMedian()
    {
        if (low.Count > high.Count)
        {
            return low.Peek();
        }

        return (low.Peek() + (double)high.Peek()) / 2.0;
    }
}
```

```typescript solution
class Heap {
  private items: number[] = [];
  private less: (a: number, b: number) => boolean;

  constructor(less: (a: number, b: number) => boolean) {
    this.less = less;
  }

  get size(): number {
    return this.items.length;
  }

  peek(): number {
    return this.items[0];
  }

  push(value: number): void {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(items[i], items[parent])) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop(): number {
    const items = this.items;
    const top = items[0];
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let best = i;
        if (left < items.length && this.less(items[left], items[best])) best = left;
        if (right < items.length && this.less(items[right], items[best])) best = right;
        if (best === i) break;
        [items[best], items[i]] = [items[i], items[best]];
        i = best;
      }
    }

    return top;
  }
}

class MedianFinder {
  private low = new Heap((a, b) => a > b);
  private high = new Heap((a, b) => a < b);

  addNum(num: number): void {
    this.low.push(num);
    this.high.push(this.low.pop());

    if (this.high.size > this.low.size) {
      this.low.push(this.high.pop());
    }
  }

  findMedian(): number {
    if (this.low.size > this.high.size) {
      return this.low.peek();
    }

    return (this.low.peek() + this.high.peek()) / 2;
  }
}
```

### Karmaşıklık

- **Zaman:** `addNum` O(log n), `findMedian` O(1).
- **Alan:** O(n).

Devam soruları için: sayılar `[0, 100]` aralığındaysa 101 elemanlı bir sayaç dizisi yeter ve ortanca sayaçlar üzerinde yürünerek bulunur. Sayıların çoğu bu aralıktaysa aralık dışındakiler için ayrı iki sayaç (ya da küçük listeler) tutulur.

## Testler

```json
[
  {
    "ops": ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"],
    "args": [[], [1], [2], [], [3], []],
    "expected": [null, null, null, 1.5, null, 2.0],
    "sample": true
  },
  {
    "ops": ["MedianFinder", "addNum", "findMedian", "addNum", "findMedian", "addNum", "findMedian", "addNum", "findMedian", "addNum", "findMedian"],
    "args": [[], [-1], [], [-2], [], [-3], [], [-4], [], [-5], []],
    "expected": [null, null, -1.0, null, -1.5, null, -2.0, null, -2.5, null, -3.0]
  },
  {
    "ops": ["MedianFinder", "addNum", "addNum", "addNum", "addNum", "findMedian"],
    "args": [[], [5], [15], [1], [3], []],
    "expected": [null, null, null, null, null, 4.0]
  },
  {
    "ops": ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "addNum", "findMedian"],
    "args": [[], [100000], [-100000], [], [7], [7], []],
    "expected": [null, null, null, 0.0, null, null, 7.0]
  }
]
```
