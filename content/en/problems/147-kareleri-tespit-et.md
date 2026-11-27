---
title: Detect Squares
---
You are given a stream of points on a plane. Design a data structure that supports the following operations:

- **Add:** A new point is added. The same point may be added more than once, and each copy counts as a separate point.
- **Count:** Given a query point `point`, return the number of ways to choose three of the added points so that, together with the query point, they form an **axis-aligned square with positive area**.

Implement the `DetectSquares` class:

- `DetectSquares()` creates an empty structure.
- `add(point)` adds the point `point = [x, y]`.
- `count(point)` returns the number of squares defined above.

### Example

```text
Operations:  DetectSquares, add([3,10]), add([11,2]), add([3,2]), count([11,10]), count([14,8]), add([11,2]), count([11,10])
Output:      null,          null,        null,        null,       1,               0,              null,        2
Explanation: In the last query, [11,2] has been added twice, so there are two different ways to choose the square.
```

### Constraints

- `point.length == 2`
- `0 <= x, y <= 1000`
- `add` and `count` are called at most `3000` times in total.

## Hints

- If the query point is one corner of the square, choosing the opposite (diagonal) corner fully determines the square.
- For each added point, check whether it can be the diagonal corner: `|px - qx| == |py - qy| != 0` must hold.
- The other two corners are `(qx, py)` and `(px, qy)`. If you keep point counts in a hash table, the contribution is `count(p) × count(qx, py) × count(px, qy)`.

## Solution

### Counting via the diagonal corner

We keep how many times each point was added in a dictionary, and the distinct points in a list.

For `count(q)`, we try every point `p` in the list as a candidate diagonal corner. If `p` is not in the same row or column as `q` and the distances along the two axes are equal (`|px - qx| == |py - qy|`), a square can be formed. The remaining two corners are `(qx, py)` and `(px, qy)`. Since each corner may have been added more than once, the contribution is the product of the counts of the three corners.

```csharp solution
public class DetectSquares
{
    private readonly Dictionary<(int X, int Y), int> counts = new();
    private readonly List<(int X, int Y)> points = new();

    public void Add(int[] point)
    {
        var key = (point[0], point[1]);
        if (!counts.TryGetValue(key, out var c))
        {
            points.Add(key);
        }

        counts[key] = c + 1;
    }

    public int Count(int[] point)
    {
        var qx = point[0];
        var qy = point[1];
        var total = 0;

        foreach (var (px, py) in points)
        {
            if (px == qx || Math.Abs(px - qx) != Math.Abs(py - qy))
            {
                continue;
            }

            counts.TryGetValue((qx, py), out var a);
            counts.TryGetValue((px, qy), out var b);
            total += counts[(px, py)] * a * b;
        }

        return total;
    }
}
```

```typescript solution
class DetectSquares {
  private counts = new Map<string, number>();
  private points: [number, number][] = [];

  add(point: number[]): void {
    const key = `${point[0]},${point[1]}`;
    const c = this.counts.get(key);
    if (c === undefined) {
      this.points.push([point[0], point[1]]);
    }

    this.counts.set(key, (c ?? 0) + 1);
  }

  count(point: number[]): number {
    const [qx, qy] = point;
    let total = 0;

    for (const [px, py] of this.points) {
      if (px === qx || Math.abs(px - qx) !== Math.abs(py - qy)) continue;

      const a = this.counts.get(`${qx},${py}`) ?? 0;
      const b = this.counts.get(`${px},${qy}`) ?? 0;
      total += this.counts.get(`${px},${py}`)! * a * b;
    }

    return total;
  }
}
```

### Complexity

- **Time:** `add` is O(1), `count` is O(number of distinct points).
- **Space:** O(number of distinct points).

The `px == qx` check rules out zero-area "squares": combined with the equal-distance condition, it also excludes the case `py == qy`.
