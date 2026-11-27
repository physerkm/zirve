---
title: Longest Substring Without Repeating Characters
---
You are given a string `s`. Return the length of the longest substring that **contains no repeating characters**.

A substring is a piece of the string made of **contiguous** characters.

### Example 1

```text
Input:  s = "abcabcbb"
Output:  3
Explanation: "abc" is the longest substring without repeating characters.
```

### Example 2

```text
Input:  s = "bbbbb"
Output:  1
```

### Example 3

```text
Input:  s = "pwwkew"
Output:  3
Explanation: The answer is "wke". "pwke" is not a substring, because its characters are not contiguous.
```

### Constraints

- `0 <= s.length <= 5 * 10^4`
- `s` may contain letters, digits, symbols and spaces.

## Hints

- The phrase "longest **contiguous**…" points to the sliding window pattern.
- Expand the window from the right; if the character entering the window is already inside, shrink it from the left.
- If you keep **the index where each character was last seen**, you can move the left boundary to the right place in a single step.

## Solution

The window `[left, right]` is always a substring without repeating characters. `right` advances by one at each step. If the character entering the window was seen before **inside the window**, the left boundary moves to one past that character's previous position.

Keep the index where each character was last seen in a hash table. One thing to watch out for: if the character was seen at a position to the **left** of the window (that is, no longer inside the window), the left boundary must not move backward. The `lastSeen >= left` check guarantees this.

```csharp solution
public class Solution
{
    public int LengthOfLongestSubstring(string s)
    {
        var lastSeen = new Dictionary<char, int>();
        var left = 0;
        var best = 0;

        for (var right = 0; right < s.Length; right++)
        {
            if (lastSeen.TryGetValue(s[right], out var previous) && previous >= left)
            {
                left = previous + 1;
            }

            lastSeen[s[right]] = right;
            best = Math.Max(best, right - left + 1);
        }

        return best;
    }
}
```

```typescript solution
function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const previous = lastSeen.get(s[right]);
    if (previous !== undefined && previous >= left) {
      left = previous + 1;
    }

    lastSeen.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

### Complexity

- **Time:** O(n). Each character is processed once.
- **Space:** O(min(n, alphabet size)).

The classic failure case is `"abba"`: when the last `a` is processed, the previous `a` (index 0) is already to the left of the window; without the `previous >= left` check, the left boundary is pulled back to 1 and an invalid window like `"bba"` gets counted.
