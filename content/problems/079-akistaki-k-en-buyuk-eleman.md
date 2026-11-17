---
title: Akıştaki K. En Büyük Eleman
difficulty: easy
tags: [heap, tasarim, dizi]
kind: class
class: KthLargest
constructor:
  - { name: k, type: "int" }
  - { name: nums, type: "int[]" }
methods:
  - { name: add, params: [{ name: val, type: "int" }], returns: "int" }
---
Bir sayı akışındaki **`k`. en büyük** elemanı bulan bir sınıf tasarlayın. Burada kastedilen, sıralı düzendeki `k`. en büyük elemandır; birbirinden farklı `k`. eleman değil.

`KthLargest` sınıfını gerçekleştirin:

- `KthLargest(k, nums)` nesneyi `k` ve başlangıç sayıları `nums` ile oluşturur.
- `add(val)` `val`'ı akışa ekler ve akıştaki **`k`. en büyük** elemanı döndürür.

### Örnek

```text
İşlemler:  KthLargest(3, [4, 5, 8, 2]), add(3), add(5), add(10), add(9), add(4)
Çıktı:     null,                        4,      5,      5,       8,      8
```

### Kısıtlar

- `0 <= nums.length <= 10^4`
- `1 <= k <= nums.length + 1`
- `-10^4 <= nums[i], val <= 10^4`
- `add` en fazla `10^4` kez çağrılır.
- `add` çağrıldığında akışta en az `k` eleman bulunur.

## İpuçları

- Her `add` sonrasında bütün akışı sıralamak çok pahalıdır.
- `k`. en büyük eleman, en büyük `k` elemanın **en küçüğüdür**. Yalnızca en büyük `k` elemanı saklamak yeter.
- Boyutu `k` ile sınırlı bir **min-heap** kullanın: tepesi her zaman cevaptır.

## Çözüm

### Boyutu k olan min-heap

En büyük `k` elemanı bir min-heap'te tutarız. Heap'in tepesi bu `k` elemanın en küçüğüdür, yani akıştaki `k`. en büyük elemandır.

`add(val)` önce `val`'ı heap'e ekler; heap `k`'dan büyük olursa en küçük eleman (tepe) çıkarılır. Çıkan eleman en büyük `k` arasına giremeyeceği için bir daha hiç gerekmez. Sonra tepe döndürülür. Başlangıç sayıları da aynı yöntemle tek tek eklenir.

```csharp solution
public class KthLargest
{
    private readonly int k;
    private readonly PriorityQueue<int, int> heap = new();

    public KthLargest(int k, int[] nums)
    {
        this.k = k;
        foreach (var num in nums)
        {
            Add(num);
        }
    }

    public int Add(int val)
    {
        heap.Enqueue(val, val);
        if (heap.Count > k)
        {
            heap.Dequeue();
        }

        return heap.Peek();
    }
}
```

```typescript solution
class KthLargest {
  private k: number;
  private heap: number[] = [];

  constructor(k: number, nums: number[]) {
    this.k = k;
    for (const num of nums) {
      this.add(num);
    }
  }

  add(val: number): number {
    this.push(val);
    if (this.heap.length > this.k) {
      this.pop();
    }

    return this.heap[0];
  }

  // Dizi üzerinde ikili min-heap.
  private push(value: number): void {
    const heap = this.heap;
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }

  private pop(): void {
    const heap = this.heap;
    const last = heap.pop()!;
    if (heap.length === 0) return;
    heap[0] = last;
    let i = 0;
    while (true) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
      if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
      if (smallest === i) break;
      [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
      i = smallest;
    }
  }
}
```

### Karmaşıklık

- **Zaman:** `add` O(log k). Kurucu O(n log k).
- **Alan:** O(k).

JavaScript/TypeScript'te hazır bir öncelik kuyruğu olmadığı için mülakatlarda dizi üzerinde ikili heap yazmak sık beklenir: `push` yukarı, `pop` aşağı süzme yapar.

## Testler

```json
[
  {
    "ops": ["KthLargest", "add", "add", "add", "add", "add"],
    "args": [[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]],
    "expected": [null, 4, 5, 5, 8, 8],
    "sample": true
  },
  {
    "ops": ["KthLargest", "add", "add", "add", "add", "add"],
    "args": [[1, []], [-3], [-2], [-4], [0], [4]],
    "expected": [null, -3, -2, -2, 0, 4]
  },
  {
    "ops": ["KthLargest", "add", "add", "add"],
    "args": [[2, [0]], [-1], [1], [-2]],
    "expected": [null, -1, 0, 0]
  },
  {
    "ops": ["KthLargest", "add", "add", "add", "add"],
    "args": [[4, [7, 7, 7, 7, 8, 3]], [2], [10], [9], [9]],
    "expected": [null, 7, 7, 7, 8]
  }
]
```
