---
title: Partition Labels
---
You are given a string `s` consisting of lowercase English letters. We want to split this string into as many parts as possible so that **each letter appears in at most one part**.

When the parts are concatenated in order, they must give back the original string `s`.

Return a list containing the lengths of these parts, in order.

### Example 1

```text
Input:  s = "ababcbacadefegdehijhklij"
Output:  [9, 7, 8]
Explanation:
The parts are "ababcbaca", "defegde" and "hijhklij".
Each letter appears in only one part.
Splitting into fewer parts (for example ["ababcbacadefegde", "hijhklij"]) is possible, but we want the maximum number of parts.
```

### Example 2

```text
Input:  s = "eccbbbbdec"
Output:  [10]
Explanation: The first letter 'e' last occurs at index 8, and the 'c' inside that range last occurs at index 9, so the string cannot be split.
```

### Constraints

- `1 <= s.length <= 500`
- `s` consists only of lowercase English letters (`'a'` - `'z'`).

## Hints

- As soon as you include the letter `'a'` in a part, you must also include every character up to the index where `'a'` is **last seen** in the string.
- So first scan the string once and record the index where each letter is last seen in a `last` table.
- In a second pass, track the farthest boundary where the current part must end with `end = Math.Max(end, last[s[i] - 'a'])`.
- When the current index satisfies `i == end`, none of the letters you have seen so far repeats after `end`; you can cut the part right here!

## Solution

What determines where a part can end is **where the letters inside that part were last seen** in the string. For example, if the part starts with `'a'` and `'a'` last occurs at index 8, the first part can end at index 8 at the earliest. Moreover, if another letter we meet while walking the range `0..8` (say `'c'`) repeats at index 12, the end of the part has to stretch to at least 12.

We apply this greedy idea in two steps:

1. **Record the last indices:** We scan the string once from start to end and write the index where each letter is last seen into a `last[26]` array.
2. **Bound the parts:** We walk the string again with `start = 0` and `end = 0` pointers. At each step `i`:
   - We update the rightmost boundary the current part must extend to with `end = Math.Max(end, last[s[i] - 'a'])`.
   - As soon as `i == end`, we have reached the last occurrences of all the letters in the range `[start..end]`, and none of these letters shows up again after `end`. We cut the part at the earliest possible spot, add its length `end - start + 1` to the result, and start a new part with `start = i + 1`.

```csharp solution
public class Solution
{
    public IList<int> PartitionLabels(string s)
    {
        int[] last = new int[26];
        for (int i = 0; i < s.Length; i++)
        {
            last[s[i] - 'a'] = i;
        }

        List<int> result = new List<int>();
        int start = 0, end = 0;

        for (int i = 0; i < s.Length; i++)
        {
            end = Math.Max(end, last[s[i] - 'a']);

            if (i == end)
            {
                result.Add(end - start + 1);
                start = i + 1;
            }
        }

        return result;
    }
}
```

```typescript solution
function partitionLabels(s: string): number[] {
  const last = new Array<number>(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    last[s.charCodeAt(i) - 97] = i;
  }

  const result: number[] = [];
  let start = 0;
  let end = 0;

  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s.charCodeAt(i) - 97]);
    if (i === end) {
      result.push(end - start + 1);
      start = i + 1;
    }
  }

  return result;
}
```

### Complexity

- **Time:** O(n). The string is scanned from start to end twice in total: once to find the last positions and once to cut the parts.
- **Space:** O(1). Since the letters are only the 26 lowercase English characters, the `last` array uses constant (26-element) memory.
