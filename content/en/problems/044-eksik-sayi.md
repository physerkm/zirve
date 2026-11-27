---
title: Missing Number
---
You are given an array `nums` of `n` elements. It contains `n` **distinct** numbers from the range `[0, n]`. Return the only number in that range that is **missing** from the array.

### Example 1

```text
Input:  nums = [3, 0, 1]
Output: 2
Explanation: n = 3, so the numbers are in the range [0, 3]. 2 is missing from the array.
```

### Example 2

```text
Input:  nums = [0, 1]
Output: 2
```

### Example 3

```text
Input:  nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]
Output: 8
```

### Constraints

- `1 <= n <= 10^4`
- `0 <= nums[i] <= n`
- All elements are distinct.

**Follow-up:** Can you solve it in O(n) time and O(1) extra space?

## Hints

- Sorting or using a set works, but it costs more time or memory.
- What would the sum of the array be if no number were missing? There is a closed-form formula for `0 + 1 + … + n`.
- What does the difference between the expected sum and the actual sum tell you?

## Solution

Exactly one of the numbers from `0` to `n` is missing from the array, and `n` is the array's length.

If no number were missing, the sum would be `0 + 1 + … + n = n · (n + 1) / 2` (Gauss's formula). If we add up the numbers in the array and subtract that from this value, every other number appears in both sums and cancels out; only the missing number remains.

Since `n` is at most 10,000, the expected sum is at most 50,005,000 and fits comfortably in an `int`; there is no overflow concern.

```csharp solution
public class Solution
{
    public int MissingNumber(int[] nums)
    {
        // nums holds the numbers 0..n with exactly one missing; n is the array's length.
        int n = nums.Length;

        // With none missing, the sum would be 0 + 1 + ... + n = n * (n + 1) / 2.
        // Since n is at most 10,000, this is at most 50,005,000 and fits in an int.
        int expectedSum = n * (n + 1) / 2;

        int actualSum = 0;
        foreach (int num in nums)
        {
            actualSum += num;
        }

        // Every other number is in both sums and cancels out; only the missing one remains.
        return expectedSum - actualSum;
    }
}
```

```typescript solution
function missingNumber(nums: number[]): number {
  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;

  let actualSum = 0;
  for (const num of nums) {
    actualSum += num;
  }

  return expectedSum - actualSum;
}
```

### Complexity

- **Time:** O(n), a single pass.
- **Space:** O(1).

**Alternative (XOR):** XOR together all the numbers in `0..n` and all the elements of the array. A number XORed twice cancels itself out (`x ^ x = 0`); the missing number is what remains. Since this method never adds anything, it carries no overflow risk even when `n` is very large.
