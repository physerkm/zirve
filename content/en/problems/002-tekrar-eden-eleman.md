---
title: Contains Duplicate
---
You are given an integer array `nums`. Return `true` if any value appears **at least twice** in the array, and `false` if every element is distinct.

### Example 1

```text
Input:  nums = [1, 2, 3, 1]
Output:  true
```

### Example 2

```text
Input:  nums = [1, 2, 3, 4]
Output:  false
```

### Constraints

- `1 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## Hints

- Comparing every pair takes O(n²). Can you answer "have I seen this value before?" in O(1)?
- Keep the values you've seen in a set (`HashSet` / `Set`).

## Solution

Walk the array once and add every value you see to a set. If a value is already in the set, you've found a duplicate and can return `true` immediately.

```csharp solution
public class Solution
{
    public bool ContainsDuplicate(int[] nums)
    {
        var seen = new HashSet<int>();

        foreach (var n in nums)
        {
            // Add returns false if the element is already present.
            if (!seen.Add(n)) return true;
        }

        return false;
    }
}
```

```typescript solution
function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();

  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }

  return false;
}
```

### Complexity

- **Time:** O(n). One constant-time set operation per element.
- **Space:** O(n).

**Alternative:** Sorting the array and comparing adjacent elements takes O(n log n) time and (with in-place sorting) O(1) extra space. It may be preferable when memory is tight; mention the trade-off in the interview.
