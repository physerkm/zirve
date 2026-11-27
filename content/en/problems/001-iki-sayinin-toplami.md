---
title: Two Sum
---
You are given an integer array `nums` and a target value `target`. Return the **indices of two different elements** whose sum equals `target`.

You may assume that each input has exactly one solution. You may not use the same element twice. You can return the indices in any order.

### Example 1

```text
Input:  nums = [2, 7, 11, 15], target = 9
Output:  [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
```

### Example 2

```text
Input:  nums = [3, 2, 4], target = 6
Output:  [1, 2]
```

### Constraints

- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i], target <= 10^9`
- Exactly one valid answer exists.

**Follow-up:** Can you come up with a solution faster than O(n²)?

## Hints

- For each element, ask: "Have I already seen the number that adds up to the target with this one?"
- Which data structure answers "have I seen this value before?" in O(1)?
- Store each value as the key and its index as the value in a hash table. Then a single pass over the array is enough.

## Solution

### Brute force

The most direct solution is to try every pair: two nested loops, O(n²) time, O(1) extra space. It's good to **mention** this in an interview, but stopping here isn't enough.

### One-pass hash table

When you look at element `x`, you know exactly what you're looking for: `target - x`. The problem becomes "have I seen this value before?", and a hash table answers that in O(1).

Walk the array from left to right. For each element, first check whether its complement is in the table; if not, add the element itself to the table along with its index. Checking first and inserting second automatically prevents an element from pairing with itself.

```csharp solution
public class Solution
{
    public int[] TwoSum(int[] nums, int target)
    {
        var indexByValue = new Dictionary<int, int>();

        for (var i = 0; i < nums.Length; i++)
        {
            if (indexByValue.TryGetValue(target - nums[i], out var j))
            {
                return new[] { j, i };
            }

            indexByValue[nums[i]] = i;
        }

        return Array.Empty<int>();
    }
}
```

```typescript solution
function twoSum(nums: number[], target: number): number[] {
  const indexByValue = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const j = indexByValue.get(target - nums[i]);
    if (j !== undefined) {
      return [j, i];
    }

    indexByValue.set(nums[i], i);
  }

  return [];
}
```

### Complexity

- **Time:** O(n). The array is traversed once; each step does one table lookup and one insertion.
- **Space:** O(n). In the worst case, every element goes into the table.

This problem is the simplest example of the trade-off you'll run into most often in interviews: **spending extra memory to save time.**
