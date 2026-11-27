---
title: Multiply Strings
---
You are given two non-negative integers `num1` and `num2` represented as strings. Return their product, also as a string.

Do not use built-in big-number libraries (such as `BigInteger`), and do not convert the inputs to integers directly.

### Example 1

```text
Input:  num1 = "2", num2 = "3"
Output:  "6"
```

### Example 2

```text
Input:  num1 = "123", num2 = "456"
Output:  "56088"
```

### Constraints

- `1 <= num1.length, num2.length <= 200`
- The strings consist only of digits.
- Neither starts with a zero, except for `"0"` itself.

## Hints

- How do you do long multiplication on paper? Which digit of the result does each digit product land on?
- The product `num1[i] × num2[j]` affects positions `i + j` and `i + j + 1` of the result, counting from the left.
- The result has at most `m + n` digits. Keep an array of that length, accumulate the products in it, and propagate the carries right away.

## Solution

### Accumulating products in a digit array

We allocate a `digits` array of length `m + n`. Walking `i` and `j` from right to left, each digit product `p = num1[i] × num2[j]` is added to the current value at `digits[i + j + 1]`:

- `digits[i + j + 1] = sum % 10`
- `digits[i + j] += sum / 10` (the carry moves to the digit on the left)

Once all the products are done, the leading zeros are skipped. If the result is entirely zero, `"0"` is returned.

```csharp solution
public class Solution
{
    public string Multiply(string num1, string num2)
    {
        var m = num1.Length;
        var n = num2.Length;
        var digits = new int[m + n];

        for (var i = m - 1; i >= 0; i--)
        {
            for (var j = n - 1; j >= 0; j--)
            {
                var product = (num1[i] - '0') * (num2[j] - '0');
                var sum = product + digits[i + j + 1];
                digits[i + j + 1] = sum % 10;
                digits[i + j] += sum / 10;
            }
        }

        var builder = new StringBuilder();
        foreach (var digit in digits)
        {
            if (builder.Length == 0 && digit == 0)
            {
                continue;
            }

            builder.Append(digit);
        }

        return builder.Length == 0 ? "0" : builder.ToString();
    }
}
```

```typescript solution
function multiply(num1: string, num2: string): string {
  const m = num1.length;
  const n = num2.length;
  const digits = new Array<number>(m + n).fill(0);

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const product = Number(num1[i]) * Number(num2[j]);
      const sum = product + digits[i + j + 1];
      digits[i + j + 1] = sum % 10;
      digits[i + j] += Math.floor(sum / 10);
    }
  }

  const result = digits.join('').replace(/^0+/, '');
  return result === '' ? '0' : result;
}
```

### Complexity

- **Time:** O(m × n). Each pair of digits is multiplied once.
- **Space:** O(m + n).
