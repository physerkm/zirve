---
title: Alien Dictionary
---
There is an alien language that uses the letters of the English alphabet, but the **order of the letters is unknown**. You are given a list of words `words` from this language's dictionary, **sorted lexicographically** by the rules of the language.

Return a string of the letters that appear in the words, in their order in this language. If the order **contradicts** the words, return `""`.

So that the tests have a single answer: if there is more than one valid order, return the order you get by choosing the **alphabetically smallest** available letter at each step.

### Example 1

```text
Input:  words = ["wrt","wrf","er","ett","rftt"]
Output:  "wertf"
```

### Example 2

```text
Input:  words = ["z","x"]
Output:  "zx"
```

### Example 3

```text
Input:  words = ["z","x","z"]
Output:  ""
Explanation: z < x and x < z cannot both hold.
```

### Constraints

- `1 <= words.length <= 100`
- `1 <= words[i].length <= 100`
- `words[i]` consists of lowercase English letters.

## Hints

- Compare each pair of adjacent words. The first pair of differing letters gives you exactly one ordering fact: letter `a` comes before `b`.
- These facts form a directed graph over the letters. What you need is a **topological sort** of this graph.
- If there is a cycle, no ordering exists. A longer word coming before its own prefix, as in `["abc", "ab"]`, is also invalid.

## Solution

### Extract the edges, sort with Kahn's algorithm

1. Every letter that appears in the words becomes a node, with an in-degree starting at `0`.
2. For each adjacent pair `(w1, w2)`, find the first differing position `j` and add the edge `w1[j] → w2[j]` (the same edge is not counted twice). If there is no difference and `w1` is longer, the order is invalid: `""`.
3. Put the letters with in-degree `0` into a min-heap. Pop the smallest letter, append it to the result, and decrement the in-degrees of its neighbors; those that drop to `0` enter the heap.
4. If the result does not contain all the letters, the graph has a cycle: `""`.

```csharp solution
public class Solution
{
    public string AlienOrder(string[] words)
    {
        var graph = new Dictionary<char, HashSet<char>>();
        var indegree = new Dictionary<char, int>();
        foreach (var word in words)
        {
            foreach (var ch in word)
            {
                graph.TryAdd(ch, new HashSet<char>());
                indegree.TryAdd(ch, 0);
            }
        }

        for (var i = 0; i + 1 < words.Length; i++)
        {
            var a = words[i];
            var b = words[i + 1];
            var j = 0;
            while (j < a.Length && j < b.Length && a[j] == b[j])
            {
                j++;
            }

            if (j == a.Length || j == b.Length)
            {
                if (a.Length > b.Length)
                {
                    return "";
                }

                continue;
            }

            if (graph[a[j]].Add(b[j]))
            {
                indegree[b[j]]++;
            }
        }

        var heap = new PriorityQueue<char, char>();
        foreach (var (ch, degree) in indegree)
        {
            if (degree == 0)
            {
                heap.Enqueue(ch, ch);
            }
        }

        var order = new StringBuilder();
        while (heap.TryDequeue(out var ch, out _))
        {
            order.Append(ch);
            foreach (var next in graph[ch])
            {
                if (--indegree[next] == 0)
                {
                    heap.Enqueue(next, next);
                }
            }
        }

        return order.Length == indegree.Count ? order.ToString() : "";
    }
}
```

```typescript solution
function alienOrder(words: string[]): string {
  const graph = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  for (const word of words) {
    for (const ch of word) {
      if (!graph.has(ch)) graph.set(ch, new Set());
      if (!indegree.has(ch)) indegree.set(ch, 0);
    }
  }

  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    let j = 0;
    while (j < a.length && j < b.length && a[j] === b[j]) j++;

    if (j === a.length || j === b.length) {
      if (a.length > b.length) return '';
      continue;
    }

    const edges = graph.get(a[j])!;
    if (!edges.has(b[j])) {
      edges.add(b[j]);
      indegree.set(b[j], indegree.get(b[j])! + 1);
    }
  }

  // Available letters are kept sorted; each time the alphabetically smallest one is taken.
  const ready = [...indegree.keys()].filter((ch) => indegree.get(ch) === 0).sort();
  let order = '';
  while (ready.length > 0) {
    const ch = ready.shift()!;
    order += ch;
    for (const next of graph.get(ch)!) {
      const degree = indegree.get(next)! - 1;
      indegree.set(next, degree);
      if (degree === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }

  return order.length === indegree.size ? order : '';
}
```

### Complexity

- **Time:** O(C + K log K). `C` is the total number of letters across all words, and `K` is the number of distinct letters (at most 26).
- **Space:** O(K + E); `E` is at most `K²` edges.

The real test is noticing that **only the first difference** between adjacent words carries information, and spotting the prefix trap. The rest is a standard topological sort.
