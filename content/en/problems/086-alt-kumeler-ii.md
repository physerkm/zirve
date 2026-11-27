---
title: Subsets II
---
You are given an integer array `nums` that may contain duplicates. Return all possible **unique subsets** (the power set) of the array.

The solution set **must not contain duplicate subsets**. You may return the subsets in any order.

### Example 1

```text
Input:  nums = [1, 2, 2]
Output: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
Explanation: Even though the array contains two 2s, the subsets [2] and [1, 2] appear only once each in the result.
```

### Example 2

```text
Input:  nums = [0]
Output: [[], [0]]
Explanation: The subsets of a single-element array are the empty set and the array itself.
```

### Example 3

```text
Input:  nums = [2, 1, 2]
Output: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
Explanation: Even though the initial order of the elements is different, the unique subsets produced are the same.
```

### Constraints

- `1 <= nums.length <= 10`
- `-10 <= nums[i] <= 10`

## Hints

- Start by **sorting** `nums` so duplicate elements are easy to detect.
- At every node of the decision tree, the current `path` list is a valid subset, so you can add a copy of `path` to the result at the start of each call.
- To avoid producing the same subset twice, skip a number when you meet it again **at the same decision level** (inside the same `for` loop) after you have already tried it.
- Picking the same number when `i == start` is a new depth level (for example, picking the second `2` in `[1, 2, 2]`), but `i > start && nums[i] == nums[i - 1]` means opening a duplicate branch at the same level; skip only that case.

## Solution

The only difference from the standard subset generation problem is that the input may contain the same number more than once. For example, in `nums = [1, 2, 2]`, if we pick the first `2` and the second `2` separately at the same position, we produce two `[1, 2]` subsets.

The cleanest way to prevent this is to first **sort `nums` in ascending order**. Sorting puts equal numbers next to each other. Then, in the backtracking function (`Backtrack(start)`):

1. At the start of each call, add a copy of the current `path` list to `result`.
2. Move index `i` from `start` to the end of the array.
3. If `i > start && nums[i] == nums[i - 1]`, we already picked the value `nums[i]` at this decision level in the previous step (`i - 1`) and generated all of its subtrees; skip this duplicate branch with `continue`.
4. Otherwise, add `nums[i]` to the `path` list, go down to the next level with `Backtrack(i + 1)`, and remove the last element from the list on the way back.

Note that the `nums[i] == nums[i - 1]` check is not done when `i == start`; this keeps valid subsets such as `[1, 2, 2]`, where the same number is used more than once at different depths.

```csharp solution
public class Solution
{
    public IList<IList<int>> SubsetsWithDup(int[] nums)
    {
        Array.Sort(nums);
        IList<IList<int>> result = new List<IList<int>>();
        List<int> path = new List<int>();

        void Backtrack(int start)
        {
            result.Add(new List<int>(path));

            for (int i = start; i < nums.Length; i++)
            {
                // Skip a duplicate element already handled at the same tree level.
                if (i > start && nums[i] == nums[i - 1])
                    continue;

                path.Add(nums[i]);
                Backtrack(i + 1);
                path.RemoveAt(path.Count - 1);
            }
        }

        Backtrack(0);
        return result;
    }
}
```

```typescript solution
function subsetsWithDup(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number): void {
    result.push([...path]);

    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;

      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return result;
}
```

### Complexity

- **Time:** O(N * 2^N). In the worst case (when all elements are distinct) there are `2^N` subsets, and copying each subset takes at most O(N). The initial sort is O(N log N), which is dominated by the exponential term.
- **Space:** O(N) (excluding the result list). The recursion call stack and the `path` list hold at most `N` elements.
