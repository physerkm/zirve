---
title: Generate Parentheses
---
Given `n` pairs of parentheses, write a function that generates every combination of **well-formed** parentheses.

In a well-formed parentheses string, every opening parenthesis `'('` must be matched by a closing parenthesis `')'` that comes after it, and at no point may the number of closing parentheses exceed the number of opening ones.

### Example 1

```text
Input:  n = 3
Output: ["((()))", "(()())", "(())()", "()(())", "()()()"]
Explanation: There are 5 well-formed combinations in total that can be built from 3 pairs of parentheses.
```

### Example 2

```text
Input:  n = 1
Output: ["()"]
Explanation: With a single pair, only "()" can be built.
```

### Constraints

- `1 <= n <= 8`

## Hints

- Generating every string of length `2 * n` and checking validity afterward (`2^(2n)` candidates) is far too slow; only extend branches that **remain valid**.
- Track the number of opening parentheses added so far with `open` and the number of closing ones with `close`.
- When can you add a new `'('`? When you haven't used `n` opening parentheses yet (`open < n`).
- When can you add a new `')'`? When there is at least one parenthesis that has been opened but not yet closed (`close < open`).

## Solution

This problem is one of the most classic examples of **backtracking**. Starting from an empty string, we make one of two choices at each step: add `'('` or add `')'`. To never generate invalid strings, we apply two simple rules:

1. **Opening rule (`open < n`):** We can use at most `n` `'('` characters in total. As long as `open < n`, we can append `'('` to the string and continue recursively.
2. **Closing rule (`close < open`):** A `')'` is only valid if there is a `'('` that was opened earlier and not yet closed. So we can add `')'` only when `close < open`.

When the string length reaches `2 * n` (`open == n` and `close == n`), a valid combination is complete; we add it to the result list and return.

```csharp solution
public class Solution
{
    public IList<string> GenerateParenthesis(int n)
    {
        List<string> result = new List<string>();
        char[] current = new char[2 * n];

        void Backtrack(int pos, int open, int close)
        {
            if (pos == 2 * n)
            {
                result.Add(new string(current));
                return;
            }

            if (open < n)
            {
                current[pos] = '(';
                Backtrack(pos + 1, open + 1, close);
            }

            if (close < open)
            {
                current[pos] = ')';
                Backtrack(pos + 1, open, close + 1);
            }
        }

        Backtrack(0, 0, 0);
        return result;
    }
}
```

```typescript solution
function generateParenthesis(n: number): string[] {
  const result: string[] = [];
  const current: string[] = [];

  function backtrack(open: number, close: number): void {
    if (current.length === 2 * n) {
      result.push(current.join(""));
      return;
    }

    if (open < n) {
      current.push("(");
      backtrack(open + 1, close);
      current.pop();
    }

    if (close < open) {
      current.push(")");
      backtrack(open, close + 1);
      current.pop();
    }
  }

  backtrack(0, 0);
  return result;
}
```

### Complexity

- **Time:** O(4^n / √n). The number of valid parentheses strings generated is the n-th Catalan number `C_n = (1 / (n + 1)) * C(2n, n) ≈ 4^n / (n√(πn))`, and each one is built in O(n) time.
- **Space:** O(n) (not counting the output list). The recursion call stack depth and the `current` buffer are at most `2n`.
