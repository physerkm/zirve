---
title: Valid Parentheses
---
You are given a string `s` consisting only of the characters `(`, `)`, `{`, `}`, `[` and `]`. Return whether the string is **valid**.

The string is valid if:

1. Every opening bracket is closed by a bracket of the same type.
2. Brackets are closed in the correct order.
3. Every closing bracket has a matching opening bracket of the same type.

### Example 1

```text
Input:  s = "()[]{}"
Output:  true
```

### Example 2

```text
Input:  s = "(]"
Output:  false
```

### Example 3

```text
Input:  s = "([{}])"
Output:  true
```

### Constraints

- `1 <= s.length <= 10^4`

## Hints

- The most recently opened bracket is the first one that must be closed. Which data structure does this "last in, first out" behavior remind you of?
- Push opening brackets onto a stack. When you see a closing bracket, it must match the one on top of the stack.
- If the stack isn't empty when the string ends, some bracket was left unclosed.

## Solution

Push every opening bracket onto a stack. When you encounter a closing bracket, the element on top of the stack must be its match; if it isn't (or the stack is empty), the string is invalid. At the end of the string, the stack must be empty.

There are three failure cases, and all three must be handled: a closing bracket of the wrong type `"(]"`, a closing bracket with no match `")"`, and an unclosed opening bracket `"(("`.

```csharp solution
public class Solution
{
    public bool IsValid(string s)
    {
        var pairs = new Dictionary<char, char> { [')'] = '(', [']'] = '[', ['}'] = '{' };
        var stack = new Stack<char>();

        foreach (var ch in s)
        {
            if (pairs.TryGetValue(ch, out var opening))
            {
                if (stack.Count == 0 || stack.Pop() != opening) return false;
            }
            else
            {
                stack.Push(ch);
            }
        }

        return stack.Count == 0;
    }
}
```

```typescript solution
function isValid(s: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];

  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }

  return stack.length === 0;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(n); in the worst case, every character is an opening bracket.

A small optimization: a string of odd length can never be valid; you can check this up front and return `false` immediately.
