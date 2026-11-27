---
title: Sum of Two Integers
---
You are given two integers `a` and `b`. Return their sum **without using** the `+` and `-` operators.

### Example 1

```text
Input:  a = 1, b = 2
Output:  3
```

### Example 2

```text
Input:  a = 2, b = 3
Output:  5
```

### Constraints

- `-1000 <= a, b <= 1000`

## Hints

- When adding two bits, the sum bit equals their XOR and the carry bit equals their AND.
- `a ^ b` gives the sum without carries, and `(a & b) << 1` gives the carries shifted left by one. Adding these two is the same problem again.
- Repeat until no carry is left. In two's complement representation, negative numbers work the same way.

## Solution

### XOR and the carry loop

In each round:

- `carry = (a & b) << 1`: the bits where both numbers are `1` produce a carry into the next higher position.
- `a = a ^ b`: the bit-by-bit sum, ignoring carries.
- `b = carry`: the carries to be added in the next round.

When `b` (the carry) becomes zero, `a` is the sum itself. In two's complement representation, addition works by the same rules regardless of the bits, so negative numbers need no special handling; with 32-bit overflow, the carry becomes zero within at most 32 rounds.

```csharp solution
public class Solution
{
    public int GetSum(int a, int b)
    {
        while (b != 0)
        {
            var carry = (a & b) << 1;
            a ^= b;
            b = carry;
        }

        return a;
    }
}
```

```typescript solution
function getSum(a: number, b: number): number {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }

  return a;
}
```

### Complexity

- **Time:** O(1). At most 32 rounds (the bit width).
- **Space:** O(1).

This is the software counterpart of the hardware "half adder" logic: XOR is the sum bit, and AND is the carry bit.
