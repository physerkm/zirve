---
title: Reverse Bits
---
You are given a 32-bit **unsigned** integer `n`. Reverse the order of the 32 bits of `n` and return the resulting unsigned number.

In the tests, the input and output are given as `long` (`number` in TypeScript) so they can hold the unsigned value; the values are always in the range `0 <= n < 2^32`.

### Example 1

```text
Input:  n = 43261596
Output:  964176192
Explanation: 00000010100101000001111010011100 → 00111001011110000010100101000000
```

### Example 2

```text
Input:  n = 4294967293
Output:  3221225471
Explanation: 11111111111111111111111111111101 → 10111111111111111111111111111111
```

### Constraints

- `0 <= n < 2^32`

**Follow-up:** If the function is called many times, how would you speed it up?

## Hints

- You can take the bits one at a time from right to left by reading the lowest bit of `n` with `n & 1` and shifting it right by one.
- Shift the result left and append the bit you read on the far right. After 32 rounds, the bits are in reverse order.
- Don't skip the leading zeros: you must run exactly 32 rounds.

## Solution

### Moving bits over one at a time in 32 rounds

`result` starts at `0`. In each round, `result` is shifted left by one and the lowest bit of `n` is appended at the far right of `result`; then `n` is shifted right by one. After 32 rounds, the rightmost bit of `n` reaches the leftmost position of `result`.

In C#, the operations are done on `uint` so that the shifts are not affected by the sign bit. In TypeScript, bitwise operations work on 32-bit **signed** numbers, so the result is built with multiplication and addition, while `n` is shifted with `>>> 1` (unsigned shift).

```csharp solution
public class Solution
{
    public long ReverseBits(long n)
    {
        var value = (uint)n;
        uint result = 0;

        for (var i = 0; i < 32; i++)
        {
            result = (result << 1) | (value & 1);
            value >>= 1;
        }

        return result;
    }
}
```

```typescript solution
function reverseBits(n: number): number {
  let value = n >>> 0;
  let result = 0;

  for (let i = 0; i < 32; i++) {
    result = result * 2 + (value & 1);
    value = value >>> 1;
  }

  return result;
}
```

### Complexity

- **Time:** O(1). Always 32 rounds.
- **Space:** O(1).

For the follow-up, the reverses of 8-bit chunks can be precomputed in a 256-entry table; then 32 bits are reversed with four table lookups. Alternatively, the bits can be swapped in five steps using divide-and-conquer masks (`0x55555555`, `0x33333333`, …).
