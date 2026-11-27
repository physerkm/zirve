---
title: Container With Most Water
---
You are given an integer array `height` of length `n`. At position `i`, there is a vertical line connecting the points `(i, 0)` and `(i, height[i])`.

Choose two of these lines to form a container together with the x-axis. Return the **maximum amount of water** the container can hold. You can't tilt the container: the water level stops at the shorter line.

### Example 1

```text
Input:  height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
Output:  49
Explanation: Choose the lines at indices 1 and 8 (heights 8 and 7).
Width 8 - 1 = 7, height min(8, 7) = 7, area 7 × 7 = 49.
```

### Example 2

```text
Input:  height = [1, 1]
Output:  1
```

### Constraints

- `2 <= height.length <= 10^5`
- `0 <= height[i] <= 10^4`

## Hints

- Trying every pair takes O(n²). Start with the widest container, that is, the lines at the two ends.
- For the area to grow in exchange for reducing the width by one, the height has to increase. Which line makes sense to drop?
- The shorter line limits the area no matter how tall the opposite line is. Move the shorter one inward.

## Solution

### Two pointers from both ends

The area between two lines is `min(height[left], height[right]) × (right - left)`. Start with the widest range, `left = 0` and `right = n - 1`.

Suppose `height[left] < height[right]`. Keeping the `left` line and moving `right` inward doesn't help: the width shrinks, and the height can be at most `height[left]`. So the best area `left` can ever give is the area computed **right now**, and `left` can safely be eliminated. That's why at each step you move **the shorter line** inward. If the heights are equal, it doesn't matter which one you move.

```csharp solution
public class Solution
{
    public int MaxArea(int[] height)
    {
        var left = 0;
        var right = height.Length - 1;
        var best = 0;

        while (left < right)
        {
            var area = Math.Min(height[left], height[right]) * (right - left);
            best = Math.Max(best, area);

            if (height[left] < height[right])
            {
                left++;
            }
            else
            {
                right--;
            }
        }

        return best;
    }
}
```

```typescript solution
function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let best = 0;

  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    best = Math.max(best, area);

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return best;
}
```

### Complexity

- **Time:** O(n). At each step, one pointer moves by one.
- **Space:** O(1).

What matters in the interview is being able to explain **why** the "move the shorter one" rule never misses a good answer: none of the possible containers using the eliminated line can be larger than the container you just measured.
