---
title: Dizideki K. En Büyük Eleman
difficulty: medium
tags: [heap, dizi, siralama]
function: findKthLargest
params:
  - { name: nums, type: "int[]" }
  - { name: k, type: "int" }
returns: "int"
---
Bir tam sayı dizisi `nums` ve bir tam sayı `k` veriliyor. Dizideki **`k`. en büyük** elemanı döndürün.

Burada kastedilen, sıralı düzendeki `k`. en büyük elemandır; birbirinden farklı `k`. eleman değil. Diziyi tamamen sıralamadan çözebilir misiniz?

### Örnek 1

```text
Girdi:  nums = [3, 2, 1, 5, 6, 4], k = 2
Çıktı:  5
```

### Örnek 2

```text
Girdi:  nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4
Çıktı:  4
```

### Kısıtlar

- `1 <= k <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## İpuçları

- Diziyi sıralayıp `n - k`. elemanı almak O(n log n) sürer ve işe yarar. Daha iyisi?
- En büyük `k` elemanı bir min-heap'te tutun; heap `k`'yı aşarsa en küçüğünü atın. Sonunda tepe cevaptır.
- Ortalama O(n) için Quickselect: pivotla bölümleyip yalnızca cevabın bulunduğu tarafa inin.

## Çözüm

### Boyutu k olan min-heap

Diziyi gezerken her elemanı bir min-heap'e ekleriz. Heap `k` elemanı aşarsa tepedeki (en küçük) eleman çıkarılır; bu eleman en büyük `k` arasına giremez. Dizinin sonunda heap tam olarak en büyük `k` elemanı tutar ve tepesi bunların en küçüğü, yani `k`. en büyük elemandır.

```csharp solution
public class Solution
{
    public int FindKthLargest(int[] nums, int k)
    {
        var heap = new PriorityQueue<int, int>();
        foreach (var num in nums)
        {
            heap.Enqueue(num, num);
            if (heap.Count > k)
            {
                heap.Dequeue();
            }
        }

        return heap.Peek();
    }
}
```

```typescript solution
function findKthLargest(nums: number[], k: number): number {
  // Dizi üzerinde ikili min-heap.
  const heap: number[] = [];

  const push = (value: number): void => {
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };

  const pop = (): void => {
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
  };

  for (const num of nums) {
    push(num);
    if (heap.length > k) {
      pop();
    }
  }

  return heap[0];
}
```

### Karmaşıklık

- **Zaman:** O(n log k).
- **Alan:** O(k).

**Quickselect** ortalamada O(n) zamanda çalışır: rastgele bir pivotla diziyi "büyükler / küçükler" diye bölümler ve yalnızca `k`. elemanın düştüğü tarafta devam eder. En kötü durumu O(n²)'dir. Mülakatta heap çözümünü yazıp quickselect'i ödünleşimiyle birlikte anlatmak iyi bir dengedir.

## Testler

```json
[
  { "args": [[3, 2, 1, 5, 6, 4], 2], "expected": 5, "sample": true },
  { "args": [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], "expected": 4, "sample": true },
  { "args": [[1], 1], "expected": 1 },
  { "args": [[2, 1], 2], "expected": 1 },
  { "args": [[-1, -1], 2], "expected": -1 },
  { "args": [[7, 6, 5, 4, 3, 2, 1], 5], "expected": 3 },
  { "args": [[5, 2, 4, 1, 3, 6, 0], 4], "expected": 3 }
]
```
