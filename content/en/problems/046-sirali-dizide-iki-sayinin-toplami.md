---
title: Two Sum II - Input Array Is Sorted
---
You are given a **1-indexed** integer array `numbers` sorted in **non-decreasing order** (smallest to largest, not non-increasing) and a target value `target`. Find two numbers that add up to `target` and return their indices as `[index1, index2]` (`1 <= index1 < index2 <= numbers.length`).

Each input has exactly one solution, and you may not use the same element twice. Your solution must use only **constant extra space**.

### Example 1

```text
Input:  numbers = [2, 7, 11, 15], target = 9
Output: [1, 2]
Explanation: 2 + 7 = 9. index1 = 1, index2 = 2.
```

### Example 2

```text
Input:  numbers = [2, 3, 4], target = 6
Output: [1, 3]
```

### Example 3

```text
Input:  numbers = [-1, 0], target = -1
Output: [1, 2]
```

### Constraints

- `2 <= numbers.length <= 3 * 10^4`
- `-1000 <= numbers[i] <= 1000`
- `numbers` is sorted in non-decreasing order.
- `-1000 <= target <= 1000`
- There is exactly one solution.

## Hints

- The hash table from "Two Sum" works here too, but it uses O(n) extra space. How can you take advantage of the array being sorted?
- Add the smallest and the largest elements. If the sum is greater than the target, can the largest element be part of any solution?
- Put one pointer at the start and one at the end. If the sum is too large, move the right one left; if it is too small, move the left one right.

## Solution

### Two pointers from both ends

We start with `left = 0` and `right = n - 1`. If `numbers[left] + numbers[right]`:

- equals `target`, we found the answer.
- is **greater** than `target`, then `numbers[right]` is too large even with its smallest possible partner (`numbers[left]`). It won't work with any number further right either, so `right` moves one step left.
- is **less** than `target`, then by symmetry `numbers[left]` falls short even with its largest possible partner, so `left` moves one step right.

At every step, one element is definitively eliminated, and the solution never falls outside the range. As on LeetCode, the indices are returned 1-based.

```csharp solution
public class Solution
{
    public int[] TwoSum(int[] numbers, int target)
    {
        var left = 0;
        var right = numbers.Length - 1;

        while (left < right)
        {
            var sum = numbers[left] + numbers[right];
            if (sum == target)
            {
                return new[] { left + 1, right + 1 };
            }

            if (sum > target)
            {
                right--;
            }
            else
            {
                left++;
            }
        }

        return Array.Empty<int>();
    }
}
```

```typescript solution
function twoSum(numbers: number[], target: number): number[] {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    }

    if (sum > target) {
      right--;
    } else {
      left++;
    }
  }

  return [];
}
```

### Complexity

- **Time:** O(n). At every step, one of the two pointers moves one step inward.
- **Space:** O(1). Only two indices are stored.

Eliminating one end of the array at every step is the essence of the two-pointer pattern on sorted arrays. The same idea is the inner loop of the "3Sum" problem.
