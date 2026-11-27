---
title: Pow(x, n)
---
Write a function `myPow(x, n)` that computes `x` raised to the power `n` (`x^n`). Do not use built-in power functions (`Math.Pow`, `**`).

### Example 1

```text
Input:  x = 2.0, n = 10
Output:  1024.0
```

### Example 2

```text
Input:  x = 2.1, n = 3
Output:  9.261
```

### Example 3

```text
Input:  x = 2.0, n = -2
Output:  0.25
Explanation: 2^-2 = 1 / 2^2 = 0.25
```

### Constraints

- `-100.0 < x < 100.0`
- `-2^31 <= n <= 2^31 - 1`
- `n` is an integer; if `x` is zero, then `n > 0`.
- `-10^4 <= x^n <= 10^4`

## Hints

- Multiplying `x` by itself `n` times is too slow for `n = 2^31`.
- Use the fact that `x^n = (x²)^(n/2)`. If `n` is odd, you need one extra multiplication by `x`.
- For a negative exponent, replace `x` with `1/x` and make the exponent positive. The absolute value of `n = -2^31` does not fit in an `int`; use `long`.

## Solution

### Fast exponentiation (by squaring)

Consider the binary representation of `n`: `x^13 = x^8 · x^4 · x^1` (13 = 1101₂). In the loop, `base` takes the values `x, x², x⁴, x⁸, ...` in turn; if the lowest bit of `n` is `1`, the current `base` is multiplied into the result, then `base` is multiplied by itself and `n` is shifted right by one bit.

For a negative exponent, we first set `x = 1 / x` and `n = -n`. When `n = -2^31`, `-n` does not fit in an `int`, so the exponent is converted to `long`.

```csharp solution
public class Solution
{
    public double MyPow(double x, int n)
    {
        long power = n;
        if (power < 0)
        {
            x = 1 / x;
            power = -power;
        }

        var result = 1.0;
        var current = x;
        while (power > 0)
        {
            if ((power & 1) == 1)
            {
                result *= current;
            }

            current *= current;
            power >>= 1;
        }

        return result;
    }
}
```

```typescript solution
function myPow(x: number, n: number): number {
  let power = n;
  if (power < 0) {
    x = 1 / x;
    power = -power;
  }

  let result = 1;
  let current = x;
  while (power > 0) {
    if (power % 2 === 1) {
      result *= current;
    }

    current *= current;
    power = Math.floor(power / 2);
  }

  return result;
}
```

### Complexity

- **Time:** O(log |n|). The exponent is halved at every step.
- **Space:** O(1).

The TypeScript solution uses `% 2` and division instead of `power & 1` and `>>`, because JavaScript's bitwise operations work on 32-bit signed integers and would break the value `2^31`.
