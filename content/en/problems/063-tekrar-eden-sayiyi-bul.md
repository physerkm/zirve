---
title: Find the Duplicate Number
---
You are given an integer array `nums` with `n + 1` elements, where each element is in the range `[1, n]`. There is **exactly one repeated number** in the array (it may appear more than twice). Return this number.

You must solve it **without modifying** the array and using only **constant extra space**.

### Example 1

```text
Input:  nums = [1, 3, 4, 2, 2]
Output: 2
```

### Example 2

```text
Input:  nums = [3, 1, 3, 4, 2]
Output: 3
```

### Example 3

```text
Input:  nums = [3, 3, 3, 3, 3]
Output: 3
```

### Constraints

- `1 <= n <= 10^5`
- `nums.length == n + 1`
- `1 <= nums[i] <= n`
- Only one number is repeated; that number may be repeated more than once.

**Follow-up:** Can you solve it in linear time?

## Hints

- A hash set or sorting are easy solutions, but one needs O(n) space and the other modifies the array.
- Imagine drawing an arrow from each index `i` to index `nums[i]`. Since the values are in `[1, n]`, every arrow lands inside the array. What does this structure look like?
- The "linked list" starting at `0` enters a cycle, and the entry point of the cycle is the duplicate number. Apply Floyd's cycle detection algorithm.

## Solution

### Seeing the array as a linked list

If we follow the arrows `i → nums[i]`, the path starting from index `0` is bound to enter a cycle eventually (there are n + 1 indices, and the arrows only point to `1..n`). At least two arrows point to the duplicate number `d`; the entry point of the cycle is exactly index `d`.

### Floyd: meeting point and entry point

1. **Meeting:** `slow = nums[slow]` advances one step and `fast = nums[nums[fast]]` advances two; they meet inside the cycle.
2. **Entry:** `slow` is moved back to the start (`0`); both advance one step at a time. Since the distance from the start to the entry equals the distance from the meeting point to the entry (up to a multiple of the cycle length), they meet exactly at the entry point.

```csharp solution
public class Solution
{
    public int FindDuplicate(int[] nums)
    {
        var slow = 0;
        var fast = 0;

        do
        {
            slow = nums[slow];
            fast = nums[nums[fast]];
        }
        while (slow != fast);

        slow = 0;
        while (slow != fast)
        {
            slow = nums[slow];
            fast = nums[fast];
        }

        return slow;
    }
}
```

```typescript solution
function findDuplicate(nums: number[]): number {
  let slow = 0;
  let fast = 0;

  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);

  slow = 0;
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }

  return slow;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1). The array is not modified.

An alternative O(n log n) solution uses **binary search over the value range**: if the number of elements `<= mid` is greater than `mid`, the duplicate number is in `[1, mid]` (pigeonhole principle).
