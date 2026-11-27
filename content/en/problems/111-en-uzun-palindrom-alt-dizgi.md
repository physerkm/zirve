---
title: Longest Palindromic Substring
---
You are given a string `s`. Return the **longest palindromic substring** (made of contiguous characters) in `s`.

If there is more than one answer of the same length, return the **one that starts furthest left**.

### Example 1

```text
Input:  s = "babad"
Output:  "bab"
Explanation: "aba" is also a palindrome of length 3, but "bab" starts further left.
```

### Example 2

```text
Input:  s = "cbbd"
Output:  "bb"
```

### Constraints

- `1 <= s.length <= 1000`
- `s` consists only of digits and English letters.

## Hints

- Checking every substring one by one takes O(n³).
- A palindrome is symmetric around its center. Expand outward from every possible center.
- A center can be a character (odd length) or the gap between two characters (even length): `2n - 1` centers in total.

## Solution

### Expand around the center

For each `i` we do two expansions: one centered at `(i, i)` (odd length) and one centered at `(i, i + 1)` (even length). The expansion moves both ends outward as long as `s[left] == s[right]` and returns the length of the palindrome it found.

If a longer palindrome is found, the start position and length are updated. Because the centers are visited from left to right and only **strictly longer** palindromes are accepted, the leftmost one is kept among palindromes of equal length.

```csharp solution
public class Solution
{
    public string LongestPalindrome(string s)
    {
        var start = 0;
        var bestLength = 1;

        for (var i = 0; i < s.Length; i++)
        {
            var odd = Expand(s, i, i);
            var even = Expand(s, i, i + 1);
            var length = Math.Max(odd, even);
            if (length > bestLength)
            {
                bestLength = length;
                start = i - (length - 1) / 2;
            }
        }

        return s.Substring(start, bestLength);
    }

    private static int Expand(string s, int left, int right)
    {
        while (left >= 0 && right < s.Length && s[left] == s[right])
        {
            left--;
            right++;
        }

        return right - left - 1;
    }
}
```

```typescript solution
function longestPalindrome(s: string): string {
  const expand = (left: number, right: number): number => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return right - left - 1;
  };

  let start = 0;
  let bestLength = 1;
  for (let i = 0; i < s.length; i++) {
    const length = Math.max(expand(i, i), expand(i, i + 1));
    if (length > bestLength) {
      bestLength = length;
      start = i - Math.floor((length - 1) / 2);
    }
  }

  return s.slice(start, start + bestLength);
}
```

### Complexity

- **Time:** O(n²). Each of the `2n - 1` centers expands at most O(n).
- **Space:** O(1).

It can also be solved in O(n²) time with the table `dp[i][j] = s[i] == s[j] && dp[i+1][j-1]`, but that needs O(n²) space. Manacher's algorithm is O(n); in an interview, knowing its name is usually enough.
