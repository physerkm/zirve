---
title: Longest Repeating Character Replacement
---
You are given a string `s` consisting only of uppercase English letters and an integer `k`. You can choose any character in the string and change it to any other uppercase English letter, **at most `k` times**.

Return the length of the **longest substring containing only the same letter** that you can get after these operations.

### Example 1

```text
Input:  s = "ABAB", k = 2
Output: 4
Explanation: Replace the two 'A's with 'B's (or the two 'B's with 'A's) to get "BBBB" (or "AAAA").
```

### Example 2

```text
Input:  s = "AABABBA", k = 1
Output: 4
Explanation: Replacing the middle 'B' with 'A' gives "AAAABBA", which contains the substring "AAAA", or you can get "BBBB" in the range 2..5; the longest same-letter substring has length 4.
```

### Constraints

- `1 <= s.length <= 10^5`
- `s` consists only of uppercase English letters (`A-Z`).
- `0 <= k <= s.length`

## Hints

- How many changes does it take to turn a whole substring into the same letter? You can find it by subtracting the count of the **most frequent letter** in it from the substring's length.
- Use a sliding window (`[left..right]`) and keep the letter frequencies in the window in a 26-element array.
- Track the highest frequency in the window in a `maxFreq` variable. When `windowSize - maxFreq > k`, the window is invalid; shrink it by moving the `left` pointer one step right.
- You don't need to decrease `maxFreq` while the window shrinks, because to find a larger result you need a frequency greater than the previous `maxFreq` anyway.

## Solution

The cheapest way to turn a whole `[left..right]` window into a single letter is to keep the **most repeated** letter in the window and convert all the other letters to it. So the number of replacements needed is:

`replacements = (right - left + 1) - maxFreq`

Here `maxFreq` is the frequency of the most common letter in the window. If this difference exceeds `k` (`(right - left + 1) - maxFreq > k`), it is impossible to make the current window a single letter with `k` replacements. In that case, we remove the character `s[left]` from the window and do `left++`, sliding the window by one.

A key observation: when `left` advances, we don't need to recompute or decrease `maxFreq`. Our goal is to find a window **longer** than the largest one found so far, and that is only possible when `maxFreq` increases. This way, we scan the whole string in a single pass, doing O(1) work per step.

```csharp solution
public class Solution
{
    public int CharacterReplacement(string s, int k)
    {
        int[] count = new int[26];
        int left = 0;
        int maxFreq = 0;
        int best = 0;

        for (int right = 0; right < s.Length; right++)
        {
            int idx = s[right] - 'A';
            count[idx]++;
            maxFreq = Math.Max(maxFreq, count[idx]);

            // If the number of characters to replace exceeds k, shrink the window from the left.
            if ((right - left + 1) - maxFreq > k)
            {
                count[s[left] - 'A']--;
                left++;
            }

            best = Math.Max(best, right - left + 1);
        }

        return best;
    }
}
```

```typescript solution
function characterReplacement(s: string, k: number): number {
  const count = new Array<number>(26).fill(0);
  let left = 0;
  let maxFreq = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const idx = s.charCodeAt(right) - 65;
    count[idx]++;
    maxFreq = Math.max(maxFreq, count[idx]);

    if (right - left + 1 - maxFreq > k) {
      count[s.charCodeAt(left) - 65]--;
      left++;
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

### Complexity

- **Time:** O(n). The `right` and `left` pointers each move across the string at most once; each step takes O(1).
- **Space:** O(1). Only a fixed-size array holding the frequencies of the 26 uppercase English letters is used.
