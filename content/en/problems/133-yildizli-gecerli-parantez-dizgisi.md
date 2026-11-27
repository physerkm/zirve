---
title: Valid Parenthesis String
---
You are given a string `s` consisting only of the characters `'('`, `')'` and `'*'`. Return `true` if `s` is valid.

Rules:

- Every `'('` must have a corresponding `')'` that comes **after** it.
- Every `')'` must have a corresponding `'('` that comes **before** it.
- `'*'` can be treated as a single `'('`, a single `')'`, or an empty string.

### Example 1

```text
Input:  s = "()"
Output:  true
```

### Example 2

```text
Input:  s = "(*)"
Output:  true
```

### Example 3

```text
Input:  s = "(*))"
Output:  true
Explanation: '*' is treated as a '('.
```

### Constraints

- `1 <= s.length <= 100`
- `s[i]` is `'('`, `')'` or `'*'`.

## Hints

- Without stars, a counter of open parentheses would be enough: it must never drop below zero and must be zero at the end.
- Each star has three interpretations; trying all of them is exponential. Instead, track the **range** of values the number of open parentheses can take.
- `lo`: the minimum possible number of open parentheses, `hi`: the maximum. For `'*'`, do `lo--`, `hi++`. If `hi < 0`, the string is invalid; if `lo` goes negative, set it to `0`. At the end, `lo == 0` must hold.

## Solution

### The range of open-parenthesis counts

As you read the string from left to right, the "number of open parentheses not yet closed" across all interpretations of the stars forms a range: `[lo, hi]`.

- `'('`: both ends increase by one.
- `')'`: both ends decrease by one.
- `'*'`: `lo` decreases by one (the star may be `')'`), `hi` increases by one (the star may be `'('`).

If `hi < 0`, there are too many `')'` even if every star is `'('`: `false`. If `lo` goes negative, it is clamped to `0`; a negative count of open parentheses is not a valid state, so those interpretations are discarded. If `lo == 0` at the end, there is an interpretation in which every open parenthesis is closed.

```csharp solution
public class Solution
{
    public bool CheckValidString(string s)
    {
        var lo = 0;
        var hi = 0;

        foreach (var ch in s)
        {
            if (ch == '(')
            {
                lo++;
                hi++;
            }
            else if (ch == ')')
            {
                lo--;
                hi--;
            }
            else
            {
                lo--;
                hi++;
            }

            if (hi < 0)
            {
                return false;
            }

            lo = Math.Max(lo, 0);
        }

        return lo == 0;
    }
}
```

```typescript solution
function checkValidString(s: string): boolean {
  let lo = 0;
  let hi = 0;

  for (const ch of s) {
    if (ch === '(') {
      lo++;
      hi++;
    } else if (ch === ')') {
      lo--;
      hi--;
    } else {
      lo--;
      hi++;
    }

    if (hi < 0) return false;
    lo = Math.max(lo, 0);
  }

  return lo === 0;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1).

Alternatively, you can keep two stacks (indices of open parentheses and indices of stars); at the end, the remaining open parentheses are matched with stars that come **after** them. That also runs in O(n) but uses O(n) space.
