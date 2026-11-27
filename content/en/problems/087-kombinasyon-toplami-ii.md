---
title: Combination Sum II
---
You are given an array of candidate numbers `candidates` and a target number `target`. Find all **unique combinations** in `candidates` where the numbers sum to `target`.

Each number (each index) in `candidates` may be used **at most once** in a combination.

**Note:** The solution set must not contain duplicate combinations.

### Example 1

```text
Input:  candidates = [10, 1, 2, 7, 6, 1, 5], target = 8
Output: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]
Explanation:
Since the array contains two 1s, [1, 1, 6] is valid; but the combinations [1, 7] and [1, 2, 5] appear only once each in the result.
```

### Example 2

```text
Input:  candidates = [2, 5, 2, 1, 2], target = 5
Output: [[1, 2, 2], [5]]
Explanation: The unique combinations that sum to 5 are [1, 2, 2] and [5].
```

### Constraints

- `1 <= candidates.length <= 100`
- `1 <= candidates[i] <= 50`
- `1 <= target <= 30`

## Hints

- There are two differences from the original "Combination Sum" problem: each index can be used at most once, and the array may contain duplicate numbers.
- First **sort** `candidates` so that duplicate numbers sit next to each other and you can prune early.
- To use an element at most once, advance the start index to `i + 1` instead of `i` in the recursive call.
- To avoid producing duplicate combinations at the same decision level, skip a candidate when `i > start && candidates[i] == candidates[i - 1]`. Also, since the array is sorted, you can end the loop entirely with `break` when `candidates[i] > remaining`.

## Solution

This problem combines the techniques of **Combination Sum** (LC 39) and **Subsets II** (LC 90):

1. **Sorting:** We start by sorting `candidates` in ascending order. This puts elements with the same value next to each other and lets us end the loop early (`break`) once we reach a number that exceeds the remaining target.
2. **Pruning duplicates at the same level:** If the condition `i > start && candidates[i] == candidates[i - 1]` holds in the `for` loop, we already picked the same number at this tree level in the previous step and explored all of its sub-combinations; we skip it with `continue`.
3. **Single use (`i + 1`):** Since each index can be used at most once, we make the child call as `Backtrack(i + 1, remaining - candidates[i])`.
4. **Early exit on sorted input (`break`):** Since the array is sorted, when `candidates[i] > remaining`, neither `i` nor any element after it can fit into the remaining target; we exit the loop immediately with `break`.

```csharp solution
public class Solution
{
    public IList<IList<int>> CombinationSum2(int[] candidates, int target)
    {
        Array.Sort(candidates);
        IList<IList<int>> result = new List<IList<int>>();
        List<int> path = new List<int>();

        void Backtrack(int start, int remaining)
        {
            if (remaining == 0)
            {
                result.Add(new List<int>(path));
                return;
            }

            for (int i = start; i < candidates.Length; i++)
            {
                // Avoid opening a duplicate branch at the same tree level.
                if (i > start && candidates[i] == candidates[i - 1])
                    continue;

                // The array is sorted, so the following elements will also be greater than remaining.
                if (candidates[i] > remaining)
                    break;

                path.Add(candidates[i]);
                Backtrack(i + 1, remaining - candidates[i]);
                path.RemoveAt(path.Count - 1);
            }
        }

        Backtrack(0, target);
        return result;
    }
}
```

```typescript solution
function combinationSum2(candidates: number[], target: number): number[][] {
  candidates.sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number, remaining: number): void {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      if (candidates[i] > remaining) break;

      path.push(candidates[i]);
      backtrack(i + 1, remaining - candidates[i]);
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}
```

### Complexity

- **Time:** O(N * 2^N). In the worst case, `2^N` subsets are examined in the decision tree, and copying each valid combination takes O(N).
- **Space:** O(N) (excluding the result list). The recursion stack and the `path` list reach a depth of at most `N`.
