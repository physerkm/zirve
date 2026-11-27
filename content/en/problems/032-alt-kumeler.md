---
title: Subsets
---
You are given an integer array `nums` of **distinct** elements. Return **all subsets** of the array (the power set).

The result must not contain the same subset more than once. You can return the subsets, and their elements, in any order.

### Example 1

```text
Input:  nums = [1, 2, 3]
Output:  [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]
```

### Example 2

```text
Input:  nums = [0]
Output:  [[], [0]]
```

### Constraints

- `1 <= nums.length <= 10`
- All elements are distinct.

## Hints

- How many subsets does a set of `n` elements have? Think about the two options for each element.
- Make a decision for each element: **include** it in the subset or **exclude** it. These decisions form a decision tree.
- Backtracking: add the element, recurse, then **remove** the element again.

## Solution

Each element is either in the subset or not; for `n` elements there are 2ⁿ subsets. Use backtracking to traverse this decision tree.

`current` holds the elements chosen so far. In each call, first add a **copy** of `current` to the result (every node is a valid subset). Then, starting from index `start`, add each element in turn, recurse on the remaining elements, and remove the element on the way back. Moving only forward (`i + 1`) prevents the same subset from being generated again in a different order.

```csharp solution
public class Solution
{
    public IList<IList<int>> Subsets(int[] nums)
    {
        var result = new List<IList<int>>();
        Build(nums, 0, new List<int>(), result);
        return result;
    }

    private void Build(int[] nums, int start, List<int> current, List<IList<int>> result)
    {
        result.Add(new List<int>(current));   // copy: current will change later

        for (var i = start; i < nums.Length; i++)
        {
            current.Add(nums[i]);
            Build(nums, i + 1, current, result);
            current.RemoveAt(current.Count - 1);
        }
    }
}
```

```typescript solution
function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  const current: number[] = [];

  const build = (start: number): void => {
    result.push([...current]);

    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);
      build(i + 1);
      current.pop();
    }
  };

  build(0);
  return result;
}
```

### Complexity

- **Time:** O(n · 2ⁿ). There are 2ⁿ subsets, and copying each one takes O(n).
- **Space:** O(n) excluding the output (the recursion depth and `current`).

The most common mistake is adding `current` **itself** to the result instead of a copy: every entry points to the same list, and in the end they all look empty.

This "choose, recurse, undo" skeleton is the foundation of every backtracking problem, such as permutations, combinations, combination sum and N-Queens.
