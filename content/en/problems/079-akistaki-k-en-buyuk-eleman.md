---
title: Kth Largest Element in a Stream
---
Design a class that finds the **`k`th largest** element in a stream of numbers. Note that this means the `k`th largest element in sorted order, not the `k`th distinct element.

Implement the `KthLargest` class:

- `KthLargest(k, nums)` creates the object with `k` and the initial numbers `nums`.
- `add(val)` adds `val` to the stream and returns the **`k`th largest** element in the stream.

### Example

```text
Operations: KthLargest(3, [4, 5, 8, 2]), add(3), add(5), add(10), add(9), add(4)
Output:     null,                        4,      5,      5,       8,      8
```

### Constraints

- `0 <= nums.length <= 10^4`
- `1 <= k <= nums.length + 1`
- `-10^4 <= nums[i], val <= 10^4`
- `add` is called at most `10^4` times.
- When `add` is called, there are at least `k` elements in the stream.

## Hints

- Sorting the whole stream after every `add` is too expensive.
- The `k`th largest element is the **smallest** of the `k` largest elements. It's enough to keep only the `k` largest elements.
- Use a **min-heap** whose size is capped at `k`: its top is always the answer.

## Solution

### A min-heap of size k

We keep the `k` largest elements in a min-heap. The top of the heap is the smallest of these `k` elements, that is, the `k`th largest element in the stream.

`add(val)` first adds `val` to the heap; if the heap grows larger than `k`, the smallest element (the top) is removed. The removed element can never make it into the top `k`, so it is never needed again. Then the top is returned. The initial numbers are added one by one in the same way.

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

  // Binary min-heap on top of an array.
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

### Complexity

- **Time:** `add` O(log k). The constructor is O(n log k).
- **Space:** O(k).

Since JavaScript/TypeScript has no built-in priority queue, interviewers often expect you to write a binary heap on an array: `push` sifts up, `pop` sifts down.
