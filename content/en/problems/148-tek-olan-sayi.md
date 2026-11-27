---
title: Single Number
---
You are given a non-empty integer array `nums`. In this array, **every element appears exactly twice** except for one. Find and return the single element that appears **only once**.

Your solution must have **linear time complexity** (`O(n)`) and use only **constant extra memory** (`O(1)`).

### Example 1

```text
Input:  nums = [2, 2, 1]
Output:  1
Explanation: The number 2 appears twice, while the number 1 appears only once.
```

### Example 2

```text
Input:  nums = [4, 1, 2, 1, 2]
Output:  4
Explanation: The numbers 1 and 2 each appear twice; the one left over is 4.
```

### Example 3

```text
Input:  nums = [1]
Output:  1
```

### Constraints

- `1 <= nums.length <= 3 * 10^4`
- `-3 * 10^4 <= nums[i] <= 3 * 10^4`
- Every element in the array appears exactly twice except for one.

## Hints

- You can count how many times each element appears using a set (`HashSet`) or a table (`Dictionary`); however, that requires `O(n)` extra memory.
- To meet the constant memory (`O(1)`) constraint, think about bitwise operations.
- Recall two key properties of the bitwise XOR (`^`) operation: `a ^ a = 0` and `a ^ 0 = a`.
- XOR is commutative and associative, so the order in which the numbers appear in the array does not change the result.

## Solution

The key to solving this problem in constant memory is the bitwise **XOR (`^`)** operator. XOR produces `1` when two corresponding bits differ and `0` when they are the same. Three important properties follow from this rule:

1. **XOR of a number with itself is zero:** `a ^ a = 0` (because all its bits are the same).
2. **XOR of a number with zero is the number itself:** `a ^ 0 = a`.
3. **Order does not matter (commutativity and associativity):** `a ^ b ^ a = (a ^ a) ^ b = 0 ^ b = b`.

We start with `result = 0` and XOR every number in the array into `result` in turn. Every number that appears twice eventually cancels itself out (`x ^ x = 0`), even if other numbers sit between the two copies. Once all the pairs have turned into `0`, only the number that appears once is left (`0 ^ single = single`).

```csharp solution
public class Solution
{
    public int SingleNumber(int[] nums)
    {
        int result = 0;

        foreach (int num in nums)
        {
            // Paired numbers cancel each other out (a ^ a = 0); the single one remains.
            result ^= num;
        }

        return result;
    }
}
```

```typescript solution
function singleNumber(nums: number[]): number {
  let result = 0;

  for (const num of nums) {
    result ^= num;
  }

  return result;
}
```

### Complexity

- **Time:** `O(n)`. Each element in the array is visited only once, and each step performs a constant-time (`O(1)`) XOR operation.
- **Space:** `O(1)`. Regardless of the input size, only a single integer variable (`result`) is used.
