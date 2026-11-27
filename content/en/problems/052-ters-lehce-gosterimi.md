---
title: Evaluate Reverse Polish Notation
---
You are given an array `tokens` that represents an arithmetic expression in **Reverse Polish Notation (RPN)**. Evaluate the expression and return its value as an integer.

The valid operators are `'+'`, `'-'`, `'*'` and `'/'`. Each operand may be an integer or the result of another subexpression.

- Division between two integers **truncates toward zero**.
- There is no division by zero.
- The input is always a valid Reverse Polish Notation expression.

### Example 1

```text
Input:  tokens = ["2", "1", "+", "3", "*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9
```

### Example 2

```text
Input:  tokens = ["4", "13", "5", "/", "+"]
Output: 6
Explanation: (4 + (13 / 5)) = 4 + 2 = 6
```

### Example 3

```text
Input:  tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]
Output: 22
Explanation:
((10 * (6 / ((9 + 3) * -11))) + 17) + 5
= ((10 * (6 / -132)) + 17) + 5
= ((10 * 0) + 17) + 5
= 22
```

### Constraints

- `1 <= tokens.length <= 10^4`
- `tokens[i]` is either one of the operators `"+", "-", "*", "/"` or an integer string in the range `[-200, 200]`.

## Hints

- In Reverse Polish Notation, each operator is applied to the last two values that come right before it. Needing to "pop the two most recently added elements" points directly to the **stack** data structure.
- Scan the array from left to right: if the token is a number, push it onto the stack (`Push`).
- If the token is an operator, pop two numbers from the stack (`Pop`), apply the operation, and push the result back onto the stack.
- Watch the operand order for subtraction and division: the number popped **first** is the right operand (`b`), and the number popped **second** is the left operand (`a`); so the operation must be `a - b` and `a / b`.

## Solution

Reverse Polish Notation (postfix) needs no parentheses because each operator works on the two most recently produced numbers. We can model this behavior directly with a **stack (`Stack<int>`)**:

1. We read each token in `tokens` in order.
2. If the token is a number, we parse it as an integer and push it onto the stack.
3. If the token is one of the operators `+`, `-`, `*`, `/`:
   - We pop the second operand from the top of the stack first (`b = stack.Pop()`), then the first operand (`a = stack.Pop()`).
   - We compute `a (op) b` and push the result back onto the stack. (In C#, integer division `a / b` naturally truncates toward zero; in JavaScript/TypeScript, use `(a / b) | 0` or `Math.trunc`.)
4. When the array is exhausted, the single element left on the stack is the result of the expression.

```csharp solution
public class Solution
{
    public int EvalRPN(string[] tokens)
    {
        Stack<int> stack = new Stack<int>();

        foreach (string token in tokens)
        {
            if (token == "+" || token == "-" || token == "*" || token == "/")
            {
                int b = stack.Pop();
                int a = stack.Pop();

                int res = token switch
                {
                    "+" => a + b,
                    "-" => a - b,
                    "*" => a * b,
                    _ => a / b
                };

                stack.Push(res);
            }
            else
            {
                stack.Push(int.Parse(token));
            }
        }

        return stack.Pop();
    }
}
```

```typescript solution
function evalRPN(tokens: string[]): number {
  const stack: number[] = [];

  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const b = stack.pop()!;
      const a = stack.pop()!;

      let res: number;
      if (token === "+") res = a + b;
      else if (token === "-") res = a - b;
      else if (token === "*") res = a * b;
      else res = (a / b) | 0;

      stack.push(res);
    } else {
      stack.push(Number(token));
    }
  }

  return stack.pop()!;
}
```

### Complexity

- **Time:** O(n). Each token is read once; pushing onto and popping from the stack take O(1).
- **Space:** O(n). The stack holds at most O(n) numbers at any time.
