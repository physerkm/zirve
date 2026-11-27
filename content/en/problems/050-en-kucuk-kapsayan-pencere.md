---
title: Minimum Window Substring
---
You are given two strings `s` and `t`. Return the **shortest substring** of `s` (the minimum window substring) that contains every character of `t` (including duplicates). If there is no such substring in `s`, return the empty string `""`.

The test inputs are guaranteed to have a single (unique) correct answer.

### Example 1

```text
Input:  s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
Explanation: The smallest substring containing all of 'A', 'B' and 'C' is "BANC".
```

### Example 2

```text
Input:  s = "a", t = "a"
Output: "a"
Explanation: The whole string is the window we are looking for.
```

### Example 3

```text
Input:  s = "a", t = "aa"
Output: ""
Explanation: Both 'a' characters from t must be in the window; since s has only one 'a', there is no valid window.
```

### Constraints

- `1 <= s.length, t.length <= 10^5`
- `s` and `t` consist of uppercase and lowercase English letters.

## Hints

- First, record in a hash table (`target`) how many of each character in `t` you need.
- Manage a sliding window with two pointers (`left` and `right`): expand with `right` until you have a valid window, then shrink with `left` while it stays valid to find the shortest one.
- Instead of scanning the whole table each time to check whether the window is valid, use `have` and `need` counters that track how many distinct characters have reached their target count.
- The window is valid as long as `have == need`; if the window is shorter than the smallest so far, record its start index and length, then advance `left`.

## Solution

First, we write the frequency of every character in `t` into the `target` table. `need = target.Count` is the number of **distinct** characters that must reach their required count.

Then we run the `[left..right]` sliding window over `s`:
1. **Expand (`right++`):** We add `s[right]` to the `window` table. If this character is in `target` and `window[c] == target[c]` becomes true at exactly this step, we have fully satisfied one more character's requirement: `have++`.
2. **Shrink (`left++`):** As long as `have == need`, the current window covers every character of `t`. If the window length (`right - left + 1`) is less than `bestLen` so far, we record it as the new best window. To find an even shorter window, we remove `s[left]` from the window and move `left` one step right. If the removed character causes `window[drop] < target[drop]`, we do `have--` and leave the loop.

Since both `right` and `left` advance at most `s.Length` times, the algorithm runs in linear time.

```csharp solution
public class Solution
{
    public string MinWindow(string s, string t)
    {
        if (string.IsNullOrEmpty(s) || string.IsNullOrEmpty(t) || t.Length > s.Length)
            return "";

        Dictionary<char, int> target = new Dictionary<char, int>();
        foreach (char c in t)
            target[c] = target.GetValueOrDefault(c, 0) + 1;

        Dictionary<char, int> window = new Dictionary<char, int>();
        int have = 0;
        int need = target.Count;
        int bestStart = 0;
        int bestLen = int.MaxValue;
        int left = 0;

        for (int right = 0; right < s.Length; right++)
        {
            char c = s[right];
            window[c] = window.GetValueOrDefault(c, 0) + 1;

            if (target.ContainsKey(c) && window[c] == target[c])
                have++;

            // Shrink the window from the left while every character requirement is met.
            while (have == need)
            {
                int curLen = right - left + 1;
                if (curLen < bestLen)
                {
                    bestLen = curLen;
                    bestStart = left;
                }

                char drop = s[left];
                window[drop]--;
                if (target.ContainsKey(drop) && window[drop] < target[drop])
                    have--;

                left++;
            }
        }

        return bestLen == int.MaxValue ? "" : s.Substring(bestStart, bestLen);
    }
}
```

```typescript solution
function minWindow(s: string, t: string): string {
  if (!s || !t || t.length > s.length) return "";

  const target = new Map<string, number>();
  for (const c of t) {
    target.set(c, (target.get(c) ?? 0) + 1);
  }

  const window = new Map<string, number>();
  let have = 0;
  const need = target.size;
  let bestStart = 0;
  let bestLen = Infinity;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) ?? 0) + 1);

    if (target.has(c) && window.get(c) === target.get(c)) {
      have++;
    }

    while (have === need) {
      const curLen = right - left + 1;
      if (curLen < bestLen) {
        bestLen = curLen;
        bestStart = left;
      }

      const drop = s[left];
      window.set(drop, (window.get(drop) ?? 0) - 1);
      if (target.has(drop) && (window.get(drop) ?? 0) < (target.get(drop) ?? 0)) {
        have--;
      }

      left++;
    }
  }

  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}
```

### Complexity

- **Time:** O(|s| + |t|). `t` is scanned once to build the target table; then the `right` and `left` pointers each move across `s` at most once.
- **Space:** O(|s| + |t|) (or O(1) if the alphabet size is treated as constant), for the `target` and `window` hash tables.
