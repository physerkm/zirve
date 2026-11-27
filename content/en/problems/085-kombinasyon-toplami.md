---
title: Combination Sum
---
You are given an array `candidates` of **distinct** positive integers and a target integer `target`. Return a list of all **unique combinations** of candidates where the chosen numbers sum to `target`. You may return the combinations in any order.

The same number from `candidates` may be chosen an **unlimited number of times**. Two combinations are considered different if the frequency of at least one of the chosen numbers is different.

### Example 1

```text
Input:  candidates = [2, 3, 6, 7], target = 7
Output: [[2, 2, 3], [7]]
Explanation:
Using the candidates 2 and 3, you get 2 + 2 + 3 = 7 (2 can be used more than once).
7 on its own equals 7.
There are no other combinations.
```

### Example 2

```text
Input:  candidates = [2, 3, 5], target = 8
Output: [[2, 2, 2, 2], [2, 3, 3], [3, 5]]
Explanation: There are three different combinations that sum to 8.
```

### Example 3

```text
Input:  candidates = [2], target = 1
Output: []
Explanation: The smallest candidate is 2, so no selection can sum to 1.
```

### Constraints

- `1 <= candidates.length <= 30`
- `2 <= candidates[i] <= 40`
- All elements of `candidates` are distinct.
- `1 <= target <= 40`

## Hints

- At each step, you can pick a candidate and subtract it from the remaining target (`remaining`) to move down the decision tree.
- To avoid producing different orderings (permutations) of the same combination, such as `[2, 2, 3]` and `[2, 3, 2]`, only consider the candidates at the current index `i` and after it in the next step (the `start` parameter).
- Since you can use the same element an unlimited number of times, pass `i` instead of `i + 1` as the start index in the recursive call.
- When the remaining target is `0`, you have found a valid combination; when it drops below `0`, prune that branch and return.

## Solution

We solve the problem with **backtracking** over a decision tree. At each node we have the `path` list holding the numbers chosen so far, `start`, which says from which index the search continues, and `remaining`, the sum we still need to reach.

To avoid regenerating different arrangements of the same combination (for example `[2, 3, 2]` and `[3, 2, 2]`), we always pick candidates in a fixed order: once we pick the candidate at index `i`, starting from index `start`, the child call never goes back to the elements before `i`. But since we can pick the same number an unlimited number of times, we make the recursive call as `Backtrack(i, remaining - candidates[i])`, keeping index `i` fixed. When the loop moves on to `i + 1`, we have given up on that element and moved on to the next candidates.

When `remaining == 0`, the numbers in `path` add up to exactly `target`; we add a **copy** of the `path` list to the result. When `remaining < 0`, we have overshot the target, so we cut off this branch immediately, remove the last number we added from `path` (`RemoveAt` / `pop`), and go back to the previous decision.

```csharp solution
public class Solution
{
    public IList<IList<int>> CombinationSum(int[] candidates, int target)
    {
        IList<IList<int>> result = new List<IList<int>>();
        List<int> path = new List<int>();

        void Backtrack(int start, int remaining)
        {
            if (remaining == 0)
            {
                result.Add(new List<int>(path));
                return;
            }

            if (remaining < 0)
                return;

            for (int i = start; i < candidates.Length; i++)
            {
                path.Add(candidates[i]);
                // Keep index i fixed so the same element can be picked again.
                Backtrack(i, remaining - candidates[i]);
                path.RemoveAt(path.Count - 1);
            }
        }

        Backtrack(0, target);
        return result;
    }
}
```

```typescript solution
function combinationSum(candidates: number[], target: number): number[][] {
  const result: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number, remaining: number): void {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    if (remaining < 0) return;

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]);
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}
```

### Complexity

- **Time:** O(N^(T/M + 1)), where `N` is the number of candidates, `T` is the target value (`target`), and `M` is the smallest number in `candidates`. The decision tree is at most `T/M` deep, and each node branches at most `N` ways.
- **Space:** O(T/M) (excluding the result list). The recursion call stack and the `path` list reach a depth of at most `T/M`.
