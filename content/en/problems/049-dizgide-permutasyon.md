---
title: Permutation in String
---
You are given two strings `s1` and `s2`. Return `true` if `s2` contains any **permutation** of `s1` as a substring, and `false` otherwise.

In other words, the result should be `true` if one of the rearrangements of `s1`'s characters appears contiguously in `s2`.

### Example 1

```text
Input:  s1 = "ab", s2 = "eidbaooo"
Output: true
Explanation: s2 contains the substring "ba", which is a permutation of "ab".
```

### Example 2

```text
Input:  s1 = "ab", s2 = "eidboaoo"
Output: false
Explanation: s2 contains neither "ab" nor "ba" as a substring.
```

### Constraints

- `1 <= s1.length, s2.length <= 10^4`
- `s1` and `s2` consist only of lowercase English letters (`a-z`).

## Hints

- One string being a permutation of another means the letter frequencies in both strings are exactly the same.
- The substring we are looking for in `s2` must have length exactly `s1.Length`.
- Slide a fixed window of size `s1.Length` over `s2`; as the window moves right, increment the count of the letter entering and decrement the count of the letter leaving.
- Instead of comparing all 26 letters from scratch at every step, you can do the check in O(1) with a `matches` (0..26) variable that tracks how many letters have matching frequencies.

## Solution

A permutation of `s1` is a substring with the same length and the same letter counts as `s1`. So we can slide a **fixed-size sliding window** of length `s1.Length` over `s2`.

We set up two 26-element frequency arrays (`s1Count` and `winCount`). After placing the first `s1.Length` characters, we count in the `matches` variable how many of the 26 letters have `s1Count[i] == winCount[i]` (if `matches == 26`, all letter frequencies match).

When sliding the window one step right:
1. We increment `winCount` for the character entering from the right. If this makes the frequencies equal, we do `matches++`; if they were equal before and no longer are, we do `matches--`.
2. We decrement `winCount` for the character leaving from the left. If this makes the frequencies equal, we do `matches++`; if they were equal before and no longer are, we do `matches--`.

If `matches == 26` at any step, we return `true`.

```csharp solution
public class Solution
{
    public bool CheckInclusion(string s1, string s2)
    {
        if (s1.Length > s2.Length)
            return false;

        int[] s1Count = new int[26];
        int[] winCount = new int[26];

        for (int i = 0; i < s1.Length; i++)
        {
            s1Count[s1[i] - 'a']++;
            winCount[s2[i] - 'a']++;
        }

        int matches = 0;
        for (int i = 0; i < 26; i++)
        {
            if (s1Count[i] == winCount[i])
                matches++;
        }

        for (int right = s1.Length; right < s2.Length; right++)
        {
            if (matches == 26)
                return true;

            int addIdx = s2[right] - 'a';
            winCount[addIdx]++;
            if (winCount[addIdx] == s1Count[addIdx])
                matches++;
            else if (winCount[addIdx] == s1Count[addIdx] + 1)
                matches--;

            int remIdx = s2[right - s1.Length] - 'a';
            winCount[remIdx]--;
            if (winCount[remIdx] == s1Count[remIdx])
                matches++;
            else if (winCount[remIdx] == s1Count[remIdx] - 1)
                matches--;
        }

        return matches == 26;
    }
}
```

```typescript solution
function checkInclusion(s1: string, s2: string): boolean {
  if (s1.length > s2.length) return false;

  const s1Count = new Array<number>(26).fill(0);
  const winCount = new Array<number>(26).fill(0);

  for (let i = 0; i < s1.length; i++) {
    s1Count[s1.charCodeAt(i) - 97]++;
    winCount[s2.charCodeAt(i) - 97]++;
  }

  let matches = 0;
  for (let i = 0; i < 26; i++) {
    if (s1Count[i] === winCount[i]) matches++;
  }

  for (let right = s1.length; right < s2.length; right++) {
    if (matches === 26) return true;

    const addIdx = s2.charCodeAt(right) - 97;
    winCount[addIdx]++;
    if (winCount[addIdx] === s1Count[addIdx]) matches++;
    else if (winCount[addIdx] === s1Count[addIdx] + 1) matches--;

    const remIdx = s2.charCodeAt(right - s1.length) - 97;
    winCount[remIdx]--;
    if (winCount[remIdx] === s1Count[remIdx]) matches++;
    else if (winCount[remIdx] === s1Count[remIdx] - 1) matches--;
  }

  return matches === 26;
}
```

### Complexity

- **Time:** O(n). After setting up the first window and computing `matches`, each slide over `s2` completes in O(1) time.
- **Space:** O(1). Only two fixed 26-element frequency arrays are used.
