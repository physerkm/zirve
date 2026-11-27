---
title: Find Minimum in Rotated Sorted Array
---
You are given an array of **distinct** elements, sorted in increasing order and then rotated between `1` and `n` times. For example, `[0, 1, 2, 4, 5, 6, 7]` becomes `[4, 5, 6, 7, 0, 1, 2]` after 4 rotations; after `n` rotations it returns to itself.

Find the **minimum element** of the array in `O(log n)` time.

### Example 1

```text
Input:  nums = [3, 4, 5, 1, 2]
Output: 1
Explanation: The original array was [1, 2, 3, 4, 5], and it was rotated 3 times.
```

### Example 2

```text
Input:  nums = [4, 5, 6, 7, 0, 1, 2]
Output: 0
```

### Example 3

```text
Input:  nums = [11, 13, 15, 17]
Output: 11
Explanation: The array was rotated n times, so it is in sorted order.
```

### Constraints

- `1 <= nums.length <= 5000`
- `-5000 <= nums[i] <= 5000`
- All elements are distinct.
- `nums` is a sorted array rotated between 1 and n times.

## Hints

- A rotated array consists of two increasing parts. The minimum is the first element of the second part.
- Compare `nums[mid]` with `nums[hi]`. If `nums[mid] > nums[hi]`, where is the "break point"?
- If `nums[mid] > nums[hi]`, the minimum is definitely to the right of `mid`; otherwise, the minimum is at `mid` or to its left.

## Solution

### Binary search by comparing with the right end

The array consists of two sorted parts, and every element of the right part is smaller than those of the left part. We start with `lo = 0`, `hi = n - 1`:

- If `nums[mid] > nums[hi]`, `mid` is in the left (larger) part and there is a drop somewhere in between. The minimum is **to the right** of `mid`: `lo = mid + 1`.
- Otherwise, the range from `mid` to `hi` is in increasing order; the minimum may be `mid` or further left: `hi = mid`.

When `lo == hi`, the range narrows to a single element, and that element is the minimum. If the array was never rotated, the second rule always applies and `lo` stays at the start.

```csharp solution
public class Solution
{
    public int FindMin(int[] nums)
    {
        var lo = 0;
        var hi = nums.Length - 1;

        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (nums[mid] > nums[hi])
            {
                lo = mid + 1;
            }
            else
            {
                hi = mid;
            }
        }

        return nums[lo];
    }
}
```

```typescript solution
function findMin(nums: number[]): number {
  let lo = 0;
  let hi = nums.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] > nums[hi]) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return nums[lo];
}
```

### Complexity

- **Time:** O(log n). The range halves at every step.
- **Space:** O(1).

Comparing with `nums[hi]` instead of `nums[lo]` is a deliberate choice: in an array that was never rotated, `nums[mid] > nums[lo]` is always true, and comparing with the left end leads you in the wrong direction.
