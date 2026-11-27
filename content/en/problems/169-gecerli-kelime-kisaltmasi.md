---
title: Valid Word Abbreviation
---
A string can be abbreviated by replacing any number of **non-adjacent**, non-empty substrings with their lengths. The lengths must not have **leading zeros**.

For example, `"substitution"` can be abbreviated as:

- `"s10n"` (`"s ubstitutio n"`)
- `"sub4u4"` (`"sub stit u tion"`)
- `"12"` (`"substitution"`)
- `"substitution"` (with nothing replaced)

These are **invalid**: `"s55n"` (the replaced substrings are adjacent), `"s010n"` (leading zero), `"s0ubstitution"` (empty substring).

You are given a word `word` and an abbreviation `abbr`. Return `true` if `abbr` is a valid abbreviation of `word`.

### Example 1

```text
Input:  word = "internationalization", abbr = "i12iz4n"
Output:  true
```

### Example 2

```text
Input:  word = "apple", abbr = "a2e"
Output:  false
```

### Constraints

- `1 <= word.length <= 20`, `word` consists of lowercase letters.
- `1 <= abbr.length <= 10`, `abbr` consists of lowercase letters and digits.
- Every number in `abbr` fits in a 32-bit integer.

## Hints

- Use two pointers: one in `word` and one in `abbr`.
- If you see a letter in `abbr`, it must match the letter in `word`. If you see a digit, read the whole number and advance that many positions in `word`.
- If a number starts with `0`, the abbreviation is invalid. At the end, both pointers must reach the end of their strings at the same time.

## Solution

### Two pointers

`i` is the position in `word`; `j` is the position in `abbr`.

- If `abbr[j]` is a letter, it must match `word[i]`; both advance by one.
- If `abbr[j]` is a digit: if it is `'0'`, the abbreviation is invalid (leading zero or empty substring). Otherwise, read the number until the digits end and advance `i` by that much. If `i` runs past the end of the word, the abbreviation is invalid.

At the end, `i == word.Length && j == abbr.Length` must hold. Since two adjacent numbers would be read as a single number in `abbr`, no extra check is needed (`"s55n"` → `55`, which runs past the word).

```csharp solution
public class Solution
{
    public bool ValidWordAbbreviation(string word, string abbr)
    {
        var i = 0;
        var j = 0;

        while (i < word.Length && j < abbr.Length)
        {
            if (char.IsDigit(abbr[j]))
            {
                if (abbr[j] == '0')
                {
                    return false;
                }

                var skip = 0;
                while (j < abbr.Length && char.IsDigit(abbr[j]))
                {
                    skip = skip * 10 + (abbr[j] - '0');
                    j++;
                }

                i += skip;
            }
            else
            {
                if (word[i] != abbr[j])
                {
                    return false;
                }

                i++;
                j++;
            }
        }

        return i == word.Length && j == abbr.Length;
    }
}
```

```typescript solution
function validWordAbbreviation(word: string, abbr: string): boolean {
  let i = 0;
  let j = 0;
  const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

  while (i < word.length && j < abbr.length) {
    if (isDigit(abbr[j])) {
      if (abbr[j] === '0') return false;
      let skip = 0;
      while (j < abbr.length && isDigit(abbr[j])) {
        skip = skip * 10 + Number(abbr[j]);
        j++;
      }
      i += skip;
    } else {
      if (word[i] !== abbr[j]) return false;
      i++;
      j++;
    }
  }

  return i === word.length && j === abbr.length;
}
```

### Complexity

- **Time:** O(|abbr|). The pointer in `word` skips ahead thanks to the numbers.
- **Space:** O(1).
