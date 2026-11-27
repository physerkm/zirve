---
title: Find Median from Data Stream
---
The **median** is the middle value in a sorted list. If the number of elements is even, the median is the average of the two middle values. For example, the median of `[2, 3, 4]` is `3`, and the median of `[2, 3]` is `2.5`.

Implement the `MedianFinder` class, which stores numbers coming from a data stream and can report the median at any time:

- `MedianFinder()` initializes an empty object.
- `addNum(num)` adds the number `num` from the stream.
- `findMedian()` returns the median of all numbers added so far. Answers within `10^-5` of the actual answer are accepted.

### Example

```text
Operations: MedianFinder, addNum(1), addNum(2), findMedian(), addNum(3), findMedian()
Output:     null,         null,      null,      1.5,          null,      2.0
```

### Constraints

- `-10^5 <= num <= 10^5`
- At least one number has been added before `findMedian` is called.
- At most `5 * 10^4` calls are made in total.

**Follow-ups:** If all numbers are in the range `[0, 100]`, how would you optimize your solution? What if 99% of the numbers are in that range?

## Hints

- Sorting after every insertion, or inserting into a sorted list, takes O(n). You don't need the full ordering to get the median.
- Split the numbers into two halves: the smaller half and the larger half. The median depends only on the largest value of the smaller half and the smallest value of the larger half.
- Keep the smaller half in a **max-heap** and the larger half in a **min-heap**, and keep their sizes balanced (differing by at most 1).

## Solution

### Two heaps

- `low`: the smaller half, a **max-heap** (its top is the largest value of the smaller half).
- `high`: the larger half, a **min-heap** (its top is the smallest value of the larger half).

Invariant: every number in `low` is less than or equal to every number in `high`, and `low.Count` is either equal to `high.Count` or one greater.

`addNum(num)`:

1. Add the number to `low` first.
2. Move the largest value of `low` to `high`. This preserves the ordering invariant: the number that goes to `high` is the largest value of the smaller half.
3. If `high` now has more elements, move its smallest value back to `low`.

`findMedian()`: If the count is odd, the median is the top of `low`; if it is even, it is the average of the two tops.

```csharp solution
public class MedianFinder
{
    // Smaller half: the negated number is used as the priority so the largest comes out first.
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

### Complexity

- **Time:** `addNum` is O(log n), `findMedian` is O(1).
- **Space:** O(n).

For the follow-ups: if the numbers are in the range `[0, 100]`, an array of 101 counters is enough, and you find the median by walking over the counters. If most numbers are in that range, keep two separate counters (or small lists) for the numbers outside it.
