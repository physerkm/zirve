---
title: Reorder Data in Log Files
---
You are given an array of logs `logs`, each made up of space-separated words. The first word of each log is an **identifier**. There are two kinds of logs:

- **Letter-logs:** All words except the identifier consist of lowercase letters.
- **Digit-logs:** All words except the identifier consist of digits.

Reorder the logs according to the following rules and return them:

1. All letter-logs come **before** the digit-logs.
2. Letter-logs are sorted lexicographically by their **contents**; if the contents are the same, they are sorted by **identifier**.
3. Digit-logs keep their **original order**.

### Example 1

```text
Input:  logs = ["dig1 8 1 5 1","let1 art can","dig2 3 6","let2 own kit dig","let3 art zero"]
Output:  ["let1 art can","let3 art zero","let2 own kit dig","dig1 8 1 5 1","dig2 3 6"]
```

### Example 2

```text
Input:  logs = ["a1 9 2 3 1","g1 act car","zo4 4 7","ab1 off key dog","a8 act zoo"]
Output:  ["g1 act car","a8 act zoo","ab1 off key dog","a1 9 2 3 1","zo4 4 7"]
```

### Constraints

- `1 <= logs.length <= 100`
- `3 <= logs[i].length <= 100`
- Words are separated by a single space; there is at least one word after the identifier.

## Hints

- Split each log in two at the first space: the identifier and the contents. If the first character of the contents is a digit, the log is a digit-log.
- Sort the letter-logs by the key `(contents, identifier)`.
- The order of the digit-logs must be preserved: collect them in a separate list and append it at the end (or use a stable sort).

## Solution

### Split into two lists, sort only the letter-logs

The logs are split into two groups in a single pass. Digit-logs are added to a list in the order they arrive, so their order is preserved automatically. Letter-logs are sorted first by contents and, on ties, by identifier. The result is the sorted letter-logs followed by the digit-logs.

Comparisons are done **ordinally** (by character code); culture-sensitive sorting could change the ordering of lowercase letters and digits.

```csharp solution
public class Solution
{
    public string[] ReorderLogFiles(string[] logs)
    {
        var letters = new List<(string Id, string Content, string Log)>();
        var digits = new List<string>();

        foreach (var log in logs)
        {
            var space = log.IndexOf(' ');
            var id = log[..space];
            var content = log[(space + 1)..];
            if (char.IsDigit(content[0]))
            {
                digits.Add(log);
            }
            else
            {
                letters.Add((id, content, log));
            }
        }

        letters.Sort((a, b) =>
        {
            var byContent = string.CompareOrdinal(a.Content, b.Content);
            return byContent != 0 ? byContent : string.CompareOrdinal(a.Id, b.Id);
        });

        return letters.Select(x => x.Log).Concat(digits).ToArray();
    }
}
```

```typescript solution
function reorderLogFiles(logs: string[]): string[] {
  const letters: { id: string; content: string; log: string }[] = [];
  const digits: string[] = [];

  for (const log of logs) {
    const space = log.indexOf(' ');
    const id = log.slice(0, space);
    const content = log.slice(space + 1);
    if (content[0] >= '0' && content[0] <= '9') {
      digits.push(log);
    } else {
      letters.push({ id, content, log });
    }
  }

  const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
  letters.sort((a, b) => compare(a.content, b.content) || compare(a.id, b.id));

  return [...letters.map((x) => x.log), ...digits];
}
```

### Complexity

- **Time:** O(n log n × L). Each comparison during sorting takes at most the log length `L`.
- **Space:** O(n × L).
