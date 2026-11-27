---
title: Decode Ways
---

The letters `'A'` to `'Z'` are encoded by mapping them to the numbers `1` to `26`:

- `'A' -> "1"`
- `'B' -> "2"`
- `...`
- `'Z' -> "26"`

To decode an encoded message, the digits must be grouped according to valid letter mappings and then converted to letters; often the same digit sequence can be grouped in more than one way. For example, the string `"11106"` can be decoded in these two ways:

- as `"AAJF"` (with the grouping `(1, 1, 10, 6)`)
- as `"KJF"` (with the grouping `(11, 10, 6)`)

Note that the grouping `(1, 11, 06)` is **invalid**, because `"06"` has a leading zero and does not map to any letter (`"6"` and `"06"` are different).

Given a string `s` of digits only, return the **total number of ways** to decode it. If the message cannot be decoded in any valid way, return `0`.

The test data is generated so that the answer fits in a 32-bit signed integer (`int`).

### Example 1

```text
Input:  s = "12"
Output:  2
Explanation: "12" can be decoded in 2 different ways: "AB" (1 2) or "L" (12).
```

### Example 2

```text
Input:  s = "226"
Output:  3
Explanation: "226" can be decoded in 3 different ways: "BZ" (2 26), "VF" (22 6) or "BBF" (2 2 6).
```

### Example 3

```text
Input:  s = "06"
Output:  0
Explanation: "06" has a leading zero, so it cannot be decoded as "F" ("6" and "06" are not the same). '0' on its own is not a valid letter either.
```

### Constraints

- `1 <= s.length <= 100`
- `s` contains only digits and may contain leading zeros.

## Hints

- Think of `dp[i]` as the number of ways to decode the substring `s[i..]` starting at position `i`.
- If `s[i] == '0'`, no valid letter can start at this position (`dp[i] = 0`).
- If `s[i]` is between `'1'` and `'9'`, it can be split off as a single-digit letter, leaving `s[i+1..]` (`dp[i + 1]` ways).
- Also, if the two-digit number `s[i..i+2]` is between `10` and `26`, it can be split off as a two-digit letter, leaving `s[i+2..]` (`dp[i + 2]` ways). Since each step only needs the last two values, you can write the solution with O(1) memory.

## Solution

We solve the problem with dynamic programming from right to left. Let `dp[i]` be the number of ways to decode the suffix `s[i..]`, from index `i` to the end of `s`. As the base case, the empty suffix represents one valid completion, so `dp[n] = 1`.

At each position `i` (going from `n - 1` down to `0`) we have two options:

1. **Single-digit choice:** if `s[i] == '0'`, the `'0'` cannot be decoded on its own or as the start of a two-digit number, so `dp[i] = 0`. If the digit `s[i]` is in `'1'..'9'`, it becomes a single letter and the rest, `s[i+1..]`, can be decoded in `dp[i + 1]` different ways.
2. **Two-digit choice:** if `i + 1 < n` and `s[i]` followed by `s[i + 1]` forms a number between `"10"` and `"26"` (`s[i] == '1'` or `s[i] == '2' && s[i + 1] <= '6'`), these two digits can together become a single letter, and the rest, `s[i+2..]`, can be decoded in `dp[i + 2]` different ways. We add this value to the total as well.

Since `dp[i]` depends only on `dp[i + 1]` and `dp[i + 2]`, instead of keeping the whole array we use just two variables, `next1` (`dp[i + 1]`) and `next2` (`dp[i + 2]`), bringing the space down to O(1).

```csharp solution
public class Solution
{
    public int NumDecodings(string s)
    {
        int next1 = 1; // dp[i + 1]: number of ways to decode the suffix s[i+1..]
        int next2 = 0; // dp[i + 2]: number of ways to decode the suffix s[i+2..]

        for (int i = s.Length - 1; i >= 0; i--)
        {
            int current = 0;

            if (s[i] != '0')
            {
                current = next1;

                if (i + 1 < s.Length && (s[i] == '1' || (s[i] == '2' && s[i + 1] <= '6')))
                    current += next2;
            }

            next2 = next1;
            next1 = current;
        }

        return next1;
    }
}
```

```typescript solution
function numDecodings(s: string): number {
  let next1 = 1;
  let next2 = 0;

  for (let i = s.length - 1; i >= 0; i--) {
    let current = 0;

    if (s[i] !== "0") {
      current = next1;

      if (
        i + 1 < s.length &&
        (s[i] === "1" || (s[i] === "2" && s[i + 1] <= "6"))
      ) {
        current += next2;
      }
    }

    next2 = next1;
    next1 = current;
  }

  return next1;
}
```

### Complexity

- **Time:** O(n). The string is scanned from right to left in a single pass, with constant-time work per character.
- **Space:** O(1). Instead of the whole `dp` array, only the `next1` and `next2` variables, which hold the last two states, are used.
