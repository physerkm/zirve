---
title: Palindrome Partitioning
---
You are given a string `s`. Partition `s` so that every substring of the partition is a **palindrome**. Return all possible partitions. The partitions may be in any order; the pieces within each partition are ordered from left to right.

### Example 1

```text
Input:  s = "aab"
Output: [["a","a","b"],["aa","b"]]
```

### Example 2

```text
Input:  s = "a"
Output: [["a"]]
```

### Constraints

- `1 <= s.length <= 16`
- `s` consists only of lowercase English letters.

## Hints

- Pick the first piece: if `s[0..i]` is a palindrome, solve the same problem for the rest, `s[i+1..]`.
- Write a backtracking function that tries every possible end at each position; return immediately on choices that are not palindromes.
- You can check for palindromes with two pointers, or precompute a DP table for all substrings.

## Solution

### Backtracking

The function `Backtrack(start)` partitions the part `s[start..]`. If `start == s.Length`, the current list of pieces is a complete partition, and a copy of it is added to the result. Otherwise, for `end = start .. n-1`, if `s[start..end]` is a palindrome, the piece is added to the list, `Backtrack(end + 1)` is called, and the piece is removed on the way back.

```csharp solution
public class Solution
{
    public IList<IList<string>> Partition(string s)
    {
        var result = new List<IList<string>>();
        var parts = new List<string>();

        void Backtrack(int start)
        {
            if (start == s.Length)
            {
                result.Add(new List<string>(parts));
                return;
            }

            for (var end = start; end < s.Length; end++)
            {
                if (!IsPalindrome(s, start, end))
                {
                    continue;
                }

                parts.Add(s.Substring(start, end - start + 1));
                Backtrack(end + 1);
                parts.RemoveAt(parts.Count - 1);
            }
        }

        Backtrack(0);
        return result;
    }

    private static bool IsPalindrome(string s, int left, int right)
    {
        while (left < right)
        {
            if (s[left++] != s[right--])
            {
                return false;
            }
        }

        return true;
    }
}
```

```typescript solution
function partition(s: string): string[][] {
  const result: string[][] = [];
  const parts: string[] = [];

  const isPalindrome = (left: number, right: number): boolean => {
    while (left < right) {
      if (s[left++] !== s[right--]) return false;
    }
    return true;
  };

  const backtrack = (start: number): void => {
    if (start === s.length) {
      result.push([...parts]);
      return;
    }

    for (let end = start; end < s.length; end++) {
      if (!isPalindrome(start, end)) continue;
      parts.push(s.slice(start, end + 1));
      backtrack(end + 1);
      parts.pop();
    }
  };

  backtrack(0);
  return result;
}
```

### Complexity

- **Time:** O(n × 2^n). Each of the `n - 1` cut points is either cut or not; each partition is copied in O(n) time.
- **Space:** O(n) for the recursion and the list of pieces (excluding the output).
