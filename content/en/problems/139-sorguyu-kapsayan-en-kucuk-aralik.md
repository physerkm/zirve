---
title: Minimum Interval to Include Each Query
---
You are given a 2D integer array `intervals` where `intervals[i] = [left_i, right_i]`, and an array `queries` of query points. Each interval is closed (the endpoints `left_i` and `right_i` are included in the interval), and the **size** of an interval is defined as `right_i - left_i + 1`.

For each query `queries[j]`, find the size of the **smallest** interval that satisfies `left_i <= queries[j] <= right_i` (that is, the interval contains the query point). If no interval contains `queries[j]`, the answer for that query must be `-1`.

Return the results as an array in the original order of the queries.

### Example 1

```text
Input:  intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]
Output:  [3,3,1,4]
Explanation:
- Query = 2: The smallest containing interval is [2,4] (size: 4 - 2 + 1 = 3).
- Query = 3: The smallest containing interval is [2,4] (size: 4 - 2 + 1 = 3).
- Query = 4: The smallest containing interval is [4,4] (size: 4 - 4 + 1 = 1).
- Query = 5: The smallest containing interval is [3,6] (size: 6 - 3 + 1 = 4).
```

### Example 2

```text
Input:  intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]
Output:  [2,-1,4,6]
Explanation:
- Query = 2: The smallest interval is [2,3] (size 2).
- Query = 19: No interval contains it (-1).
- Query = 5: The smallest interval is [2,5] (size 4).
- Query = 22: The smallest interval is [20,25] (size 6).
```

### Constraints

- `1 <= intervals.length <= 10^5`
- `1 <= queries.length <= 10^5`
- `intervals[i].length == 2`
- `1 <= left_i <= right_i <= 10^7`
- `1 <= queries[j] <= 10^7`

## Hints

- Scanning all intervals from scratch for every query takes O(N · Q) and exceeds the time limit. Since the queries are known in advance, we can process them **offline**.
- Sort the intervals by start point (`left`) and the queries in ascending order (keeping the original indices of the queries).
- When you reach a query `q`, push every interval with `left <= q` into a **min-heap** as a `(size, right)` pair.
- If the interval at the top of the heap has `right < q`, it can no longer cover `q` or any later, larger query; pop it from the heap. The first valid interval left at the top is the smallest one.

## Solution

Since all the queries are given up front, we can answer them in ascending order (**offline query processing**). To fill the result array in the correct order, we keep the original indices of the queries in an `order` array and sort that array by query value. We also sort the intervals by start point (`left`) in ascending order.

To quickly pick candidate intervals by size, we use a **min-heap (priority queue)**. The heap stores `(size, right)` for each interval and keeps the interval with the smallest `size` at the top.

For each sorted query `q`:
1. We push every interval whose start point satisfies `left <= q` into the heap in order (the `i` pointer only moves forward).
2. As long as the interval at the top of the heap has an end point `right < q`, we pop it, because an interval that lies to the left of `q` can cover neither `q` nor any larger query that comes after it.
3. After this cleanup, if the heap is not empty, the `size` of the top element is the size of the smallest interval containing `q`; if it is empty, the answer is `-1`.

```csharp solution
public class Solution
{
    public int[] MinInterval(int[][] intervals, int[] queries)
    {
        // Sort the intervals by start point.
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));

        // Sort the queries in ascending order while preserving their original indices.
        int qLen = queries.Length;
        int[] order = new int[qLen];
        for (int j = 0; j < qLen; j++)
            order[j] = j;
        Array.Sort(order, (a, b) => queries[a].CompareTo(queries[b]));

        // Min-heap: element (size, right), priority size.
        var pq = new PriorityQueue<(int size, int right), int>();
        int[] result = new int[qLen];
        int i = 0;

        foreach (int qIdx in order)
        {
            int q = queries[qIdx];

            // Push every interval that starts at q or earlier into the heap.
            while (i < intervals.Length && intervals[i][0] <= q)
            {
                int size = intervals[i][1] - intervals[i][0] + 1;
                pq.Enqueue((size, intervals[i][1]), size);
                i++;
            }

            // Clear expired intervals (those ending before q) from the top.
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

### Complexity

- **Time:** O(n log n + q log q + n log n) = O((n + q) log n + q log q). Sorting the intervals takes O(n log n) and sorting the queries takes O(q log q). Each interval enters the heap at most once and leaves it once (O(n log n) in total).
- **Space:** O(n + q). The heap holds at most `n` intervals, and the `order` array holds `q` indices.
