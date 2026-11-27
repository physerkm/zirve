---
title: Word Ladder
---

A **transformation sequence** from a start word `beginWord` to an end word `endWord` is a chain of words `beginWord -> s_1 -> s_2 -> ... -> s_k` that satisfies the following rules:

- Every pair of adjacent words differs by **exactly one letter**.
- Every `s_i` for `1 <= i <= k` must be in `wordList`. (`beginWord` does not need to be in `wordList`.)
- The last word must satisfy `s_k == endWord`.

Given two words (`beginWord` and `endWord`) and a dictionary (`wordList`), return **the number of words in the shortest transformation sequence** from `beginWord` to `endWord`. If no such transformation sequence exists, return `0`.

### Example 1

```text
Input:  beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Output: 5
Explanation: The shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which has 5 words.
```

### Example 2

```text
Input:  beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]
Output: 0
Explanation: endWord ("cog") is not in the word list, so there is no valid transformation sequence.
```

### Constraints

- `1 <= beginWord.length <= 10`
- `endWord.length == beginWord.length`
- `1 <= wordList.length <= 5000`
- `wordList[i].length == beginWord.length`
- `beginWord`, `endWord`, and `wordList[i]` consist only of lowercase English letters.
- `beginWord != endWord`
- All words in `wordList` are distinct.

## Hints

- Think of each word as a graph node, and of the step between two words that differ by one letter as an unweighted, undirected edge.
- The best algorithm for finding the shortest path in an unweighted graph is **breadth-first search (BFS)**.
- Comparing a word against every word in the dictionary to find its neighbors takes O(N²); instead, change each letter of the word to `'a'`–`'z'` and check in O(1) whether the resulting candidate word is in a `HashSet`.
- Deleting a visited word from the `HashSet` right away both removes the need for an extra `visited` set and prevents reaching the same word again via a longer path.

## Solution

At its core, this is a **shortest path** problem on an unweighted graph: each word is a node, and two words that can turn into each other by changing one letter are neighbors. Since we are looking for the shortest transformation chain, we run a **layer-by-layer BFS (breadth-first search)** starting from `beginWord`.

First, we put all words in `wordList` into a `HashSet` (`wordSet`) so we can look them up in O(1). If `endWord` is not in this set, the target cannot be reached; we return `0` directly.

We put `beginWord` into the BFS queue and initialize the step count (`steps = 1`). In each layer, we pull the current words from the queue. For each word we pull, we change the letter at every index from `'a'` to `'z'` in turn, generating every possible one-letter transformation. If the generated `nextWord` is in `wordSet`, we know we have reached this word for the first time via a shortest path: we delete it from the set (`wordSet.Remove`) and add it to the queue. The moment we reach `endWord`, the current layer depth gives the length of the shortest transformation sequence.

```csharp solution
public class Solution
{
    public int LadderLength(string beginWord, string endWord, IList<string> wordList)
    {
        HashSet<string> wordSet = new HashSet<string>(wordList);
        if (!wordSet.Contains(endWord))
            return 0;

        Queue<string> queue = new Queue<string>();
        queue.Enqueue(beginWord);
        wordSet.Remove(beginWord);

        int steps = 1;

        while (queue.Count > 0)
        {
            int levelSize = queue.Count;

            for (int q = 0; q < levelSize; q++)
            {
                string word = queue.Dequeue();
                if (word == endWord)
                    return steps;

                char[] chars = word.ToCharArray();
                for (int i = 0; i < chars.Length; i++)
                {
                    char original = chars[i];
                    for (char c = 'a'; c <= 'z'; c++)
                    {
                        if (c == original)
                            continue;

                        chars[i] = c;
                        string nextWord = new string(chars);

                        if (wordSet.Remove(nextWord))
                            queue.Enqueue(nextWord);
                    }
                    chars[i] = original;
                }
            }

            steps++;
        }

        return 0;
    }
}
```

```typescript solution
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const wordSet = new Set<string>(wordList);
  if (!wordSet.has(endWord)) return 0;

  let queue: string[] = [beginWord];
  wordSet.delete(beginWord);
  let steps = 1;

  while (queue.length > 0) {
    const nextQueue: string[] = [];

    for (const word of queue) {
      if (word === endWord) return steps;

      const chars = word.split('');
      for (let i = 0; i < chars.length; i++) {
        const original = chars[i];
        for (let code = 97; code <= 122; code++) {
          const c = String.fromCharCode(code);
          if (c === original) continue;

          chars[i] = c;
          const nextWord = chars.join('');

          if (wordSet.delete(nextWord)) {
            nextQueue.push(nextWord);
          }
        }
        chars[i] = original;
      }
    }

    queue = nextQueue;
    steps++;
  }

  return 0;
}
```

### Complexity

- **Time:** O(N · M²), where `N` is the number of words in the word list and `M` is the length of a word. Each word enters the queue at most once; for each word, 26 letters are tried at `M` positions, and a new string of length `M` is built and looked up in the set (`26 · M · M`).
- **Space:** O(N · M). `wordSet` and the BFS queue hold at most `N` words of length `M`.
