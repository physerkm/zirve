---
title: Minimum Remove to Make Valid Parentheses
---
You are given a string `s` made up of `'('`, `')'` and lowercase English letters.

Remove the **minimum number** of `'('` or `')'` characters so that the string becomes a **valid parentheses string**, and return the resulting valid string.

Formally, a parentheses string is valid if:
- It is the empty string or contains only lowercase letters,
- It can be written as the concatenation `AB` of two valid strings `A` and `B`,
- It can be written as `(A)` for some valid string `A`.

### Example 1

```text
Input:  s = "a)b(c)d"
Output:  "ab(c)d"
Explanation: The first ')' has no '(' to its left to match with; removing just that character gives the valid string "ab(c)d".
```

### Example 2

```text
Input:  s = "))(("
Output:  ""
Explanation: The leading ')' characters have no '(' to their left and the trailing '(' characters have no ')' to their right, so every parenthesis must be removed.
```

### Example 3

```text
Input:  s = ")k(o)d(l(a"
Output:  "k(o)dla"
Explanation: The leading ')' and the last two '(' cannot be matched; removing them leaves "k(o)dla".
```

### Constraints

- `1 <= s.length <= 10^5`
- `s[i]` is `'('`, `')'` or a lowercase English letter (`'a'..'z'`).

## Hints

- Letters don't affect the parentheses balance; they are never removed.
- Scanning left to right, when you see a `')'` and there is no earlier `'('` that is still open, that `')'` is definitely invalid and must be removed.
- Keep the indices of open `'('` characters on a stack (`Stack<int>`); pop an index every time you see a valid `')'`.
- When the scan ends, the indices still on the stack are extra `'('` characters with no closing parenthesis to their right; add them to the list of characters to remove as well.

## Solution

A parenthesis can be invalid in two ways:
1. A `')'` that arrives while no `'('` is open (it has no partner to its left).
2. A `'('` that is never closed by any `')'` before the end of the string (it has no partner to its right).

We mark the indices to remove in a `bool[] remove` array and keep the indices of open `'('` characters on a stack (`stack`):

1. Scan the string left to right:
   - If `s[i] == '('`, push index `i` onto the stack.
   - If `s[i] == ')'`, check the stack: if it is non-empty, match with the most recently opened `'('` and call `stack.Pop()`; if it is empty, this `')'` cannot be matched, so set `remove[i] = true`.
2. When the scan ends, every index left on the stack belongs to an unclosed `'('`. Empty the stack and set `remove[idx] = true` for each of them.
3. In a final pass, join the characters with `remove[i] == false` using a `StringBuilder` and return the result.

```csharp solution
public class Solution
{
    public string MinRemoveToMakeValid(string s)
    {
        var stack = new Stack<int>();
        var remove = new bool[s.Length];

        for (int i = 0; i < s.Length; i++)
        {
            if (s[i] == '(')
            {
                stack.Push(i);
            }
            else if (s[i] == ')')
            {
                if (stack.Count > 0)
                    stack.Pop();
                else
                    remove[i] = true; // No '(' to match with, so this ')' must be removed.
            }
        }

        // The '(' indices left on the stack have no closing parenthesis to their right; remove them all.
        while (stack.Count > 0)
        {
            remove[stack.Pop()] = true;
        }

        var sb = new System.Text.StringBuilder(s.Length);
        for (int i = 0; i < s.Length; i++)
        {
            if (!remove[i])
                sb.Append(s[i]);
        }

        return sb.ToString();
    }
}
```

```typescript solution
function minRemoveToMakeValid(s: string): string {
  const stack: number[] = [];
  const remove = new Array<boolean>(s.length).fill(false);

  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") {
      stack.push(i);
    } else if (s[i] === ")") {
      if (stack.length > 0) {
        stack.pop();
      } else {
        remove[i] = true;
      }
    }
  }

  while (stack.length > 0) {
    remove[stack.pop()!] = true;
  }

  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    if (!remove[i]) {
      out.push(s[i]);
    }
  }

  return out.join("");
}
```

### Complexity

- **Time:** O(n). The string is scanned a constant number of times; each index is pushed onto the stack at most once and popped once.
- **Space:** O(n). The stack, the `remove` array and the result string hold at most `n` elements.
