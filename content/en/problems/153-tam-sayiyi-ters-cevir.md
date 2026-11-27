---
title: Reverse Integer
---
You are given a 32-bit signed integer `x`. Reverse its digits and return the result. If the reversed number falls outside the 32-bit signed integer range (`[-2^31, 2^31 - 1]`), return `0`.

Assume your environment cannot store 64-bit integers.

### Example 1

```text
Input:  x = 123
Output:  321
```

### Example 2

```text
Input:  x = -123
Output:  -321
```

### Example 3

```text
Input:  x = 120
Output:  21
```

### Constraints

- `-2^31 <= x <= 2^31 - 1`

## Hints

- You can peel off the digits one at a time from right to left by taking the last digit with `x % 10` and dividing `x` by `10`.
- Build the result with `result * 10 + digit`. Overflow must be checked **before** the multiplication, because you cannot detect an overflowed value afterwards.
- If `result > MaxValue / 10`, or it is equal and `digit > 7`, the next step overflows. Do the symmetric check for the negative side as well.

## Solution

### Building digit by digit while checking for overflow in advance

In each round, the last digit `digit = x % 10` is taken and `x /= 10` is applied. In C#, the remainder of a negative number is also negative, so the same loop reverses negative numbers correctly too.

Before the operation `result = result * 10 + digit`, overflow is checked:

- If `result > int.MaxValue / 10` or (`result == int.MaxValue / 10` and `digit > 7`), the upper bound is exceeded.
- If `result < int.MinValue / 10` or (`result == int.MinValue / 10` and `digit < -8`), the lower bound is exceeded.

These are the limits because the last digit of `2147483647` is `7` and that of `-2147483648` is `8`.

```csharp solution
public class Solution
{
    public int Reverse(int x)
    {
        var result = 0;

        while (x != 0)
        {
            var digit = x % 10;
            x /= 10;

            if (result > int.MaxValue / 10 || (result == int.MaxValue / 10 && digit > 7))
            {
                return 0;
            }

            if (result < int.MinValue / 10 || (result == int.MinValue / 10 && digit < -8))
            {
                return 0;
            }

            result = result * 10 + digit;
        }

        return result;
    }
}
```

```typescript solution
function reverse(x: number): number {
  const MAX = 2147483647;
  const MIN = -2147483648;
  let result = 0;

  while (x !== 0) {
    const digit = x % 10;
    x = Math.trunc(x / 10);

    if (result > Math.trunc(MAX / 10) || (result === Math.trunc(MAX / 10) && digit > 7)) return 0;
    if (result < Math.trunc(MIN / 10) || (result === Math.trunc(MIN / 10) && digit < -8)) return 0;

    result = result * 10 + digit;
  }

  return result;
}
```

### Complexity

- **Time:** O(log |x|). One round per digit.
- **Space:** O(1).
