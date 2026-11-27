---
title: Word Break
---

You are given a string `s` and a list of dictionary words `wordDict`. Return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words, and `false` otherwise.

Note that the same dictionary word may be used **more than once** in the segmentation.

### Example 1

```text
Input:  s = "leetcode", wordDict = ["leet", "code"]
Output:  true
Explanation: "leetcode" can be segmented as "leet code".
```

### Example 2

```text
Input:  s = "applepenapple", wordDict = ["apple", "pen"]
Output:  true
Explanation: "applepenapple" can be segmented as "apple pen apple". Dictionary words can be reused.
```

### Example 3

```text
Input:  s = "catsandog", wordDict = ["cats", "dog", "sand", "and", "cat"]
Output:  false
Explanation: Whichever words you choose, the whole string cannot be fully segmented into dictionary words.
```

### Constraints

- `1 <= s.length <= 300`
- `1 <= wordDict.length <= 1000`
- `1 <= wordDict[i].length <= 20`
- `s` and `wordDict[i]` consist only of lowercase English letters.
- All the words in `wordDict` are **unique**.

## Hints

- Greedily picking the first matching word from the start does not always work: for example, with `s = "cars"` and `wordDict = ["car", "ca", "rs"]`, picking `"car"` leaves `"s"`, while `"ca" + "rs"` is valid.
- Define `dp[i]` as the answer to "can the suffix `s[i..]` be fully segmented into dictionary words?"
- As the base case, the empty suffix (`dp[s.Length] = true`) is always valid.
- While moving the index `i` from the end to the start (from `s.Length - 1` to `0`), for each dictionary word `w`, if the substring of `s` starting at position `i` matches `w` and `dp[i + w.Length]` is true, set `dp[i] = true`.

## Solution

We solve the problem with 1D dynamic programming from right to left (end to start). We define a `bool[] dp` array of length `n + 1`:

- `dp[i]`: whether the suffix `s[i..]`, from index `i` to the end of `s`, can be segmented into dictionary words.
- **Base case:** `dp[n] = true` (the empty string counts as segmented into zero words).

Moving backward from `i = n - 1` to `0`, we try every dictionary word `w`. If:

1. the word does not run past the end of the string from position `i` (`i + w.Length <= n`),
2. the remaining suffix starting where the word ends is already segmentable (`dp[i + w.Length] == true`),
3. and the piece of `s` of length `w.Length` at position `i` equals `w` (`s.Substring(i, w.Length) == w`),

then the suffix starting at position `i` is segmentable too: we set `dp[i] = true` and `break` out of the inner loop. When the loop finishes, we return `dp[0]`, which represents the whole string.

```csharp solution
public class Solution
{
    public bool WordBreak(string s, IList<string> wordDict)
    {
        bool[] dp = new bool[s.Length + 1];
        dp[s.Length] = true;

        for (int i = s.Length - 1; i >= 0; i--)
        {
            foreach (string w in wordDict)
            {
                if (i + w.Length <= s.Length && dp[i + w.Length] && s.Substring(i, w.Length) == w)
                {
                    dp[i] = true;
                    break;
                }
            }
        }

        return dp[0];
    }
}
```

```typescript solution
function wordBreak(s: string, wordDict: string[]): boolean {
  const dp = new Array<boolean>(s.length + 1).fill(false);
  dp[s.length] = true;

  for (let i = s.length - 1; i >= 0; i--) {
    for (const w of wordDict) {
      if (
        i + w.length <= s.length &&
        dp[i + w.length] &&
        s.slice(i, i + w.length) === w
      ) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[0];
}
```

### Complexity

- **Time:** O(n · m · k), where `n` is the length of the string, `m` is the number of dictionary words, and `k` is the average/maximum word length (`k <= 20`). For each position `i`, the dictionary words are checked and at most `k` characters are compared.
- **Space:** O(n), for the `dp` array of `n + 1` elements.
