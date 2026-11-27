---
title: Basic Calculator
---
You are given a string `s` that represents a valid mathematical expression. Implement a basic calculator that evaluates this expression and return the result of the evaluation.

The string consists of digits (`0-9`), addition (`'+'`), subtraction (`'-'`), parentheses (`'('`, `')'`) and spaces (`' '`). The `'-'` character can also be used as a unary operator (for example, `"-1"` and `"-(2 + 3)"` are valid).

**Note:** You may not use built-in functions such as `eval()` that evaluate strings as mathematical expressions.

### Example 1

```text
Input:  s = "1 + 1"
Output:  2
Explanation: The sum of 1 and 1 is 2.
```

### Example 2

```text
Input:  s = " 2-1 + 2 "
Output:  3
Explanation: Spaces are ignored; 2 - 1 + 2 = 3.
```

### Example 3

```text
Input:  s = "(1+(4+5+2)-3)+(6+8)"
Output:  23
Explanation: Working from the inner parentheses outward: (1 + 11 - 3) + 14 = 9 + 14 = 23.
```

### Constraints

- `1 <= s.length <= 3 * 10^5`
- `s` consists of digits, `'+'`, `'-'`, `'('`, `')'` and `' '`.
- `s` represents a valid mathematical expression.
- `'+'` is not used as a unary operator (expressions like `"+1"` or `"+(2 + 3)"` are not given).
- `'-'` may be used as a unary operator (`"-1"` and `"-(2 + 3)"` are valid).
- The input never contains two consecutive operators.
- Every number and every intermediate result fits in a 32-bit signed integer (`int`).

## Hints

- Since there is no multiplication or division, only parentheses determine precedence; you can think of each subtraction as setting the sign of the next number to `-1`.
- When reading multi-digit numbers, accumulate the number as you see each digit with `number = number * 10 + (c - '0')`.
- When you encounter a `'('`, save the `result` accumulated so far and the `sign` in front of the parenthesis on a stack (`Stack`), then start fresh for the inside of the parentheses with `result = 0` and `sign = 1`.
- When you reach a `')'`, first multiply the result inside the parentheses by the sign on top of the stack, then add the previous intermediate result from the stack.

## Solution

Since the expression only contains addition, subtraction and parentheses, we can make a single left-to-right pass, adding each term to the `result` variable together with its sign (`+1` or `-1`).

We keep three state variables:
1. `result`: the total computed so far at the current parenthesis level.
2. `number`: the multi-digit number currently being read.
3. `sign`: the sign of the next number or parenthesis (`+1` or `-1`).

While scanning the string character by character:
- If we see a **digit**, we grow the number with `number = number * 10 + (c - '0')`.
- If we see **`'+'` or `'-'`**, the previous number has been fully read: we add it to the result with `result += sign * number`, set `number = 0`, and store the new sign in `sign`. This approach also handles unary minus cases like `"- (2 + 3)"` naturally: since `number` starts at `0`, `result` doesn't change and only `sign = -1` is set.
- If we see **`'('`**, a new subexpression is starting. We push the current `result` and the `sign` in front of the parenthesis onto the stack (`Stack`); then we set `result = 0` and `sign = 1` and start evaluating the inside of the parentheses as an independent expression.
- If we see **`')'`**, we first add the last number inside the parentheses with `result += sign * number`. Then we pop the parenthesis's sign from the stack and multiply `result` by it, and after that pop the intermediate total from before the parenthesis and add it to `result`.

When the loop ends, if a final number remains outside any parentheses, we add it with `result + sign * number` and return the final result.

```csharp solution
public class Solution
{
    public int Calculate(string s)
    {
        Stack<int> stack = new Stack<int>();
        int result = 0;
        int number = 0;
        int sign = 1;

        foreach (char c in s)
        {
            if (char.IsDigit(c))
            {
                number = number * 10 + (c - '0');
            }
            else if (c == '+')
            {
                result += sign * number;
                number = 0;
                sign = 1;
            }
            else if (c == '-')
            {
                result += sign * number;
                number = 0;
                sign = -1;
            }
            else if (c == '(')
            {
                // Save the current total and the sign in front of the parenthesis.
                stack.Push(result);
                stack.Push(sign);
                result = 0;
                sign = 1;
            }
            else if (c == ')')
            {
                result += sign * number;
                number = 0;
                result *= stack.Pop(); // Sign in front of the parenthesis
                result += stack.Pop(); // Intermediate total before the parenthesis
            }
        }

        return result + sign * number;
    }
}
```

```typescript solution
function calculate(s: string): number {
  const stack: number[] = [];
  let result = 0;
  let number = 0;
  let sign = 1;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= '0' && c <= '9') {
      number = number * 10 + (c.charCodeAt(0) - 48);
    } else if (c === '+') {
      result += sign * number;
      number = 0;
      sign = 1;
    } else if (c === '-') {
      result += sign * number;
      number = 0;
      sign = -1;
    } else if (c === '(') {
      stack.push(result);
      stack.push(sign);
      result = 0;
      sign = 1;
    } else if (c === ')') {
      result += sign * number;
      number = 0;
      result *= stack.pop()!;
      result += stack.pop()!;
    }
  }

  return result + sign * number;
}
```

### Complexity

- **Time:** O(n). Each character in the string is processed exactly once, and stack operations take O(1).
- **Space:** O(n). The stack holds elements proportional to the nesting depth of the parentheses; in the worst case it uses O(n) memory.
