---
title: Next Permutation
---
The **next permutation** of an array of integers is the next greater arrangement of its elements in lexicographic order. For example, the next permutation of `[1, 2, 3]` is `[1, 3, 2]`, and that of `[2, 3, 1]` is `[3, 1, 2]`. If no greater arrangement exists (the array is in descending order), the array wraps around to its **smallest** arrangement, that is, ascending order: `[3, 2, 1]` → `[1, 2, 3]`.

Transform the array `nums` into its next permutation **in place**, and return the array so the tests can see it. Use only constant extra space.

### Example 1

```text
Input:  nums = [1, 2, 3]
Output:  [1, 3, 2]
```

### Example 2

```text
Input:  nums = [3, 2, 1]
Output:  [1, 2, 3]
```

### Example 3

```text
Input:  nums = [1, 1, 5]
Output:  [1, 5, 1]
```

### Constraints

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 100`

## Hints

- Look from the right: the longest **suffix** in descending order is already in its largest arrangement. The element that needs to change is the one immediately to the left of this suffix.
- Swap that element (`nums[i]`) with the **smallest** element in the suffix that is **greater** than it.
- After the swap, the suffix is still in descending order; reversing it gives the smallest arrangement.

## Solution

### Pivot, swap, reverse

1. **Find the pivot:** Starting from the right, look for the first `i` with `nums[i] < nums[i + 1]`. If there is none, the array is entirely descending; reverse the whole array.
2. **Swap:** Starting from the right, find the first `j` with `nums[j] > nums[i]`. Since the suffix is descending, this is the **smallest** element greater than `nums[i]`. Swap `nums[i]` and `nums[j]`.
3. **Reverse:** The part from `i + 1` to the end is still in descending order; reversing it makes it ascending, which is the smallest arrangement.

This way the array grows only as much as needed: the pivot position grows by one step, and everything to its right drops to its smallest form.

```csharp solution
public class Solution
{
    public int[] NextPermutation(int[] nums)
    {
        var i = nums.Length - 2;
        while (i >= 0 && nums[i] >= nums[i + 1])
        {
            i--;
        }

        if (i >= 0)
        {
            var j = nums.Length - 1;
            while (nums[j] <= nums[i])
            {
                j--;
            }

            (nums[i], nums[j]) = (nums[j], nums[i]);
        }

        Array.Reverse(nums, i + 1, nums.Length - i - 1);
        return nums;
    }
}
```

```typescript solution
function nextPermutation(nums: number[]): number[] {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) {
    i--;
  }

  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) {
      j--;
    }
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }

  let left = i + 1;
  let right = nums.length - 1;
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }

  return nums;
}
```

### Complexity

- **Time:** O(n). At most three linear passes.
- **Space:** O(1).
