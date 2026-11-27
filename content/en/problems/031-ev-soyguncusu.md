---
title: House Robber
---

You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. The only constraint stopping you is that **adjacent houses have security systems connected to each other**: if you break into two adjacent houses on the same night, the police are automatically alerted.

Given an array `nums` of non-negative integers representing the amount of money in each house, return **the maximum amount of money** you can rob tonight **without alerting the police**.

### Example 1

```text
Input:  nums = [1, 2, 3, 1]
Output:  4
Explanation: Rob house 1 (money = 1) and then house 3 (money = 3). Total amount robbed = 1 + 3 = 4.
```

### Example 2

```text
Input:  nums = [2, 7, 9, 3, 1]
Output:  12
Explanation: Rob house 1 (money = 2), house 3 (money = 9) and house 5 (money = 1). Total amount robbed = 2 + 9 + 1 = 12.
```

### Example 3

```text
Input:  nums = [2, 1, 1, 2]
Output:  4
Explanation: Robbing the first house (2) and the last house (2) gives 2 + 2 = 4 (two houses in between can be left alone).
```

### Constraints

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 400`

## Hints

- When you reach house `i`, you have two options: **rob** this house or **skip** it.
- If you rob house `i`, you can't rob the previous house (`i - 1`); so your total is `nums[i] + dp[i - 2]`.
- If you skip house `i`, your total is `dp[i - 1]`, the best total up to the previous house.
- By keeping only the best totals from the last two steps (`rob1` and `rob2`), you can solve it with O(1) memory and no extra array.

## Solution

As you move from the start of the street to the end, make this decision at each house:

- **Rob this house:** Then you can't rob the previous house, so add this house's money (`num`) to the maximum total achievable up to two houses back (`rob1`): `rob1 + num`.
- **Skip this house:** Then keep the maximum total achievable up to the previous house (`rob2`).

The larger of these two options (`Math.Max(rob1 + num, rob2)`) becomes the new maximum total so far. Then, before moving on to the next house, slide the two-variable window with the assignments `rob1 = rob2` and `rob2 = temp`.

As the example `nums = [2, 1, 1, 2]` shows, you don't always have to alternate "rob one, skip one"; since `rob2` already carries the best result over all previous houses, the case of skipping two houses in a row is covered naturally.

```csharp solution
public class Solution
{
    public int Rob(int[] nums)
    {
        int rob1 = 0;
        int rob2 = 0;

        // [rob1, rob2, num, ...]
        foreach (int num in nums)
        {
            int temp = Math.Max(rob1 + num, rob2);
            rob1 = rob2;
            rob2 = temp;
        }

        return rob2;
    }
}
```

```typescript solution
function rob(nums: number[]): number {
  let rob1 = 0;
  let rob2 = 0;

  for (const num of nums) {
    const temp = Math.max(rob1 + num, rob2);
    rob1 = rob2;
    rob2 = temp;
  }

  return rob2;
}
```

### Complexity

- **Time:** O(n). Each house in the array is evaluated only once, in constant time.
- **Space:** O(1). Only the variables `rob1`, `rob2` and `temp` are used.
