---
title: Kth Largest Element in an Array
---
You are given an integer array `nums` and an integer `k`. Return the **`k`th largest** element in the array.

This means the `k`th largest element in sorted order, not the `k`th distinct element. Can you solve it without fully sorting the array?

### Example 1

```text
Input:  nums = [3, 2, 1, 5, 6, 4], k = 2
Output:  5
```

### Example 2

```text
Input:  nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4
Output:  4
```

### Constraints

- `1 <= k <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## Hints

- Sorting the array and taking element `n - k` takes O(n log n) and works. Can you do better?
- Keep the `k` largest elements in a min-heap; if the heap grows beyond `k`, drop its smallest element. At the end, the top is the answer.
- For O(n) on average, use Quickselect: partition around a pivot and recurse only into the side that contains the answer.

## Solution

### Min-heap of size k

As you walk the array, add each element to a min-heap. If the heap grows beyond `k` elements, remove the top (smallest) element; that element can't be among the `k` largest. At the end of the array, the heap holds exactly the `k` largest elements, and its top is the smallest of them, which is the `k`th largest element.

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
  // Binary min-heap stored in an array.
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

### Complexity

- **Time:** O(n log k).
- **Space:** O(k).

**Quickselect** runs in O(n) time on average: it partitions the array around a random pivot into "larger / smaller" and continues only on the side where the `k`th element falls. Its worst case is O(n²). In an interview, writing the heap solution and explaining quickselect along with its trade-off is a good balance.
