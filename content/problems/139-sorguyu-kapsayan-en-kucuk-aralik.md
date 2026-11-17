---
title: Her Sorguyu Kapsayan En Küçük Aralık
difficulty: hard
tags: [aralik, heap, siralama]
function: minInterval
params:
  - { name: intervals, type: "int[][]" }
  - { name: queries, type: "int[]" }
returns: "int[]"
---
`intervals[i] = [left_i, right_i]` biçiminde 2 boyutlu bir tam sayı dizisi `intervals` ve sorgu noktalarını içeren bir `queries` dizisi veriliyor. Her aralık kapalı bir aralıktır (`left_i` ve `right_i` uç noktaları aralığa dahildir) ve bir aralığın **boyutu** `right_i - left_i + 1` olarak tanımlanır.

Her `queries[j]` sorgusu için, `left_i <= queries[j] <= right_i` koşulunu sağlayan (yani sorgu noktasını kapsayan) **en küçük boyutlu** aralığın boyutunu bulun. Eğer `queries[j]` değerini kapsayan hiçbir aralık yoksa, o sorgu için cevap `-1` olmalıdır.

Sonuçları sorguların orijinal sırasına göre bir dizi olarak döndürün.

### Örnek 1

```text
Girdi:  intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]
Çıktı:  [3,3,1,4]
Açıklama:
- Sorgu = 2: Kapsayan en küçük aralık [2,4] (boyut: 4 - 2 + 1 = 3).
- Sorgu = 3: Kapsayan en küçük aralık [2,4] (boyut: 4 - 2 + 1 = 3).
- Sorgu = 4: Kapsayan en küçük aralık [4,4] (boyut: 4 - 4 + 1 = 1).
- Sorgu = 5: Kapsayan en küçük aralık [3,6] (boyut: 6 - 3 + 1 = 4).
```

### Örnek 2

```text
Girdi:  intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]
Çıktı:  [2,-1,4,6]
Açıklama:
- Sorgu = 2: En küçük aralık [2,3] (boyut 2).
- Sorgu = 19: Kapsayan hiçbir aralık yok (-1).
- Sorgu = 5: En küçük aralık [2,5] (boyut 4).
- Sorgu = 22: En küçük aralık [20,25] (boyut 6).
```

### Kısıtlar

- `1 <= intervals.length <= 10^5`
- `1 <= queries.length <= 10^5`
- `intervals[i].length == 2`
- `1 <= left_i <= right_i <= 10^7`
- `1 <= queries[j] <= 10^7`

## İpuçları

- Her sorgu için tüm aralıkları baştan taramak O(N · Q) sürer ve zaman sınırını aşar. Sorgular önceden bilindiğine göre **çevrimdışı (offline)** işlem yapabiliriz.
- Hem aralıkları başlangıç noktasına (`left`) göre hem de sorguları küçükten büyüğe sıralayın (sorguların orijinal indekslerini saklayarak).
- Bir `q` sorgusuna geldiğimizde, `left <= q` olan tüm aralıkları `(boyut, right)` çifti olarak bir **Min-Heap**'e ekleyin.
- Heap'in tepesindeki aralığın `right < q` ise bu aralık artık `q` ve sonraki daha büyük sorguları kapsayamaz; heap'ten çıkarın. Tepede kalan ilk geçerli aralık en küçük boyutlu aralıktır.

## Çözüm

Sorguların tamamı baştan verildiği için sorguları küçükten büyüğe doğru sırayla yanıtlayabiliriz (**offline query processing**). Sonuç dizisini doğru sırada doldurabilmek için sorguların orijinal indekslerini `order` dizisinde tutar ve bu diziyi sorgu değerlerine göre sıralarız. Aralıkları da başlangıç noktasına (`left`) göre küçükten büyüğe sıralarız.

Aday aralıkları boyutlarına göre hızlıca seçebilmek için bir **Min-Heap (Öncelik Kuyruğu)** kullanırız. Heap her aralık için `(size, right)` bilgisini tutar ve en küçük `size` değerine sahip aralığı en üstte bulundurur.

Sıralı her `q` sorgusu için:
1. Başlangıç noktası `left <= q` olan bütün aralıkları sırayla heap'e ekleriz (`i` işaretçisi yalnızca ileri gider).
2. Heap'in tepesindeki aralığın bitiş noktası `right < q` olduğu sürece o aralığı heap'ten çıkarırız; çünkü `q` değerinin solunda kalmış bir aralık ne `q`'yu ne de bundan sonraki daha büyük sorguları kapsayabilir.
3. Temizlikten sonra heap boş değilse tepedeki elemanın `size` değeri `q`'yu kapsayan en küçük aralığın boyutudur; boşsa cevap `-1` olur.

```csharp solution
public class Solution
{
    public int[] MinInterval(int[][] intervals, int[] queries)
    {
        // Aralıkları başlangıç noktasına göre sırala.
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));

        // Sorguların orijinal indekslerini koruyarak küçükten büyüğe sırala.
        int qLen = queries.Length;
        int[] order = new int[qLen];
        for (int j = 0; j < qLen; j++)
            order[j] = j;
        Array.Sort(order, (a, b) => queries[a].CompareTo(queries[b]));

        // Min-Heap: eleman (size, right), öncelik size.
        var pq = new PriorityQueue<(int size, int right), int>();
        int[] result = new int[qLen];
        int i = 0;

        foreach (int qIdx in order)
        {
            int q = queries[qIdx];

            // Başlangıcı q veya daha küçük olan tüm aralıkları heap'e ekle.
            while (i < intervals.Length && intervals[i][0] <= q)
            {
                int size = intervals[i][1] - intervals[i][0] + 1;
                pq.Enqueue((size, intervals[i][1]), size);
                i++;
            }

            // Bitişi q'dan küçük olan (süresi geçmiş) aralıkları tepeden temizle.
            while (pq.Count > 0 && pq.Peek().right < q)
                pq.Dequeue();

            result[qIdx] = pq.Count > 0 ? pq.Peek().size : -1;
        }

        return result;
    }
}
```

```typescript solution
function minInterval(intervals: number[][], queries: number[]): number[] {
  intervals.sort((a, b) => a[0] - b[0]);

  const qLen = queries.length;
  const order = Array.from({ length: qLen }, (_, j) => j);
  order.sort((a, b) => queries[a] - queries[b]);

  // Min-Heap: [size, right]
  const heap: [number, number][] = [];
  const push = (item: [number, number]) => {
    heap.push(item);
    let idx = heap.length - 1;
    while (idx > 0) {
      const p = (idx - 1) >> 1;
      if (heap[p][0] <= heap[idx][0]) break;
      [heap[p], heap[idx]] = [heap[idx], heap[p]];
      idx = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let idx = 0;
      while (true) {
        let smallest = idx;
        const l = 2 * idx + 1;
        const r = 2 * idx + 2;
        if (l < heap.length && heap[l][0] < heap[smallest][0]) smallest = l;
        if (r < heap.length && heap[r][0] < heap[smallest][0]) smallest = r;
        if (smallest === idx) break;
        [heap[idx], heap[smallest]] = [heap[smallest], heap[idx]];
        idx = smallest;
      }
    }
    return top;
  };

  const result = new Array<number>(qLen);
  let i = 0;

  for (const qIdx of order) {
    const q = queries[qIdx];

    while (i < intervals.length && intervals[i][0] <= q) {
      const size = intervals[i][1] - intervals[i][0] + 1;
      push([size, intervals[i][1]]);
      i++;
    }

    while (heap.length > 0 && heap[0][1] < q) {
      pop();
    }

    result[qIdx] = heap.length > 0 ? heap[0][0] : -1;
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n log n + q log q + n log n) = O((n + q) log n + q log q). Aralıkların sıralanması O(n log n), sorguların sıralanması O(q log q) sürer. Her aralık heap'e en fazla bir kez girer ve bir kez çıkar (toplam O(n log n)).
- **Alan:** O(n + q). Heap en fazla `n` aralık, `order` dizisi ise `q` indeks tutar.

## Testler

```json
[
  { "args": [[[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]], "expected": [3, 3, 1, 4], "sample": true },
  { "args": [[[2, 3], [2, 5], [1, 8], [20, 25]], [2, 19, 5, 22]], "expected": [2, -1, 4, 6], "sample": true },
  { "args": [[[1, 10]], [1, 5, 10, 11]], "expected": [10, 10, 10, -1] },
  { "args": [[[5, 5], [1, 10], [3, 7]], [5, 3, 9, 2]], "expected": [1, 5, 10, 10] },
  { "args": [[[10, 20], [30, 40]], [5, 25, 45]], "expected": [-1, -1, -1] },
  { "args": [[[1, 5], [2, 6], [3, 7]], [3, 3, 3]], "expected": [5, 5, 5] }
]
```
