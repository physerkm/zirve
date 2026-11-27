---
title: Hand of Straights
---
Alice has some cards, and she wants to rearrange them into groups so that each group has size `groupSize` and consists of **consecutive values**.

Given an integer array `hand` holding the values on the cards and the group size `groupSize`, return `true` if it is possible to split all the cards into groups that follow this rule, and `false` otherwise.

### Example 1

```text
Input:  hand = [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize = 3
Output:  true
Explanation: Alice's hand can be split into three consecutive groups: [1, 2, 3], [2, 3, 4] and [6, 7, 8].
```

### Example 2

```text
Input:  hand = [1, 2, 3, 4, 5], groupSize = 4
Output:  false
Explanation: 5 cards cannot be divided evenly into groups of 4, so no grouping is possible.
```

### Example 3

```text
Input:  hand = [1, 1, 2, 2, 3, 4], groupSize = 3
Output:  false
Explanation: After the first group [1, 2, 3] is formed, [1, 2, 4] remains; these are not consecutive.
```

### Constraints

- `1 <= hand.length <= 10^4`
- `0 <= hand[i] <= 10^9`
- `1 <= groupSize <= hand.length`

## Hints

- If the total number of cards is not divisible by `groupSize`, grouping is impossible from the start.
- Think about the **smallest** card not used yet: since there is no smaller card, this card must be the **first element** of a new consecutive group.
- Sort the cards in ascending order and store how many times each card occurs in a dictionary (`Dictionary` / `Map`).
- As you walk the sorted array, for every `card` whose count is greater than zero, decrement one copy each of `card, card + 1, ..., card + groupSize - 1`; if any of them is missing, return `false`.

## Solution

First, if `hand.Length % groupSize != 0`, the cards can never be split into groups of equal size, so we return `false` right away.

Our greedy observation is this: let `x` be the **smallest** card value left in the hand. Since there is no `x - 1` in the hand, `x` cannot sit in the middle or at the end of any group; so `x` must be the **start** of a group of the form `[x, x + 1, ..., x + groupSize - 1]`.

To apply this strategy:
1. We sort `hand` in ascending order and record the frequency of each card value (how many copies there are) in a `Dictionary<int, int>` table.
2. We walk the sorted `hand` array from start to end:
   - If the count of the current `card` in the table is `0`, this card has already been consumed as part of an earlier group; we skip it with `continue`.
   - If its count is greater than `0`, this card is the smallest of the remaining cards and starts a new group. For every `nextCard` value from `card` to `card + groupSize - 1`, we check whether the table holds at least 1 copy.
   - If any `nextCard` is missing or its count is `0`, a consecutive group cannot be formed; we return `false`. Otherwise we decrement each of their counters by 1.
3. If the loop finishes successfully, all cards have been split into valid groups; we return `true`.

```csharp solution
public class Solution
{
    public bool IsNStraightHand(int[] hand, int groupSize)
    {
        if (hand.Length % groupSize != 0)
            return false;

        Array.Sort(hand);
        Dictionary<int, int> count = new Dictionary<int, int>();
        foreach (int card in hand)
        {
            count[card] = count.GetValueOrDefault(card, 0) + 1;
        }

        foreach (int card in hand)
        {
            if (count[card] == 0)
                continue;

            for (int i = 0; i < groupSize; i++)
            {
                int nextCard = card + i;
                if (!count.ContainsKey(nextCard) || count[nextCard] == 0)
                    return false;

                count[nextCard]--;
            }
        }

        return true;
    }
}
```

```typescript solution
function isNStraightHand(hand: number[], groupSize: number): boolean {
  if (hand.length % groupSize !== 0) return false;

  hand.sort((a, b) => a - b);
  const count = new Map<number, number>();
  for (const card of hand) {
    count.set(card, (count.get(card) ?? 0) + 1);
  }

  for (const card of hand) {
    if ((count.get(card) ?? 0) === 0) continue;

    for (let i = 0; i < groupSize; i++) {
      const nextCard = card + i;
      const c = count.get(nextCard) ?? 0;
      if (c === 0) return false;
      count.set(nextCard, c - 1);
    }
  }

  return true;
}
```

### Complexity

- **Time:** O(n log n). Sorting `n` cards takes O(n log n). After that, each card is added to the dictionary once and the inner loop decrements a counter exactly `n` times in total, so the grouping phase finishes in O(n) time.
- **Space:** O(n), for the hash table holding the card frequencies.
