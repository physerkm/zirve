---
title: Group Anagrams
---
You are given an array of strings `words`. Group the words that are anagrams of each other. You can return the groups, and the words within each group, in any order.

### Example 1

```text
Input:  words = ["eat", "tea", "tan", "ate", "nat", "bat"]
Output:  [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]
```

### Example 2

```text
Input:  words = [""]
Output:  [[""]]
```

### Constraints

- `1 <= words.length <= 10^4`
- `0 <= words[i].length <= 100`
- Words consist of lowercase English letters only.

## Hints

- Find a "signature" that is **the same** for every word in a group and different across groups.
- If you sort a word's letters, all of its anagrams turn into the same string.
- Use a hash table with the signature as the key and the list of words as the value.

## Solution

What anagrams have in common is that sorting their letters yields the same string: `"eat"`, `"tea"` and `"ate"` all become `"aet"`. Use this sorted form as the key in a hash table and add each word to the list for its key.

```csharp solution
public class Solution
{
    public IList<IList<string>> GroupAnagrams(string[] words)
    {
        var groups = new Dictionary<string, IList<string>>();

        foreach (var word in words)
        {
            var letters = word.ToCharArray();
            Array.Sort(letters);
            var key = new string(letters);

            if (!groups.TryGetValue(key, out var group))
            {
                group = new List<string>();
                groups[key] = group;
            }

            group.Add(word);
        }

        return groups.Values.ToList();
    }
}
```

```typescript solution
function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();

  for (const word of words) {
    const key = [...word].sort().join('');
    const group = groups.get(key);

    if (group) group.push(word);
    else groups.set(key, [word]);
  }

  return [...groups.values()];
}
```

### Complexity

Let `n` be the number of words and `k` the length of the longest word.

- **Time:** O(n · k log k). Each word is sorted.
- **Space:** O(n · k).

**Improvement:** Using a frequency count of the 26 letters (e.g. `"1#0#0#…"`) as the key instead of the sorted string removes the sort and brings the time down to O(n · k). When words are short, the difference is small in practice.
