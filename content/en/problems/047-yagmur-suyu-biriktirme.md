---
title: Trapping Rain Water
---
You are given an elevation map made of bars, each of width `1`, as an array `height` of non-negative integers. Compute **how much water is trapped** between the bars after it rains.

### Example 1

```text
Input:  height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
Output: 6
Explanation: A total of 6 units of water is trapped above indices 2, 4, 5, 6 and 9.
```

### Example 2

```text
Input:  height = [4, 2, 0, 3, 2, 5]
Output: 9
```

### Constraints

- `1 <= height.length <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

## Hints

- Think about a single bar: how much water sits above it? What role do the tallest bar to its left and the tallest bar to its right play?
- The water above bar `i` is `min(leftMax, rightMax) - height[i]`. If you precompute both maximums for every bar, you get O(n) time and O(n) space.
- To drop the extra arrays, use two pointers: the water above the bar on the side with the smaller maximum is known for certain.

## Solution

### Water per bar

The water level above bar `i` rises up to the **shorter** of the tallest wall to its left and the tallest wall to its right: `water[i] = min(leftMax[i], rightMax[i]) - height[i]`. Keeping these two maximums in separate arrays takes O(n) space.

### O(1) space with two pointers

`left` and `right` start at the two ends; `leftMax` holds the tallest wall seen from the left, and `rightMax` the tallest seen from the right. If `leftMax < rightMax`, there is certainly a wall of height **at least** `rightMax` to the right of bar `left`. So `left`'s water level is limited by `leftMax`, and its water can be computed right away: `leftMax - height[left]`. Then `left` moves one step right. In the symmetric case, the right side is processed.

Updating the maximum first and then adding the water automatically makes the water `0` when the bar itself is the tallest.

```csharp solution
public class Solution
{
    public int Trap(int[] height)
    {
        var left = 0;
        var right = height.Length - 1;
        var leftMax = 0;
        var rightMax = 0;
        var water = 0;

        while (left < right)
        {
            leftMax = Math.Max(leftMax, height[left]);
            rightMax = Math.Max(rightMax, height[right]);

            if (leftMax < rightMax)
            {
                water += leftMax - height[left];
                left++;
            }
            else
            {
                water += rightMax - height[right];
                right--;
            }
        }

        return water;
    }
}
```

```typescript solution
function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);

    if (leftMax < rightMax) {
      water += leftMax - height[left];
      left++;
    } else {
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
}
```

### Complexity

- **Time:** O(n). Each bar is processed once.
- **Space:** O(1).

There is also an O(n) solution with a monotonic stack (it adds up the water in horizontal layers), but two pointers is both shorter and uses constant space.
