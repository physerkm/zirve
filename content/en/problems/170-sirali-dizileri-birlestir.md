---
title: Merge Sorted Array
---
You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order, and their element counts `m` and `n`. Merge `nums2` into `nums1` to get **a single sorted array**.

`nums1` has length `m + n`: the first `m` elements are the values to merge, and the last `n` elements are `0` and should be ignored. The result must be written **in place inside `nums1`**, and `nums1` must be returned so the tests can see it.

### Example 1

```text
Input:  nums1 = [1, 2, 3, 0, 0, 0], m = 3, nums2 = [2, 5, 6], n = 3
Output:  [1, 2, 2, 3, 5, 6]
```

### Example 2

```text
Input:  nums1 = [1], m = 1, nums2 = [], n = 0
Output:  [1]
```

### Example 3

```text
Input:  nums1 = [0], m = 0, nums2 = [1], n = 1
Output:  [1]
```

### Constraints

- `nums1.length == m + n`, `nums2.length == n`
- `0 <= m, n <= 200`, `1 <= m + n <= 200`
- `-10^9 <= nums1[i], nums2[j] <= 10^9`

**Follow-up:** Can you solve it in O(m + n) time?

## Hints

- If you try to merge from the front, you overwrite elements of `nums1` that haven't been read yet.
- The end of `nums1` is empty! Place the largest elements **from back to front**.
- Start with `i = m - 1`, `j = n - 1` and the write position `k = m + n - 1`. Once `nums2` is exhausted, you're done; the remaining elements of `nums1` are already in place.

## Solution

### Three pointers from back to front

The largest element is the larger of the two arrays' last elements, and it goes at the very end of the result. Thanks to the `n` empty cells at the end of `nums1`, writing from the back never overwrites an element that hasn't been read yet: the write position `k` is always to the right of `i` or equal to it.

The loop runs as long as `j >= 0`. When `nums2` is exhausted, the remaining elements of `nums1` are already in the right place.

```csharp solution
public class Solution
{
    public int[] Merge(int[] nums1, int m, int[] nums2, int n)
    {
        var i = m - 1;
        var j = n - 1;
        var k = m + n - 1;

        while (j >= 0)
        {
            if (i >= 0 && nums1[i] > nums2[j])
            {
                nums1[k--] = nums1[i--];
            }
            else
            {
                nums1[k--] = nums2[j--];
            }
        }

        return nums1;
    }
}
```

```typescript solution
function merge(nums1: number[], m: number, nums2: number[], n: number): number[] {
  let i = m - 1;
  let j = n - 1;
  let k = m + n - 1;

  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }

  return nums1;
}
```

### Complexity

- **Time:** O(m + n).
- **Space:** O(1).
