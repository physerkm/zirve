---
title: Find All Numbers Disappeared in an Array
---
You are given an integer array `nums` of `n` elements, where each element is in the range `[1, n]`. Some numbers may appear more than once, and some may not appear at all.

Return all the numbers in the range `[1, n]` that **do not appear** in `nums`. You can return them in any order.

### Example 1

```text
Input:  nums = [4, 3, 2, 7, 8, 2, 3, 1]
Output: [5, 6]
```

### Example 2

```text
Input:  nums = [1, 1]
Output: [2]
```

### Constraints

- `1 <= n <= 10^5`
- `1 <= nums[i] <= n`

**Follow-up:** Can you solve it without extra space and in O(n) time? (The returned list does not count as extra space.)

## Hints

- Putting the seen numbers into a set and checking 1 through `n` works, but it needs O(n) extra space.
- The values are in `1..n`, and the indices are in `0..n-1`. Each value `x` maps to a "slot" in the array: `nums[x - 1]`.
- How can you mark that you have seen a number without destroying the value in its slot? Think about flipping its sign.
- After marking, remember to take the absolute value when reading.

## Solution

The values are in the range `1..n`, and the array's indices are `0..n-1`. So every number `x` has its own slot in the array: `nums[x - 1]`. Instead of allocating an extra data structure, we write the "I saw this number" information into that slot.

To avoid losing the slot's original value, we mark it with a **minus sign**: when `x` is seen, `nums[x - 1]` is made negative. The magnitude of the value stays the same; only its sign carries information.

1. **Mark:** For each element, find its slot and make it negative. The element itself may already be negative because of an earlier mark, so we take its absolute value when computing the slot. If the slot is already negative, we leave it alone (the same number has been seen a second time).
2. **Collect:** Scan the array once more. Every slot that is still positive belongs to a number that was never seen: if index `i` is positive, `i + 1` is missing.

In the second pass, the negative slots are turned back to positive, so the calling code gets its array back unchanged.

```csharp solution
public class Solution
{
    public IList<int> FindDisappearedNumbers(int[] nums)
    {
        // Every number x in 1..n has its own slot: nums[x - 1].
        // When x is seen, its slot is marked by making the value there negative.
        foreach (int num in nums)
        {
            int box = Math.Abs(num) - 1; // num may have turned negative from an earlier mark
            if (nums[box] > 0)
                nums[box] = -nums[box];
        }

        // A slot that is still positive belongs to a number that was never seen.
        List<int> result = new List<int>();
        for (int i = 0; i < nums.Length; i++)
        {
            if (nums[i] > 0)
                result.Add(i + 1);
            else
                nums[i] = -nums[i]; // undo the mark: the caller gets its array back unchanged
        }

        return result;
    }
}
```

```typescript solution
function findDisappearedNumbers(nums: number[]): number[] {
  for (const num of nums) {
    const box = Math.abs(num) - 1;
    if (nums[box] > 0) nums[box] = -nums[box];
  }

  const result: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > 0) result.push(i + 1);
    else nums[i] = -nums[i];
  }

  return result;
}
```

### Complexity

- **Time:** O(n), two passes.
- **Space:** O(1), not counting the returned list.

The constraint "values are in the range `1..n`" is a sign that you can use the array as its own hash table. The same idea shows up in problems like "find the duplicate number" and "first missing positive."

The `for...of` loop in the TypeScript solution works correctly even though the array is modified during the loop: each step reads the element's **current** value, and since we take the absolute value, a mark doesn't affect the result.
