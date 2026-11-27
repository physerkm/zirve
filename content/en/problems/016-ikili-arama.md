---
title: Binary Search
---
You are given an integer array `nums` sorted in ascending order with distinct elements, and a value `target`. If `target` is in the array, return its **index**; otherwise return `-1`.

Your solution must run in **O(log n)** time.

### Example 1

```text
Input:  nums = [-1, 0, 3, 5, 9, 12], target = 9
Output:  4
```

### Example 2

```text
Input:  nums = [-1, 0, 3, 5, 9, 12], target = 2
Output:  -1
```

### Constraints

- `1 <= nums.length <= 10^4`
- `nums` is sorted in ascending order and all its elements are distinct.

## Hints

- Since the array is sorted, looking at the middle element tells you which half the target is in.
- Keep the search range as `[left, right]` and halve it at each step.
- Don't forget to exclude `mid` from the range (`mid + 1` / `mid - 1`); otherwise you'll end up in an infinite loop.

## Solution

Work on the closed range `[left, right]`. If the middle element equals the target, return its index; if it's smaller than the target, the target is in the right half; if it's larger, the target is in the left half. When the range becomes empty (`left > right`), the target isn't in the array.

```csharp solution
public class Solution
{
    public int Search(int[] nums, int target)
    {
        var left = 0;
        var right = nums.Length - 1;

        while (left <= right)
        {
            var mid = left + (right - left) / 2;

            if (nums[mid] == target) return mid;

            if (nums[mid] < target)
            {
                left = mid + 1;
            }
            else
            {
                right = mid - 1;
            }
        }

        return -1;
    }
}
```

```typescript solution
function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) return mid;

    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
```

### Complexity

- **Time:** O(log n). The range is halved at each step.
- **Space:** O(1).

The form `left + (right - left) / 2` avoids the integer overflow that `(left + right) / 2` can cause on large arrays. In JavaScript, division produces a fractional result, so `Math.floor` is required.
