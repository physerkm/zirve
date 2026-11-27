---
title: Product of Array Except Self
---
You are given an integer array `nums`. Return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` **except** `nums[i]`.

Your solution must run in **O(n)** time and **must not use division**.

### Example 1

```text
Input:  nums = [1, 2, 3, 4]
Output: [24, 12, 8, 6]
```

### Example 2

```text
Input:  nums = [-1, 1, 0, -3, 3]
Output: [0, 0, 9, 0, 0]
```

### Constraints

- `2 <= nums.length <= 10^5`
- `-30 <= nums[i] <= 30`
- Every prefix and suffix product fits in a 32-bit integer.

**Follow-up:** Can you solve the problem with O(1) extra space? (The returned array does not count as extra space.)

## Hints

- Multiplying everything and dividing by `nums[i]` is both forbidden and broken when the array contains a 0.
- When you cover up one element, the rest form two groups: those to its left and those to its right.
- `answer[i]` = (product of the left side) × (product of the right side). You can compute the left products in a single left-to-right pass.
- You don't need a separate array for the right products: accumulate them in a single variable while going right to left.

## Solution

When we cover up one element, the rest split into two: the elements to its left and those to its right. The answer is the product of the two groups' products:

```text
answer[i] = (nums[0] · … · nums[i-1]) × (nums[i+1] · … · nums[n-1])
```

We compute it in two passes:

1. **Left to right:** We write into `answer[i]` the product of all the elements to the left of `i`. The first element has nothing to its left, so we write 1, the identity element of multiplication. Each following slot is the previous slot's value times the previous number.
2. **Right to left:** The variable `right` holds the product of the elements we have passed (that is, those to the right of `i`). Multiplying `answer[i]` by `right` completes that slot's answer; then `nums[i]` is folded into `right`.

Since the left products are written directly into the result array and the right products accumulate in a single variable, no extra array is needed.

Since there is no division, zeros give the correct result automatically: if there is a single 0, only that index's answer is nonzero; if there are two 0s, every answer is 0.

```csharp solution
public class Solution
{
    public int[] ProductExceptSelf(int[] nums)
    {
        int n = nums.Length;
        int[] answer = new int[n];

        // Left to right: answer[i] = product of everything to the left of i.
        answer[0] = 1;
        for (int i = 1; i < n; i++)
            answer[i] = answer[i - 1] * nums[i - 1];

        // Right to left: right is the product of everything to the right of i.
        int right = 1;
        for (int i = n - 1; i >= 0; i--)
        {
            answer[i] *= right;
            right *= nums[i];
        }

        return answer;
    }
}
```

```typescript solution
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const answer: number[] = new Array(n).fill(1);

  for (let i = 1; i < n; i++) {
    answer[i] = answer[i - 1] * nums[i - 1];
  }

  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }

  // Return 0 instead of -0: in JavaScript, 0 times a negative number is -0.
  return answer.map((value) => value + 0);
}
```

### Complexity

- **Time:** O(n), two passes.
- **Space:** O(1), not counting the returned array.

**An easier solution that needs more memory:** Keep the left and right products in two separate arrays named `left` and `right`, then multiply them slot by slot. It also runs in O(n) time but uses O(n) extra space. In an interview, a good approach is to explain this one first and then reduce it to a single variable.
