---
title: Longest Consecutive Sequence
---
You are given an unsorted integer array `nums`. Return the length of the **longest consecutive sequence** that can be formed from its numbers. A consecutive sequence is one where each number is exactly 1 greater than the previous one (for example, `1, 2, 3, 4`); the numbers don't need to be adjacent in `nums`.

Your solution must run in **O(n)** time.

### Example 1

```text
Input:  nums = [100, 4, 200, 1, 3, 2]
Output: 4
Explanation: The longest consecutive sequence is 1, 2, 3, 4.
```

### Example 2

```text
Input:  nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]
Output: 9
```

### Example 3

```text
Input:  nums = [1, 0, 1, 2]
Output: 3
```

### Constraints

- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## Hints

- Sorting makes it easy but takes O(n log n). Think of a data structure that answers "is this number in the array?" in O(1).
- Starting from every number and counting forward makes you count the same numbers over and over in long sequences.
- When is a number the **start** of a consecutive sequence? When the number one less than it isn't in the array.
- Count forward only from numbers that are starts.

## Solution

We put all the numbers into a set (`HashSet`). That collapses duplicates, and "is x here?" is answered in O(1).

The key idea is to start counting only from **sequence starts**. If a number's predecessor (`num - 1`) is in the set, the number is in the middle of a sequence; that sequence will be counted from its real start anyway, so we skip it. If the predecessor isn't in the set, the number is a start: we move forward through `num + 1`, `num + 2`, … while they are in the set and count the length.

Despite the two nested loops, the solution is O(n): the inner loop only runs from starts, and each number is counted at most once, within the single sequence it belongs to.

It also matters that the loop runs over the **set**, not over `nums`. If the same start number repeats thousands of times in the array, looping over `nums` would count the same sequence thousands of times.

```csharp solution
public class Solution
{
    public int LongestConsecutive(int[] nums)
    {
        // Duplicates collapse, and "is x here?" is answered in O(1).
        HashSet<int> set = new HashSet<int>(nums);
        int longest = 0;

        // Loop over the set, not nums: a start that repeats many times is counted only once.
        foreach (int num in set)
        {
            // If num - 1 exists, num is in the middle of a sequence; its real start will count it.
            if (set.Contains(num - 1))
                continue;

            int length = 1;
            while (set.Contains(num + length))
                length++;

            longest = Math.Max(longest, length);
        }

        return longest;
    }
}
```

```typescript solution
function longestConsecutive(nums: number[]): number {
  const set = new Set<number>(nums);
  let longest = 0;

  for (const num of set) {
    if (set.has(num - 1)) continue;

    let length = 1;
    while (set.has(num + length)) length++;

    longest = Math.max(longest, length);
  }

  return longest;
}
```

### Complexity

- **Time:** O(n). The set is built in O(n); each number is checked at most once for "is it a start?" and counted at most once.
- **Space:** O(n), for the set.

Without the "is it a start?" check, the solution still gives the correct result, but on an input like `[1, 2, 3, …, n]` it counts from every number to the end and degrades to O(n²).
