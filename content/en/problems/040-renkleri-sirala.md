---
title: Sort Colors
---
You are given an array `nums` of objects colored red, white, and blue. The colors are represented by the numbers `0`, `1`, and `2`, respectively.

Sort the array **in place** so that objects of the same color are adjacent and the colors are in the order red, white, blue, and return the sorted array.

Don't use the library's built-in sort function.

### Example 1

```text
Input:  nums = [2, 0, 2, 1, 1, 0]
Output: [0, 0, 1, 1, 2, 2]
```

### Example 2

```text
Input:  nums = [2, 0, 1]
Output: [0, 1, 2]
```

### Constraints

- `1 <= nums.length <= 300`
- `nums[i]` is either `0`, `1`, or `2`.

**Follow-up:** Can you sort the array in a **single pass** using only constant extra space?

## Hints

- The simple solution takes two passes: first count the 0s, 1s and 2s, then rewrite the array from those counts.
- For a single pass, split the array into regions: 0s at the start, 2s at the end, and 1s and not-yet-examined elements in the middle.
- Use three pointers: where the 0s end, the element currently being examined, and where the 2s begin.
- When you move a 2 to the end, you haven't examined the element that comes back from there yet. Don't advance on that iteration.

## Solution

This is known as the "Dutch national flag" problem. We split the array into four regions with three pointers:

```text
[0, low)       0s
[low, mid)     1s
[mid, high]    not examined yet
(high, end]    2s
```

Initially, the whole array is the "not examined" region. On each iteration we look at `nums[mid]`:

- **If it is 0**, swap it with the element at `low`; `low` and `mid` both advance by one. The element coming back from `low` is either a 1 or (when `low == mid`) the same 0; in neither case does it need to be examined again.
- **If it is 1**, it is already in the right region; only `mid` advances.
- **If it is 2**, swap it with the element at `high` and move `high` back by one. Since the element coming from `high` hasn't been examined yet, **`mid` does not advance**; that element is examined on the next iteration.

On each iteration either `mid` moves right or `high` moves left; the "not examined" region shrinks by one element each time, and the loop ends after exactly `n` iterations.

```csharp solution
public class Solution
{
    public int[] SortColors(int[] nums)
    {
        // The array is kept as four regions:
        //   [0, low)       0s
        //   [low, mid)     1s
        //   [mid, high]    not examined yet
        //   (high, end]    2s
        int low = 0;
        int mid = 0;
        int high = nums.Length - 1;

        // Each iteration moves either mid right or high left; the loop runs exactly n times.
        while (mid <= high)
        {
            if (nums[mid] == 0)
            {
                // Move the 0 to the end of the 0s. What comes back from low is a 1
                // (or the same 0 when low == mid); both regions grow by one.
                (nums[low], nums[mid]) = (nums[mid], nums[low]);
                low++;
                mid++;
            }
            else if (nums[mid] == 1)
            {
                // Already in the 1s region.
                mid++;
            }
            else
            {
                // Move the 2 to the start of the 2s. What comes from high hasn't been examined yet;
                // mid stays put and examines it on the next iteration.
                (nums[mid], nums[high]) = (nums[high], nums[mid]);
                high--;
            }
        }

        return nums;
    }
}
```

```typescript solution
function sortColors(nums: number[]): number[] {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }

  return nums;
}
```

### Complexity

- **Time:** O(n), a single pass.
- **Space:** O(1).

The most common mistake is also advancing `mid` after moving a 2 to the end. With an input like `[2, 0, 1]`, the element coming from the end is skipped without being examined, and the array stays unsorted.

**Alternative:** Counting sort (counting the 0s, 1s and 2s and rewriting the array) also uses O(n) time and O(1) space, but it scans the array twice.
