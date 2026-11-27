---
title: K Closest Points to Origin
---
You are given an array `points` representing points on the coordinate plane (`points[i] = [xi, yi]`) and an integer `k`. Return the **`k` closest points** to the origin (the point `(0, 0)`).

The distance between two points is the Euclidean distance: the distance to the origin is computed with the formula `√(x² + y²)`. You may return the answer in **any order**; the answer is guaranteed to be unique.

### Example 1

```text
Input:  points = [[1, 3], [-2, 2]], k = 1
Output: [[-2, 2]]
Explanation:
  The distance of (1, 3) to the origin is √(1 + 9) = √10.
  The distance of (-2, 2) to the origin is √(4 + 4) = √8.
  Since √8 < √10, the closest point to the origin is [-2, 2].
```

### Example 2

```text
Input:  points = [[3, 3], [5, -1], [-2, 4]], k = 2
Output: [[3, 3], [-2, 4]]
Explanation:
  The squared distances are 18, 26 and 20, respectively. The two smallest distances are 18 and 20, so [3, 3] and [-2, 4] are returned.
```

### Constraints

- `1 <= k <= points.length <= 10^4`
- `-10^4 <= xi, yi <= 10^4`

## Hints

- You don't need to take the square root (`Math.Sqrt`) when comparing distances: the inequality `√(x₁² + y₁²) < √(x₂² + y₂²)` is exactly the same as `x₁² + y₁² < x₂² + y₂²`.
- Sorting the whole array takes O(n log n). But we only need to keep the `k` closest points.
- While keeping the `k` closest points seen so far together, which data structure should you use to quickly discard the **farthest** of them when a new point arrives?
- Use a **max-heap** whose size is capped at `k`: add every point, and if the size exceeds `k`, remove the point at the top (the farthest one).

## Solution

Sorting all the points by distance takes O(n log n) time; but when `k` is much smaller than `n`, sorting the whole array is unnecessary. We only need to keep the **`k` closest candidates** seen so far.

When examining a new point, to tell whether it is closer than the `k` candidates we have, we need to look at the **farthest point** among the candidates. To see the farthest candidate in O(1) and remove it in O(log k) when needed, we use a **max-heap**:

1. For each point, we compute `dist = x² + y²` without taking the square root.
2. We add the point to the `PriorityQueue` with priority `-dist` (thanks to the negative priority, the point with the largest `dist`, that is, the farthest point, sits at the top of the heap).
3. As soon as the heap's size exceeds `k` (`maxHeap.Count > k`), we drop the farthest point at the top with `Dequeue()`.
4. When the array is exhausted, exactly the `k` points closest to the origin remain in the heap.

```csharp solution
public class Solution
{
    public int[][] KClosest(int[][] points, int k)
    {
        PriorityQueue<int[], int> maxHeap = new PriorityQueue<int[], int>();

        foreach (int[] p in points)
        {
            int dist = p[0] * p[0] + p[1] * p[1];
            maxHeap.Enqueue(p, -dist);

            if (maxHeap.Count > k)
            {
                maxHeap.Dequeue();
            }
        }

        int[][] result = new int[k][];
        for (int i = 0; i < k; i++)
        {
            result[i] = maxHeap.Dequeue();
        }

        return result;
    }
}
```

```typescript solution
function kClosest(points: number[][], k: number): number[][] {
  const heap: { point: number[]; dist: number }[] = [];

  const siftUp = (idx: number): void => {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (heap[parent].dist >= heap[idx].dist) break;
      [heap[parent], heap[idx]] = [heap[idx], heap[parent]];
      idx = parent;
    }
  };

  const siftDown = (idx: number): void => {
    const n = heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && heap[left].dist > heap[largest].dist) largest = left;
      if (right < n && heap[right].dist > heap[largest].dist) largest = right;
      if (largest === idx) break;
      [heap[idx], heap[largest]] = [heap[largest], heap[idx]];
      idx = largest;
    }
  };

  for (const point of points) {
    const dist = point[0] * point[0] + point[1] * point[1];
    heap.push({ point, dist });
    siftUp(heap.length - 1);

    if (heap.length > k) {
      const last = heap.pop()!;
      if (heap.length > 0) {
        heap[0] = last;
        siftDown(0);
      }
    }
  }

  return heap.map((item) => item.point);
}
```

### Complexity

- **Time:** O(n log k). The heap's size never exceeds `k + 1`, so every insertion and removal takes O(log k).
- **Space:** O(k), for the at most `k + 1` elements kept in the heap.
