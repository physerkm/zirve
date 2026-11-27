---
title: Letter Combinations of a Phone Number
---
You are given a string `digits` containing digits from `2` to `9`. On an old telephone keypad, each digit maps to several letters:

```text
2: abc   3: def   4: ghi   5: jkl
6: mno   7: pqrs  8: tuv   9: wxyz
```

Return **all possible letter combinations** that these digits could represent, in any order. If `digits` is empty, return an empty list.

### Example 1

```text
Input:  digits = "23"
Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]
```

### Example 2

```text
Input:  digits = ""
Output: []
```

### Example 3

```text
Input:  digits = "2"
Output: ["a","b","c"]
```

### Constraints

- `0 <= digits.length <= 4`
- `digits[i]` is a digit in the range `['2', '9']`.

## Hints

- Keep the letters for each digit in a lookup table.
- Write a backtracking function that, for each position, picks one of that digit's letters and moves on to the next position.
- When the combination's length reaches the number of digits, add it to the result.

## Solution

### Backtracking

`Backtrack(i)` picks a letter for the `i`-th digit. If `i == digits.Length`, the string built so far is complete and is added to the result. Otherwise, for each letter of the digit, the letter is appended, `Backtrack(i + 1)` is called, and the letter is removed on the way back.

```csharp solution
public class Solution
{
    private static readonly string[] Letters = { "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz" };

    public IList<string> LetterCombinations(string digits)
    {
        var result = new List<string>();
        if (digits.Length == 0)
        {
            return result;
        }

        var current = new StringBuilder();

        void Backtrack(int i)
        {
            if (i == digits.Length)
            {
                result.Add(current.ToString());
                return;
            }

            foreach (var letter in Letters[digits[i] - '0'])
            {
                current.Append(letter);
                Backtrack(i + 1);
                current.Length--;
            }
        }

        Backtrack(0);
        return result;
    }
}
```

```typescript solution
function letterCombinations(digits: string): string[] {
  const letters = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
  const result: string[] = [];
  if (digits.length === 0) return result;

  const current: string[] = [];
  const backtrack = (i: number): void => {
    if (i === digits.length) {
      result.push(current.join(''));
      return;
    }

    for (const letter of letters[Number(digits[i])]) {
      current.push(letter);
      backtrack(i + 1);
      current.pop();
    }
  };

  backtrack(0);
  return result;
}
```

### Complexity

- **Time:** O(4^n × n). With keys of at most 4 letters, there are `4^n` combinations, and each one is built in O(n).
- **Space:** O(n) for the recursion (excluding the output).
