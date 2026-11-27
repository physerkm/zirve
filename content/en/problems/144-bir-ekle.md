---
title: Plus One
---
You are given an array of digits `digits` representing a large integer, where `digits[i]` is the `i`-th digit of the number, ordered from the most significant digit to the least significant (left to right). The large integer never contains unnecessary leading `0`s (except for the number `0` itself).

**Increment** this large integer **by 1** and return the digit array of the resulting number.

### Example 1

```text
Input:  digits = [1,2,3]
Output:  [1,2,4]
Explanation: The array represents the number 123. Since 123 + 1 = 124, [1,2,4] is returned.
```

### Example 2

```text
Input:  digits = [4,3,2,1]
Output:  [4,3,2,2]
Explanation: The array represents the number 4321. Since 4321 + 1 = 4322, [4,3,2,2] is returned.
```

### Example 3

```text
Input:  digits = [9]
Output:  [1,0]
Explanation: The array represents the number 9. Since 9 + 1 = 10, [1,0] is returned.
```

### Constraints

- `1 <= digits.length <= 100`
- `0 <= digits[i] <= 9`
- `digits` does not contain unnecessary leading `0`s.

## Hints

- Since the array can have up to 100 digits, converting it to an `int` or `long` and adding 1 leads to overflow.
- Apply the right-to-left addition you learned in elementary school directly on the array.
- If a digit is less than `9`, adding 1 produces no carry; you can increment that digit by 1 and return the array right away.
- But what if all the digits are `9` (for example `[9, 9, 9]`)? What are the size and elements of the result array then?

## Solution

We start the addition at the rightmost (least significant) digit and move left:
1. If the current digit `digits[i]` is less than `9` (`0..8`), adding 1 produces no carry: we do `digits[i]++` and, since no other digit will change, return the `digits` array directly.
2. If the current digit is `9`, then `9 + 1 = 10`, so this digit becomes `0` (`digits[i] = 0`) and the carry `1` is passed to the digit on its left (the loop moves on to the next step).
3. If the loop ends without ever hitting `return`, **all** the digits in the array are `9` (`99..9 + 1 = 100..0`). In that case we allocate a new array of length `digits.Length + 1`, set only its first element to `1` (`result[0] = 1`; the rest are `0` by default), and return it.

```csharp solution
public class Solution
{
    public int[] PlusOne(int[] digits)
    {
        for (int i = digits.Length - 1; i >= 0; i--)
        {
            // Increment the first digit smaller than 9; no carry is produced, so return right away.
            if (digits[i] < 9)
            {
                digits[i]++;
                return digits;
            }

            // If the digit is 9, it becomes 0 and the carry moves to the digit on the left.
            digits[i] = 0;
        }

        // If all digits are 9: 99...9 + 1 = 100...0
        int[] result = new int[digits.Length + 1];
        result[0] = 1;
        return result;
    }
}
```

```typescript solution
function plusOne(digits: number[]): number[] {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;
      return digits;
    }

    digits[i] = 0;
  }

  const result = new Array<number>(digits.length + 1).fill(0);
  result[0] = 1;
  return result;
}
```

### Complexity

- **Time:** O(n). In the worst case (when all digits are `9`), the array is scanned once from back to front.
- **Space:** O(1) (if not all digits are `9`, the array is updated in place; when all digits are `9`, a new array of size O(n) is created for the output).
