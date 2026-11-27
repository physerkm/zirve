---
title: Maximum Subarray
---
You are given an integer array `nums`. Find the **contiguous subarray** (containing at least one number) with the largest sum, and return that sum.

A subarray is a contiguous (unbroken) part of an array.

### Example 1

```text
Input:  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output:  6
Explanation: The subarray [4, -1, 2, 1] has the largest sum, 6.
```

### Example 2

```text
Input:  nums = [1]
Output:  1
Explanation: The single-element subarray [1] has sum 1.
```

### Example 3

```text
Input:  nums = [5, 4, -1, 7, 8]
Output:  23
Explanation: Choosing the whole subarray [5, 4, -1, 7, 8] gives a sum of 23.
```

### Constraints

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## Hints

- While moving from left to right, keep the sum of the current subarray (`curSum`).
- If the `curSum` carried over from the previous elements is negative, adding a negative sum to the new number only makes the result smaller.
- In that case it is always better to drop the past entirely and start a new subarray at the current number (`curSum = Math.Max(n, curSum + n)`).
- At each step, store the largest `curSum` you have seen in `maxSum`.

## Solution

**Kadane's algorithm** scans the array from left to right in a single pass and computes the largest subarray sum ending at each index (`curSum`).

When we reach element `i` (`n = nums[i]`), we have two options:
1. Extend the current subarray: `curSum + n`
2. Drop the previous subarray and start fresh from element `n`: `n`

If `curSum < 0`, then `curSum + n < n`, so starting a new subarray at `n` is always more profitable than carrying a negative past. The line `curSum = Math.Max(n, curSum + n)` makes this decision on its own. At each step we update the highest sum so far with `maxSum = Math.Max(maxSum, curSum)`.

```csharp solution
public class Solution
{
    public int MaxSubArray(int[] nums)
    {
        int curSum = nums[0];
        int maxSum = nums[0];

        for (int i = 1; i < nums.Length; i++)
        {
            int n = nums[i];
            curSum = Math.Max(n, curSum + n);
            maxSum = Math.Max(maxSum, curSum);
        }

        return maxSum;
    }
}
```

```typescript solution
function maxSubArray(nums: number[]): number {
  let curSum = nums[0];
  let maxSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    curSum = Math.max(n, curSum + n);
    maxSum = Math.max(maxSum, curSum);
  }

  return maxSum;
}
```

### Complexity

- **Time:** O(n). The array is scanned from start to end only once.
- **Space:** O(1). Only the `curSum` and `maxSum` variables are used.
