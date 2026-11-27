---
title: Decode String
---
You are given an encoded string `s`; decode it and return the expanded string.

The encoding rule is `k[encoded_string]`: the `encoded_string` inside the square brackets is repeated exactly `k` times (`k` is a positive integer). Square brackets can be nested (as in `3[a2[c]]`).

The input string is guaranteed to always be valid; there are no extra spaces, and the square brackets are well-formed. You may also assume that the original data contains no digits and that digits appear only as repeat counts (`k`). For example, inputs like `3a` or `2[4]` won't occur.

### Example 1

```text
Input:  s = "3[a]2[bc]"
Output:  "aaabcbc"
Explanation: "a" is repeated 3 times and "bc" 2 times, and the results are concatenated.
```

### Example 2

```text
Input:  s = "3[a2[c]]"
Output:  "accaccacc"
Explanation: First the inner "2[c]" -> "cc" is decoded, then "a" + "cc" = "acc" is repeated 3 times.
```

### Example 3

```text
Input:  s = "2[abc]3[cd]ef"
Output:  "abcabccdcdcdef"
```

### Constraints

- `1 <= s.length <= 30`
- `s` consists of lowercase English letters, digits, and the square brackets `'['` and `']'`.
- All integers in `s` are in the range `[1, 300]`.

## Hints

- For nested bracket structures, a **stack** is ideal for decoding the innermost expression first and then combining it with the outer one.
- The repeat count `k` can have more than one digit (as in `10[a]`); accumulate digits as you read them with `k = k * 10 + (ch - '0')`.
- When you see a `'['`, save the repeat count accumulated so far (`k`) and the current string (`current`) on stacks, then reset them.
- When you see a `']'`, pop the repeat count and the previous outer string from the stacks, and append the current string to the end of the previous string that many times.

## Solution

To decode nested `k[...]` blocks in a single left-to-right pass, we use two stacks:
1. `countStack`: stores the repeat count (`k`) read before each `'['`.
2. `stringStack`: stores the outer-context string accumulated before entering the `'['`.

While scanning the string character by character, we run into four cases:
- **Digit:** Since the number can have multiple digits, we update the current number with `k = k * 10 + (ch - '0')`.
- **`'['` (opening bracket):** We are entering a new inner block. We push the current `k` value onto `countStack` and the `current` string built so far onto `stringStack`. Then we set `k = 0` and `current = ""` for the new block.
- **`']'` (closing bracket):** The inner block is complete. We pop the repeat count (`repeat`) from `countStack` and the outer string (`prev`) from `stringStack`. Appending the `current` string to the end of `prev` `repeat` times gives the new `current` value.
- **Letter:** We append it directly to the end of `current`.

When the scan ends, `current` holds the fully decoded string.

```csharp solution
public class Solution
{
    public string DecodeString(string s)
    {
        Stack<int> countStack = new Stack<int>();
        Stack<StringBuilder> stringStack = new Stack<StringBuilder>();
        StringBuilder current = new StringBuilder();
        int k = 0;

        foreach (char ch in s)
        {
            if (char.IsDigit(ch))
            {
                k = k * 10 + (ch - '0');
            }
            else if (ch == '[')
            {
                countStack.Push(k);
                stringStack.Push(current);
                current = new StringBuilder();
                k = 0;
            }
            else if (ch == ']')
            {
                int repeat = countStack.Pop();
                StringBuilder prev = stringStack.Pop();
                for (int i = 0; i < repeat; i++)
                {
                    prev.Append(current);
                }
                current = prev;
            }
            else
            {
                current.Append(ch);
            }
        }

        return current.ToString();
    }
}
```

```typescript solution
function decodeString(s: string): string {
  const countStack: number[] = [];
  const stringStack: string[] = [];
  let current = "";
  let k = 0;

  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      k = k * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === "[") {
      countStack.push(k);
      stringStack.push(current);
      current = "";
      k = 0;
    } else if (ch === "]") {
      const repeat = countStack.pop()!;
      const prev = stringStack.pop()!;
      current = prev + current.repeat(repeat);
    } else {
      current += ch;
    }
  }

  return current;
}
```

### Complexity

- **Time:** O(M), where M is the length of the decoded (output) string. Each character is read once, and each character of the output is copied a constant number of times.
- **Space:** O(M), for the intermediate strings held on the stacks and the bracket nesting depth.
