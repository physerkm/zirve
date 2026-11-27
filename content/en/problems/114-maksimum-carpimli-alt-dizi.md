---
title: Maximum Product Subarray
---

You are given an integer array `nums`. Find the **non-empty contiguous subarray** whose elements have the largest product, and return that product.

The test data is generated so that the answer fits in a 32-bit signed integer (`int`).

A contiguous subarray is an unbroken section of consecutive elements of the array.

### Example 1

```text
Input:  nums = [2, 3, -2, 4]
Output:  6
Explanation: The subarray [2, 3] gives the largest product, 6.
```

### Example 2

```text
Input:  nums = [-2, 0, -1]
Output:  0
Explanation: The result cannot be 2 because [-2, -1] is not a contiguous subarray; the largest product is 0, from [0].
```

### Constraints

- `1 <= nums.length <= 2 * 10^4`
- `-10 <= nums[i] <= 10`
- The product of any subarray of `nums` fits in a 32-bit signed integer.

## Hints

- If there were only positive numbers, keeping the maximum product so far, as in Kadane's algorithm, would be enough.
- But multiplying by a negative number flips the sign: a very small (negative) product can suddenly become a very large (positive) one when multiplied by a new negative number.
- So at each step, track not only the **maximum** product ending at that position (`curMax`) but also the **minimum** product (`curMin`).
- When you hit a zero (`0`), both `curMax` and `curMin` become zero, and the option of starting a new subarray from the next element (`Math.Max(n, curMax * n)`) kicks in.

## Solution

When maximizing a sum (Kadane's algorithm), negative numbers only make the sum smaller. With products, however, **negative × negative = positive**, so the smallest (most negative) product so far can produce the largest positive product when multiplied by the next negative number.

So while scanning the array from left to right, we keep two values at once for the subarrays ending at position `i`:

- `curMax`: the **largest** product of the subarrays ending at position `i`,
- `curMin`: the **smallest** product of the subarrays ending at position `i`.

If the new element `n = nums[i]` is negative, multiplying `curMax` by `n` makes it smaller, while multiplying `curMin` by `n` makes it larger. To handle this in a single step, we swap `curMax` and `curMin` when `n < 0`. Then we update both values with the rule "either start a new subarray at `n`, or extend the previous subarray with `n`":

- `curMax = Math.Max(n, curMax * n)`
- `curMin = Math.Min(n, curMin * n)`

At each step we update the overall maximum with `result = Math.Max(result, curMax)`.

```csharp solution
public class Solution
{
    public int MaxProduct(int[] nums)
    {
        int curMax = nums[0];
        int curMin = nums[0];
        int result = nums[0];

        for (int i = 1; i < nums.Length; i++)
        {
            int n = nums[i];

            if (n < 0)
            {
                int temp = curMax;
                curMax = curMin;
                curMin = temp;
            }

            curMax = Math.Max(n, curMax * n);
            curMin = Math.Min(n, curMin * n);
            result = Math.Max(result, curMax);
        }

        return result;
    }
}
```

```typescript solution
function maxProduct(nums: number[]): number {
  let curMax = nums[0];
  let curMin = nums[0];
  let result = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];

    if (n < 0) {
      const temp = curMax;
      curMax = curMin;
      curMin = temp;
    }

    curMax = Math.max(n, curMax * n);
    curMin = Math.min(n, curMin * n);
    result = Math.max(result, curMax);
  }

  return result;
}
```

### Complexity

- **Time:** O(n). The array is scanned from start to end only once.
- **Space:** O(1). Only the `curMax`, `curMin` and `result` variables are kept.
