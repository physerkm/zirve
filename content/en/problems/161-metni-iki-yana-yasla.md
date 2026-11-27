---
title: Text Justification
---
You are given an array of words `words` and a line width `maxWidth`. Format the text so that each line has exactly `maxWidth` characters and is aligned to both the left and the right (full justification).

You should pack the words greedily; that is, put as many words as fit on each line. Pad with extra spaces (`' '`) so that the spaces between words are distributed as evenly as possible. If the number of spaces on a line doesn't divide evenly among the gaps between words, the gaps on the left get one more space than the ones on the right.

The **last line** of the text, and any line that contains **only one word**, should be **left-justified**, with no extra spaces inserted between words (the remaining spaces go at the right end of the line).

### Example 1

```text
Input:  words = ["This", "is", "an", "example", "of", "text", "justification."], maxWidth = 16
Output:
[
   "This    is    an",
   "example  of text",
   "justification.  "
]
Explanation: On line 2, 3 spaces are distributed over 2 gaps: the left gap gets 2 spaces and the right gap gets 1. The last line is left-justified.
```

### Example 2

```text
Input:  words = ["What","must","be","acknowledgment","shall","be"], maxWidth = 16
Output:
[
  "What   must   be",
  "acknowledgment  ",
  "shall be        "
]
Explanation: Line 2 consists of a single word, so it is left-justified and 2 spaces are added to its right. The last line is left-justified too.
```

### Example 3

```text
Input:  words = ["Science","is","what","we","understand","well","enough","to","explain","to","a","computer.","Art","is","everything","else","we","do"], maxWidth = 20
Output:
[
  "Science  is  what we",
  "understand      well",
  "enough to explain to",
  "a  computer.  Art is",
  "everything  else  we",
  "do                  "
]
```

### Constraints

- `1 <= words.length <= 300`
- `1 <= words[i].length <= 20`
- `words[i]` consists only of English letters and symbols.
- `1 <= maxWidth <= 100`
- `words[i].length <= maxWidth`

## Hints

- Split the problem into two phases: (1) determine which words (`words[i..j-1]`) fit on the current line, (2) join those words according to the rules into a string of length `maxWidth`.
- A line with `k` words has `gaps = k - 1` gaps between words; the fit condition is `sumOfWordLengths + gaps <= maxWidth`.
- The last line (`j == words.Length`) and a single-word line (`gaps == 0`) are special cases: join the words with single spaces and pad the right side with spaces up to `maxWidth`.
- On other lines, the total number of spaces is `spaces = maxWidth - sumOfWordLengths`. Each gap gets at least `spaces / gaps` spaces; the first `spaces % gaps` gaps get `+1` extra space.

## Solution

We build the text line by line. At each step, starting from index `i`, we move index `j` as far forward as possible: `lineLen` holds the total number of letters of the words on the line, and as long as `lineLen + (j - i) + words[j].Length <= maxWidth` holds, we include `words[j]` on the line (`j - i` stands for the mandatory minimum of 1 space between each pair of words).

Once the words for the line are determined as `words[i..j-1]`:
- The number of gaps between them is `gaps = j - i - 1`, and the total number of spaces to distribute is `totalSpaces = maxWidth - lineLen`.
- **Left-justified case (`j == words.Length` or `gaps == 0`):** Put just 1 space between words, and add enough spaces at the end of the line to reach length `maxWidth`.
- **Fully justified case:** Each gap gets `evenSpaces = totalSpaces / gaps` spaces. The leftover `extraSpaces = totalSpaces % gaps` spaces that don't divide evenly are handed out one each to the first `extraSpaces` gaps, starting from the left.

```csharp solution
public class Solution
{
    public IList<string> FullJustify(string[] words, int maxWidth)
    {
        IList<string> result = new List<string>();
        int i = 0;
        int n = words.Length;

        while (i < n)
        {
            int lineLen = words[i].Length;
            int j = i + 1;

            while (j < n && lineLen + (j - i) + words[j].Length <= maxWidth)
            {
                lineLen += words[j].Length;
                j++;
            }

            int gaps = j - i - 1;
            int totalSpaces = maxWidth - lineLen;
            StringBuilder sb = new StringBuilder(maxWidth);

            if (j == n || gaps == 0)
            {
                for (int k = i; k < j; k++)
                {
                    if (k > i) sb.Append(' ');
                    sb.Append(words[k]);
                }
                sb.Append(' ', maxWidth - sb.Length);
            }
            else
            {
                int evenSpaces = totalSpaces / gaps;
                int extraSpaces = totalSpaces % gaps;

                for (int k = i; k < j; k++)
                {
                    sb.Append(words[k]);
                    if (k < j - 1)
                    {
                        int gapIndex = k - i;
                        int spaces = evenSpaces + (gapIndex < extraSpaces ? 1 : 0);
                        sb.Append(' ', spaces);
                    }
                }
            }

            result.Add(sb.ToString());
            i = j;
        }

        return result;
    }
}
```

```typescript solution
function fullJustify(words: string[], maxWidth: number): string[] {
  const result: string[] = [];
  let i = 0;
  const n = words.length;

  while (i < n) {
    let lineLen = words[i].length;
    let j = i + 1;

    while (j < n && lineLen + (j - i) + words[j].length <= maxWidth) {
      lineLen += words[j].length;
      j++;
    }

    const gaps = j - i - 1;
    const totalSpaces = maxWidth - lineLen;

    if (j === n || gaps === 0) {
      const line = words.slice(i, j).join(" ");
      result.push(line + " ".repeat(maxWidth - line.length));
    } else {
      const evenSpaces = Math.floor(totalSpaces / gaps);
      const extraSpaces = totalSpaces % gaps;
      let line = "";

      for (let k = i; k < j; k++) {
        line += words[k];
        if (k < j - 1) {
          const gapIndex = k - i;
          const spaces = evenSpaces + (gapIndex < extraSpaces ? 1 : 0);
          line += " ".repeat(spaces);
        }
      }

      result.push(line);
    }

    i = j;
  }

  return result;
}
```

### Complexity

- **Time:** O(N * maxWidth), or O(L * maxWidth) in terms of the total number of output characters (L is the number of lines). Each word is visited twice: once while determining line boundaries and once while building the line string.
- **Space:** O(L * maxWidth), to store the returned list of lines (O(maxWidth) of extra working space).
