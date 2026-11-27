---
title: Jump Game
---
You are given an integer array `nums`. You start at the array's **first** index, and each element gives the **maximum** jump length you can make from that index. Shorter jumps are allowed too.

Return `true` if you can reach the last index, or `false` otherwise.

### Example 1

```text
Input:  nums = [2, 3, 1, 1, 4]
Output: true
Explanation: Jump 1 step from index 0, then 3 steps from index 1 to reach the end.
```

### Example 2

```text
Input:  nums = [3, 2, 1, 0, 4]
Output: false
Explanation: Whatever path you take, you arrive at index 3; the 0 there doesn't let you move on.
```

### Constraints

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 10^5`

## Hints

- You don't need to know which jumps you made; the only question is "is it reachable?"
- If you can reach index `i`, you can also reach every index before `i`. So the reachable indices form a contiguous range starting at the beginning.
- Keep a single number: the **farthest** index reachable so far. At each index, update it with `i + nums[i]`.
- If your current index is beyond that limit, there is no way to get there.

## Solution

You don't need to try every jump path. If an index is reachable, every index before it is reachable too (since shorter jumps are allowed). So the reachable indices always form a contiguous range starting at `0`, and a single number describes that range: `farthest`, the farthest reachable index.

We scan the array from left to right:

- If `i > farthest`, there is no way to reach index `i`, so the end can't be reached either.
- Otherwise, from `i` you can jump as far as index `i + nums[i]`; we extend `farthest` with that.
- As soon as `farthest` reaches the last index, the answer is known; there is no need to look at the rest of the array.

This is a greedy solution: at each step we keep only "the best reach so far," and that is enough to give the correct answer.

```csharp solution
public class Solution
{
    public bool CanJump(int[] nums)
    {
        int lastIndex = nums.Length - 1;
        int farthest = 0; // every index from 0 to farthest is reachable

        for (int i = 0; i < nums.Length; i++)
        {
            // i is beyond every index we can reach: we got stuck before the end.
            if (i > farthest)
                return false;

            // From i we can land anywhere up to i + nums[i]: a jump can be shorter than nums[i].
            int reach = i + nums[i];
            farthest = Math.Max(farthest, reach);

            // The last index is within reach; the rest of the array doesn't matter.
            if (farthest >= lastIndex)
                return true;
        }

        // We only get here for an empty array. With at least one element, the loop's
        // last iteration always returns; C# still requires a return at the end.
        return false;
    }
}
```

```typescript solution
function canJump(nums: number[]): boolean {
  const lastIndex = nums.length - 1;
  let farthest = 0;

  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;

    farthest = Math.max(farthest, i + nums[i]);

    if (farthest >= lastIndex) return true;
  }

  return false;
}
```

### Complexity

- **Time:** O(n). The array is scanned at most once.
- **Space:** O(1).

It can also be solved with dynamic programming (filling in "can the end be reached from this index?" from the back to the front), but that solution takes O(n²) time. The greedy solution gives the same result in a single pass.
