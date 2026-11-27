---
title: Subarray Sum Equals K
---
You are given an integer array `nums` and an integer `k`. Return the total number of **contiguous subarrays** whose elements sum to `k`.

A subarray is a contiguous, non-empty sequence of elements within the array.

### Example 1

```text
Input:  nums = [1, 1, 1], k = 2
Output:  2
Explanation: The subarrays with sum 2 are the [1, 1] subarrays in the ranges [0..1] and [1..2].
```

### Example 2

```text
Input:  nums = [1, 2, 3], k = 3
Output:  2
Explanation: The subarrays [1, 2] and [3] sum to 3.
```

### Example 3

```text
Input:  nums = [1, -1, 0], k = 0
Output:  3
Explanation: The subarrays [1, -1], [0] and [1, -1, 0] sum to 0.
```

### Constraints

- `1 <= nums.length <= 2 * 10^4`
- `-1000 <= nums[i] <= 1000`
- `-10^7 <= k <= 10^7`

## Hints

- Since the array can contain negative numbers and zeros, growing the window does not always increase the sum, and shrinking it does not always decrease it; that is why the sliding window approach does not work here.
- The sum of the subarray between indices `i` and `j` equals the prefix sum up to index `j` (`curSum`) minus the prefix sum up to index `i - 1`.
- If the current prefix sum is `curSum`, the answer to "how many prefix sums equal to `curSum - k` have we seen before?" gives the number of subarrays ending at the current element whose sum is `k`.
- To avoid missing subarrays that start at the very beginning of the array, remember to add the entry `{0: 1}` to the hash table at the start.

## Solution

Since the array can contain negative numbers, we cannot use two pointers or a sliding window: as we move right, the sum can decrease as well as increase. Instead, we use the pair **prefix sum** and **hash table**.

Let `curSum` be the sum of the elements from the start of the array up to the current index. If at some earlier point the prefix sum was `curSum - k`, then the elements of the subarray from that point up to the current index sum to exactly `curSum - (curSum - k) = k`.

Because of negative numbers and zeros, the same prefix sum can occur more than once. So we store **how many times each prefix sum has been seen** in a hash table (`prefixCounts`):

1. At the start, when no element has been chosen, the sum is `0`; we initialize the table with `{0: 1}` to represent this state.
2. For each element `num`, we do `curSum += num`.
3. If the key `curSum - k` exists in the table, we add its frequency to the `count` variable.
4. Finally, we increment the frequency of `curSum` in the table by 1 (checking first and adding afterwards keeps us from mistakenly counting the empty subarray when `k = 0`).

```csharp solution
public class Solution
{
    public int SubarraySum(int[] nums, int k)
    {
        // { prefix_sum : times_seen } — 0: 1 for the initial empty sum
        var prefixCounts = new Dictionary<int, int> { [0] = 1 };
        int curSum = 0;
        int count = 0;

        foreach (int num in nums)
        {
            curSum += num;

            // As many valid subarrays end here as the number of times we have seen the sum (curSum - k) before.
            if (prefixCounts.TryGetValue(curSum - k, out int freq))
                count += freq;

            prefixCounts[curSum] = prefixCounts.GetValueOrDefault(curSum, 0) + 1;
        }

        return count;
    }
}
```

```typescript solution
function subarraySum(nums: number[], k: number): number {
  const prefixCounts = new Map<number, number>([[0, 1]]);
  let curSum = 0;
  let count = 0;

  for (const num of nums) {
    curSum += num;
    count += prefixCounts.get(curSum - k) ?? 0;
    prefixCounts.set(curSum, (prefixCounts.get(curSum) ?? 0) + 1);
  }

  return count;
}
```

### Complexity

- **Time:** O(n). The array is scanned in a single pass; at each step, the hash table lookup and update take O(1) on average.
- **Space:** O(n). In the worst case, all prefix sums are distinct and the hash table holds `n + 1` entries.
