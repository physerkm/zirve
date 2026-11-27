---
title: Reverse Words in a String
---
You are given a string `s`. Reverse the **order of the words** in the string.

A word is a sequence of non-space characters; words are separated by at least one space.

Return the words joined in reverse order with **a single space** between them. `s` may contain extra spaces at the start, at the end, or between words; the result must not contain any extra spaces.

### Example 1

```text
Input:  s = "the sky is blue"
Output: "blue is sky the"
```

### Example 2

```text
Input:  s = "  hello world  "
Output: "world hello"
Explanation: Leading and trailing spaces are not included in the result.
```

### Example 3

```text
Input:  s = "a good   example"
Output: "example good a"
Explanation: Multiple spaces between words are reduced to one.
```

### Constraints

- `1 <= s.length <= 10^4`
- `s` consists of English letters, digits, and spaces.
- There is at least one word in `s`.

## Hints

- Split the job into three steps: split into words, reverse the order, join them back.
- When splitting on spaces, consecutive spaces produce empty pieces. Filter them out.
- Two pointers are enough to reverse an array: swap the first and last elements and move toward the middle.

## Solution

The problem breaks down into three small steps:

1. **Split:** Cut the string at spaces. Consecutive spaces leave empty pieces (`""`) between them; these are discarded. Leading and trailing spaces disappear the same way.
2. **Reverse:** Reverse the array of words in place. The first word swaps with the last, the second with the second to last, and so on up to the middle.
3. **Join:** Join the words with a single space between them. No space is added at the start or the end.

In C#, `StringSplitOptions.RemoveEmptyEntries` drops the empty pieces during the split; in TypeScript, `filter` does the same job.

```csharp solution
public class Solution
{
    public string ReverseWords(string s)
    {
        // Cut at every space. Consecutive spaces leave empty pieces ("") in between; drop them.
        string[] words = s.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        // Reverse the word order in place: the first word swaps with the last, and so on toward the middle.
        Array.Reverse(words);

        // Exactly one space between words; no space at the start or end.
        return string.Join(" ", words);
    }
}
```

```typescript solution
function reverseWords(s: string): string {
  const words = s.split(' ').filter((word) => word.length > 0);

  words.reverse();

  return words.join(' ');
}
```

### Complexity

- **Time:** O(n). Splitting, reversing and joining each scan the string once.
- **Space:** O(n), for the word array and the result string.

**Interview follow-up:** "Can you do it without the built-in `Split` and `Reverse`?" In that case, you scan the string from the end to the start, find the start and end of each word with two pointers, and append the words to the result in order. If the character array is mutable, there is also a solution with O(1) extra space: first reverse the whole array, then reverse each word on its own.
