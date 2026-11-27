---
title: Search in Rotated Sorted Array
---
You are given an array sorted in ascending order with **distinct elements** that has been rotated at an unknown index `k`: `[nums[k], ..., nums[n-1], nums[0], ..., nums[k-1]]`. For example, rotating `[0, 1, 2, 4, 5, 6, 7]` at index 3 gives `[4, 5, 6, 7, 0, 1, 2]`.

If `target` is in the array, return its index; otherwise return `-1`. Your algorithm must run in `O(log n)` time.

### Example 1

```text
Input:  nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Output:  4
```

### Example 2

```text
Input:  nums = [4, 5, 6, 7, 0, 1, 2], target = 3
Output:  -1
```

### Example 3

```text
Input:  nums = [1], target = 0
Output:  -1
```

### Constraints

- `1 <= nums.length <= 5000`
- `-10^4 <= nums[i], target <= 10^4`
- All elements are distinct.
- `nums` is a rotated version of a sorted array (it may not be rotated at all).

## Hints

- Split the array in the middle. **At least one** of the two halves is always properly sorted. Why?
- You can find the sorted half with the comparison `nums[lo] <= nums[mid]`.
- It's easy to test whether the target lies within the bounds of the sorted half. If it does, go there; otherwise go to the other half.

## Solution

### Binary search by finding the sorted half

A rotated array has exactly one break point. When the range is split by `mid`, the half that doesn't contain the break is properly sorted:

- If `nums[lo] <= nums[mid]`, the **left half** `[lo, mid]` is sorted. If the target is in the range `nums[lo] <= target < nums[mid]`, go left (`hi = mid - 1`); otherwise go right (`lo = mid + 1`).
- Otherwise, the **right half** `[mid, hi]` is sorted. If the target is in the range `nums[mid] < target <= nums[hi]`, go right; otherwise go left.

In a sorted half, the question "is the target here?" can be answered just by looking at the two ends. Even if the other half is mixed up, it gets split in two again at the next step.

```csharp solution
public class Solution
{
    public int Search(int[] nums, int target)
    {
        var lo = 0;
        var hi = nums.Length - 1;

        while (lo <= hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (nums[mid] == target)
            {
                return mid;
            }

            if (nums[lo] <= nums[mid])
            {
                if (nums[lo] <= target && target < nums[mid])
                {
                    hi = mid - 1;
                }
                else
                {
                    lo = mid + 1;
                }
            }
            else
            {
                if (nums[mid] < target && target <= nums[hi])
                {
                    lo = mid + 1;
                }
                else
                {
                    hi = mid - 1;
                }
            }
        }

        return -1;
    }
}
```

```typescript solution
function search(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) {
      return mid;
    }

    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[hi]) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
  }

  return -1;
}
```

### Complexity

- **Time:** O(log n).
- **Space:** O(1).

The equality in the comparison `nums[lo] <= nums[mid]` is needed for two-element ranges where `lo == mid`; in that case the left "half" is a single element and counts as sorted.
