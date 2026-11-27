---
title: Jump Game II
---
You are given a 0-indexed integer array `nums` of length `n`. You start at index `0`.

Each element `nums[i]` is the **maximum jump length** forward from index `i`. In other words, if you are at `nums[i]`, you can jump to any index `i + j` where `0 <= j <= nums[i]` and `i + j < n`.

Return the **minimum number of jumps** to reach the last index (`n - 1`). It is guaranteed that you can always reach the last index.

### Example 1

```text
Input:  nums = [2, 3, 1, 1, 4]
Output:  2
Explanation: The minimum number of jumps to reach the last index is 2.
Jump 1 step from index 0 to index 1, then 3 steps to the last index.
```

### Example 2

```text
Input:  nums = [2, 3, 0, 1, 4]
Output:  2
Explanation: Jump from index 0 to index 1 (value 3), and from there directly to index 4.
```

### Constraints

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 1000`
- It is guaranteed that you can always reach `nums[n - 1]`.

## Hints

- Think of the problem as a **Breadth-First Search (BFS)** that advances layer by layer over a 1D array.
- Initially, your jump layer `0` is the range `[l, r] = [0, 0]`.
- Scan every index in the current range `[l, r]` to find the farthest point reachable with one jump (`farthest = max(i + nums[i])`).
- Your next jump layer is the range `[r + 1, farthest]`; keep sliding the window and incrementing the jump count until `r` reaches the last index.

## Solution

To find the minimum number of jumps, we apply a **level-based BFS (sliding window)** over the array. The window `[l, r]` represents the range of indices reachable with exactly `jumps` jumps.

Initially we are at index `0`: `l = 0`, `r = 0` and `jumps = 0`.
As long as the window's right boundary `r` has not reached the last index (`nums.Length - 1`):
1. Compute the farthest point reachable by jumping from each index `i` in the current window `[l, r]`: `farthest = Math.Max(farthest, i + nums[i])`.
2. Update the window for the next jump level to `l = r + 1` and `r = farthest`, and increment the `jumps` counter by 1.

Since each index is visited inside at most one window, the algorithm runs in **O(n)** time and **O(1)** space with no extra memory.

```csharp solution
public class Solution
{
    public int Jump(int[] nums)
    {
        int jumps = 0;
        int l = 0;
        int r = 0;

        while (r < nums.Length - 1)
        {
            int farthest = 0;
            for (int i = l; i <= r; i++)
            {
                farthest = Math.Max(farthest, i + nums[i]);
            }

            l = r + 1;
            r = farthest;
            jumps++;
        }

        return jumps;
    }
}
```

```typescript solution
function jump(nums: number[]): number {
  let jumps = 0;
  let l = 0;
  let r = 0;

  while (r < nums.length - 1) {
    let farthest = 0;
    for (let i = l; i <= r; i++) {
      farthest = Math.max(farthest, i + nums[i]);
    }

    l = r + 1;
    r = farthest;
    jumps++;
  }

  return jumps;
}
```

### Complexity

- **Time:** O(n). The window `[l, r]` slides forward at each step, and each element of the array is looked at no more than once.
- **Space:** O(1). Only the boundary pointers (`l`, `r`, `farthest`) and the counter (`jumps`) are kept.
