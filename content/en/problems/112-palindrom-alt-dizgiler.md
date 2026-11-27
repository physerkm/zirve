---
title: Palindromic Substrings
---
You are given a string `s`. Return the **number of palindromic substrings** in `s`. Substrings with different start or end positions count as different, even if their contents are the same.

### Example 1

```text
Input:  s = "abc"
Output:  3
Explanation: "a", "b", "c".
```

### Example 2

```text
Input:  s = "aaa"
Output:  6
Explanation: "a", "a", "a", "aa", "aa", "aaa".
```

### Constraints

- `1 <= s.length <= 1000`
- `s` consists of lowercase English letters.

## Hints

- The expand-around-the-center technique from "Longest Palindromic Substring" works here too.
- **Every** palindrome found while expanding from a center is a separate substring. Have the expansion increment a counter at each successful step.

## Solution

### Expand around the center and count

Every palindrome has a unique center: a character for odd lengths, the gap between two characters for even lengths. We expand outward from each of the `2n - 1` centers; at every step where the two ends match, we have found a new palindrome and the counter goes up. As soon as the match breaks, no longer palindrome can come from that center.

```csharp solution
public class Solution
{
    public int CountSubstrings(string s)
    {
        var count = 0;
        for (var i = 0; i < s.Length; i++)
        {
            count += Expand(s, i, i);
            count += Expand(s, i, i + 1);
        }

        return count;
    }

    private static int Expand(string s, int left, int right)
    {
        var found = 0;
        while (left >= 0 && right < s.Length && s[left] == s[right])
        {
            found++;
            left--;
            right++;
        }

        return found;
    }
}
```

```typescript solution
function countSubstrings(s: string): number {
  const expand = (left: number, right: number): number => {
    let found = 0;
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      found++;
      left--;
      right++;
    }
    return found;
  };

  let count = 0;
  for (let i = 0; i < s.length; i++) {
    count += expand(i, i) + expand(i, i + 1);
  }

  return count;
}
```

### Complexity

- **Time:** O(n²).
- **Space:** O(1).
