---
title: Longest Increasing Subsequence
---
You are given an integer array `nums`. Return the length of the longest **strictly increasing** subsequence.

A subsequence is obtained by deleting some elements (or none) while keeping the order of the remaining ones. For example, `[3, 6, 2, 7]` is a subsequence of the array `[0, 3, 1, 6, 2, 2, 7]`.

### Example 1

```text
Input:  nums = [10, 9, 2, 5, 3, 7, 101, 18]
Output:  4
Explanation: One of the longest increasing subsequences is [2, 3, 7, 101].
```

### Example 2

```text
Input:  nums = [0, 1, 0, 3, 2, 3]
Output:  4
```

### Example 3

```text
Input:  nums = [7, 7, 7, 7, 7, 7, 7]
Output:  1
```

### Constraints

- `1 <= nums.length <= 2500`
- `-10^4 <= nums[i] <= 10^4`

**Follow-up:** Can you solve it in O(n log n) time?

## Hints

- `dp[i]`: the length of the longest increasing subsequence **ending** at `nums[i]`. `dp[i] = 1 + max(dp[j])`, with `j < i` and `nums[j] < nums[i]`. This takes O(n²).
- For O(n log n): let `tails[k]` be **the smallest possible last element** of an increasing subsequence of length `k + 1`. This array is always in increasing order.
- For each new number, use binary search to find the first element in `tails` that is greater than or equal to it and overwrite it; if there's none, append it.

## Solution

### Patience sorting (the tails array)

`tails[k]` holds **the smallest last element** among all increasing subsequences of length `k + 1`. A smaller last element means more numbers can be appended later; that's why you keep the most "promising" sequence for each length.

For each `x`:

- If `x` is greater than every element in `tails`, it extends the longest sequence by one: append it.
- Otherwise, find the **first** `tails[k]` that is greater than or equal to `x` and replace it with `x`: a sequence of length `k + 1` can now end with a smaller number.

Since `tails` stays in increasing order, the search is done with binary search. At the end, the length of `tails` is the answer. (`tails` itself doesn't have to be an actual subsequence.)

```csharp solution
public class Solution
{
    public int LengthOfLIS(int[] nums)
    {
        var tails = new List<int>();
        foreach (var x in nums)
        {
            var lo = 0;
            var hi = tails.Count;
            while (lo < hi)
            {
                var mid = (lo + hi) / 2;
                if (tails[mid] < x)
                {
                    lo = mid + 1;
                }
                else
                {
                    hi = mid;
                }
            }

            if (lo == tails.Count)
            {
                tails.Add(x);
            }
            else
            {
                tails[lo] = x;
            }
        }

        return tails.Count;
    }
}
```

```typescript solution
function lengthOfLIS(nums: number[]): number {
  const tails: number[] = [];
  for (const x of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }

    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }

  return tails.length;
}
```

### Complexity

- **Time:** O(n log n).
- **Space:** O(n).

In an interview, a good flow is to set up the O(n²) DP first and then move on to the `tails` optimization. Searching for the first element "greater than or equal" enforces the **strictly** increasing condition; equal elements don't extend the sequence.
