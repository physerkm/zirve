---
title: Number of 1 Bits
---
You are given a non-negative integer `n`. Write a function that returns the **number of `1` bits** in its binary representation (also known as its **Hamming weight**).

### Example 1

```text
Input:  n = 11
Output:  3
Explanation: The binary representation of 11 is 1011, which contains a total of 3 '1' bits.
```

### Example 2

```text
Input:  n = 128
Output:  1
Explanation: The binary representation of 128 is 10000000, which contains only 1 '1' bit.
```

### Example 3

```text
Input:  n = 2147483645
Output:  30
Explanation: Its binary representation is 01111111111111111111111111111101, which contains 30 '1' bits.
```

### Constraints

- `0 <= n <= 2^31 - 1`

## Hints

- You can shift the number's 32 bits to the right one at a time (`n >> i`) and check whether the rightmost bit is `1` with `(n & 1)`.
- But is it possible to skip the `0` bits entirely and jump directly over only the `1` bits?
- When you subtract `1` from a number (`n - 1`), the rightmost `1` bit turns into `0` and all the `0` bits to its right become `1`.
- What exactly does `n & (n - 1)` do? Try it on a few examples with pen and paper.

## Solution

The standard approach is to check all 32 bits with a loop. However, with the bit technique known as **Brian Kernighan's trick**, we can run the loop only as many times as there are `1` bits.

When we subtract `1` from a number `n` (`n - 1`), the binary representation changes like this:
- **The rightmost `1` bit** of `n` **becomes `0`**,
- All the `0`s to the right of that bit turn into `1`s,
- The bits to its left stay unchanged.

For example, for `n = 12` (`1100`), `n - 1 = 11` (`1011`). When we apply bitwise AND (`&`) to these two numbers:
`1100 & 1011 = 1000` (`8`). As you can see, `n & (n - 1)` **clears the rightmost `1` bit** of `n` **in a single step**.

Until our number becomes `0`, we apply `n = n & (n - 1)` at each step and increment the counter (`count`) by one. The number of steps it takes to reach `0` is exactly the number of `1` bits in the number.

```csharp solution
public class Solution
{
    public int HammingWeight(int n)
    {
        int count = 0;

        while (n != 0)
        {
            // Brian Kernighan's trick: clears the rightmost 1 bit.
            n &= (n - 1);
            count++;
        }

        return count;
    }
}
```

```typescript solution
function hammingWeight(n: number): number {
  let count = 0;

  while (n !== 0) {
    n &= n - 1;
    count++;
  }

  return count;
}
```

### Complexity

- **Time:** `O(1)`. A 32-bit integer can have at most 31 `1` bits; the loop runs at most as many times as there are `1` bits (`k <= 31`).
- **Space:** `O(1)`. Only constant memory is used, for the counter variable (`count`).
