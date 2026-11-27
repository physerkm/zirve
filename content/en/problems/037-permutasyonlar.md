---
title: Permutations
---
You are given an integer array `nums` of **distinct** elements. Return **all permutations** of the array, that is, every distinct ordering of its elements.

You can return the permutations in any order.

### Example 1

```text
Input:  nums = [1, 2, 3]
Output: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
```

### Example 2

```text
Input:  nums = [0, 1]
Output: [[0, 1], [1, 0]]
```

### Example 3

```text
Input:  nums = [1]
Output: [[1]]
```

### Constraints

- `1 <= nums.length <= 6`
- `-10 <= nums[i] <= 10`
- All elements are distinct.

## Hints

- Think of filling the permutation from left to right, slot by slot. The first slot can take any of the `n` numbers, the second any of the remaining `n - 1`.
- You need to know whether a number is currently in use. For that, you can keep a `used` array alongside the input.
- Backtracking: add the number, recurse for the remaining slots, and when you return, **remove** the number so the next number can go into the same slot.
- When adding to the result, add a **copy** of the list, not the list itself.

## Solution

We build the permutation from left to right, filling one slot at a time. `current` holds the slots filled so far, and `used[i]` tracks whether `nums[i]` is currently in `current`.

Each call fills the next slot. For every unused number, we apply the same three steps:

1. **Choose:** add the number to `current` and mark it as used.
2. **Explore:** recurse to fill the remaining slots.
3. **Undo:** remove the number and clear its mark, so the next number can go into the same slot.

When all slots are filled (`current.Count == nums.Length`), a permutation is complete and a **copy** of it is added to the result. The copy is essential: `current` is a single list, and it keeps changing through the undo steps.

```csharp solution
public class Solution
{
    public IList<IList<int>> Permute(int[] nums)
    {
        var result = new List<IList<int>>();
        var current = new List<int>();         // the permutation being built slot by slot
        bool[] used = new bool[nums.Length];   // used[i]: is nums[i] currently in current?

        Backtrack(nums, used, current, result);
        return result;
    }

    private static void Backtrack(int[] nums, bool[] used, List<int> current, List<IList<int>> result)
    {
        // All slots are filled. Save a copy: current will keep changing after this.
        if (current.Count == nums.Length)
        {
            result.Add(new List<int>(current));
            return;
        }

        // Try every number not used yet for the next slot.
        for (int i = 0; i < nums.Length; i++)
        {
            if (used[i]) continue;

            // Choose
            current.Add(nums[i]);
            used[i] = true;

            // Explore: fill the remaining slots.
            Backtrack(nums, used, current, result);

            // Undo: let the next number take this slot.
            current.RemoveAt(current.Count - 1);
            used[i] = false;
        }
    }
}
```

```typescript solution
function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const current: number[] = [];
  const used: boolean[] = new Array(nums.length).fill(false);

  const backtrack = (): void => {
    if (current.length === nums.length) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      current.push(nums[i]);
      used[i] = true;

      backtrack();

      current.pop();
      used[i] = false;
    }
  };

  backtrack();
  return result;
}
```

### Complexity

- **Time:** O(n · n!). There are `n!` permutations, and copying each one takes O(n).
- **Space:** O(n), not counting the output (recursion depth, `current` and `used`).

This uses the same "choose, explore, undo" skeleton as the Subsets problem. The difference: in subsets you only move forward (the `start` index), while in permutations every number is tried again for each slot, and the `used` array prevents repeats.
