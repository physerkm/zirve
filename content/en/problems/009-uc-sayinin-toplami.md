---
title: 3Sum
---
You are given an integer array `nums`. Return all triplets `[nums[i], nums[j], nums[k]]` whose sum is **zero**; `i`, `j` and `k` must be distinct indices.

The result **must not contain the same triplet more than once**. You can return the triplets, and the numbers within each triplet, in any order.

### Example 1

```text
Input:  nums = [-1, 0, 1, 2, -1, -4]
Output:  [[-1, -1, 2], [-1, 0, 1]]
```

### Example 2

```text
Input:  nums = [0, 1, 1]
Output:  []
```

### Example 3

```text
Input:  nums = [0, 0, 0]
Output:  [[0, 0, 0]]
```

### Constraints

- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`

## Hints

- Trying every triplet is O(n³). If you fix one number, what remains is the problem of "two numbers that add up to a given value".
- If you sort the array, you can find the remaining two numbers in O(n) with two pointers moving toward each other.
- To avoid duplicate triplets, don't fix the same value twice in the sorted array, and skip equal values after finding a pair.

## Solution

Sort the array. For each `i`, fix the value `nums[i]` and use two pointers to search the rest of the array for two numbers that sum to `-nums[i]`: if the sum is too small, move the left pointer; if it's too large, move the right pointer.

There are two places where you prevent duplicates:

1. If the fixed value is the same as the previous one, skip it; it would produce the same triplets again.
2. After finding a triplet, advance the left pointer past all elements with the same value.

In the sorted array, you can stop the search once the fixed value is positive: every number to its right is positive too, so the sum can't be zero.

```csharp solution
public class Solution
{
    public IList<IList<int>> ThreeSum(int[] nums)
    {
        Array.Sort(nums);
        var result = new List<IList<int>>();

        for (var i = 0; i < nums.Length - 2; i++)
        {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;

            var left = i + 1;
            var right = nums.Length - 1;

            while (left < right)
            {
                var sum = nums[i] + nums[left] + nums[right];

                if (sum < 0)
                {
                    left++;
                }
                else if (sum > 0)
                {
                    right--;
                }
                else
                {
                    result.Add(new List<int> { nums[i], nums[left], nums[right] });
                    left++;
                    right--;
                    while (left < right && nums[left] == nums[left - 1]) left++;
                }
            }
        }

        return result;
    }
}
```

```typescript solution
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        result.push([nums[i], nums[left], nums[right]]);
        left++;
        right--;
        while (left < right && nums[left] === nums[left - 1]) left++;
      }
    }
  }

  return result;
}
```

### Complexity

- **Time:** O(n²). Sorting is O(n log n); two pointers for each fixed element is O(n).
- **Space:** O(1) apart from the space used by sorting (excluding the output).

In JavaScript, `sort()` compares elements as **strings** by default (`[10, 9, 1]` → `[1, 10, 9]`). Always pass a comparison function when sorting numbers.
