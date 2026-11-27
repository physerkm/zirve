---
title: Valid Anagram
---
You are given two strings `s` and `t`. Return `true` if `t` is an **anagram** of `s`, and `false` otherwise.

An anagram is a word formed by rearranging all the letters of another word, using each letter exactly once.

### Example 1

```text
Input:  s = "anagram", t = "nagaram"
Output:  true
```

### Example 2

```text
Input:  s = "rat", t = "car"
Output:  false
```

### Constraints

- `1 <= s.length, t.length <= 5 * 10^4`
- `s` and `t` consist of lowercase English letters only.

**Follow-up:** How would your solution change if the input contained Unicode characters?

## Hints

- Two strings of different lengths can't be anagrams.
- Two strings being anagrams means every letter appears **the same number of times** in both.
- Since the alphabet has 26 letters, you can keep the frequencies in an array of 26 elements.

## Solution

Count how many times each letter appears: increment the counter for `s` and decrement it for `t`. If the two strings are anagrams, every counter ends at zero.

```csharp solution
public class Solution
{
    public bool IsAnagram(string s, string t)
    {
        if (s.Length != t.Length) return false;

        var counts = new int[26];

        for (var i = 0; i < s.Length; i++)
        {
            counts[s[i] - 'a']++;
            counts[t[i] - 'a']--;
        }

        return counts.All(count => count == 0);
    }
}
```

```typescript solution
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;

  const counts = new Map<string, number>();

  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  for (const ch of t) {
    const remaining = counts.get(ch);
    if (!remaining) return false;      // letter missing or its count is used up
    counts.set(ch, remaining - 1);
  }

  return true;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1); the counter size is bounded by the alphabet (26).

**Answer to the follow-up:** For Unicode, a fixed-size array isn't enough; use a hash table as in the TypeScript solution. Space then grows with the number of distinct characters.

**Alternative:** Sorting both strings and comparing them is shorter to write, but it's O(n log n).
