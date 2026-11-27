---
title: Merge Triplets to Form Target Triplet
---
A **triplet** is an array of three integers. You are given a 2D integer array `triplets` (`triplets[i] = [ai, bi, ci]`) and the target triplet you want to obtain, `target = [x, y, z]`.

To obtain the `target` triplet, you may apply the following operation on `triplets` any number of times (including zero):

- Choose two different indices `i` and `j` (`i != j`) and update `triplets[j]` to `[max(ai, aj), max(bi, bj), max(ci, cj)]`.

Return `true` if it is possible to obtain the `target` triplet as an element of `triplets` after these operations, and `false` otherwise.

### Example 1

```text
Input:  triplets = [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target = [2, 7, 5]
Output:  true
Explanation: If we merge triplets 0 and 2, we get [max(2, 1), max(5, 7), max(3, 5)] = [2, 7, 5].
```

### Example 2

```text
Input:  triplets = [[3, 4, 5], [4, 5, 6]], target = [3, 2, 5]
Output:  false
Explanation: The middle element of both triplets is greater than the middle element of the target (2); since merging can only increase values, [3, 2, 5] cannot be obtained.
```

### Example 3

```text
Input:  triplets = [[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], target = [5, 5, 5]
Output:  true
Explanation: If we merge all the triplets one after another, we reach the target triplet [5, 5, 5].
```

### Constraints

- `1 <= triplets.length <= 10^5`
- `triplets[i].length == target.length == 3`
- `1 <= ai, bi, ci, x, y, z <= 1000`

## Hints

- The merge operation (`max`) only increases elements, never decreases them.
- If you pick a triplet that **exceeds** `target` at any position (`t[0] > target[0]` or `t[1] > target[1]` or `t[2] > target[2]`), that position can never be brought back down to the target.
- Once you discard these "dangerous" triplets entirely, merging all the remaining "safe" triplets never pushes any position above the target.
- If among the remaining safe triplets you can find at least one element equal to the `target` value at index 0, index 1 and index 2, you can reach the target.

## Solution

The merge operation takes the **maximum** of the corresponding elements of two triplets. So if any element of a triplet is greater than the matching element of the target (`t[0] > target[0]`, `t[1] > target[1]` or `t[2] > target[2]`), the moment we include that triplet in a merge, that index goes above the target and can never be reduced again by `max`. That is why we **must never use** such triplets.

So what happens if we merge **all** the "safe" triplets, those that do not exceed the target at any index (`t[0] <= target[0]`, `t[1] <= target[1]` and `t[2] <= target[2]`)?
- No index goes above its `target` value.
- If at least one safe triplet has `target[0]` as its element 0, at least one has `target[1]` as its element 1, and at least one has `target[2]` as its element 2, their merge is exactly `[target[0], target[1], target[2]]`!

So we scan the array in a single pass:
1. We skip triplets that exceed the target with `continue`.
2. For safe triplets, we track the conditions `t[0] == target[0]`, `t[1] == target[1]` and `t[2] == target[2]` in three separate `bool` flags (`ok0`, `ok1`, `ok2`).
3. When all three flags are `true`, the target can be formed.

```csharp solution
public class Solution
{
    public bool MergeTriplets(int[][] triplets, int[] target)
    {
        bool ok0 = false, ok1 = false, ok2 = false;

        foreach (int[] t in triplets)
        {
            // A triplet that exceeds the target at any index cannot be used.
            if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2])
                continue;

            if (t[0] == target[0]) ok0 = true;
            if (t[1] == target[1]) ok1 = true;
            if (t[2] == target[2]) ok2 = true;
        }

        return ok0 && ok1 && ok2;
    }
}
```

```typescript solution
function mergeTriplets(triplets: number[][], target: number[]): boolean {
  let ok0 = false;
  let ok1 = false;
  let ok2 = false;

  for (const t of triplets) {
    if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) {
      continue;
    }
    if (t[0] === target[0]) ok0 = true;
    if (t[1] === target[1]) ok1 = true;
    if (t[2] === target[2]) ok2 = true;
  }

  return ok0 && ok1 && ok2;
}
```

### Complexity

- **Time:** O(n). Each triplet in `triplets` is visited exactly once with a constant number of comparisons.
- **Space:** O(1). Only three boolean variables are used.
