---
title: Last Stone Weight
---
You are given an array `stones` of positive integers, where `stones[i]` is the weight of the `i`th stone.

On each turn, we pick the **two heaviest stones** among those remaining and smash them together. Let the weights of these two stones be `x` and `y` (`x <= y`). The result of the smash is determined as follows:

- If `x == y`, both stones are completely destroyed and leave the game.
- If `x != y`, the stone of weight `x` is destroyed, and the stone of weight `y` gets the new weight `y - x` and goes back among the stones.

At the end of the game, at most one stone is left. Return the weight of the last remaining stone, or `0` if no stones are left.

### Example 1

```text
Input:  stones = [2, 7, 4, 1, 8, 1]
Output: 1
Explanation:
  7 and 8 collide -> 1 remains, stones: [2, 4, 1, 1, 1]
  2 and 4 collide -> 2 remains, stones: [2, 1, 1, 1]
  1 and 2 collide -> 1 remains, stones: [1, 1, 1]
  1 and 1 collide -> both are destroyed, stones: [1]
  The weight of the only remaining stone is 1.
```

### Example 2

```text
Input:  stones = [1]
Output: 1
Explanation: There is only one stone at the start, so no smash happens; its weight 1 is returned.
```

### Example 3

```text
Input:  stones = [2, 2]
Output: 0
Explanation: When two equal stones collide, both are destroyed and no stone is left.
```

### Constraints

- `1 <= stones.length <= 30`
- `1 <= stones[i] <= 1000`

## Hints

- On each turn we need the **two heaviest stones** among the current ones, and if a piece is left after the smash, we have to add it back among the stones.
- Re-sorting the array from scratch every turn takes O(n² log n) time. Instead, use a **max-heap (priority queue)** that gives you the largest element quickly and inserts a new element while keeping the order.
- C#'s `PriorityQueue<TElement, TPriority>` dequeues the smallest priority first by default (a min-heap). By giving the negated weight (`-stone`) as the priority, you can make it work directly as a max-heap.
- As long as more than one stone remains in the queue (`heap.Count > 1`), pull out two stones and, if their difference is greater than zero, add it back to the queue.

## Solution

At each step of the simulation, we need to pull out the two largest numbers we have and, if their difference is nonzero, put the new number back into the collection. This pattern is the classic use case for the **max-heap** data structure.

1. We add all the stones to a max-heap. In C#, `PriorityQueue<int, int>` puts the smallest priority on top, so we add each stone with a negative priority as `(stone, -stone)`; this way the heaviest stone has the smallest (most negative) priority value and comes out first.
2. As long as there are at least two stones in the heap (`heap.Count > 1`), we pull two stones in a row from the top (`first` and `second`). The first stone pulled is always greater than or equal to the second (`first >= second`).
3. If `first > second`, we compute the difference (`diff = first - second`) and add it back to the heap. If they are equal (`first == second`), both are destroyed, so we add nothing.
4. When the loop ends, we return the stone left in the heap, or `0` if there is none.

```csharp solution
public class Solution
{
    public int LastStoneWeight(int[] stones)
    {
        PriorityQueue<int, int> heap = new PriorityQueue<int, int>();
        foreach (int stone in stones)
        {
            heap.Enqueue(stone, -stone);
        }

        while (heap.Count > 1)
        {
            int first = heap.Dequeue();
            int second = heap.Dequeue();

            if (first > second)
            {
                int diff = first - second;
                heap.Enqueue(diff, -diff);
            }
        }

        return heap.Count == 1 ? heap.Dequeue() : 0;
    }
}
```

```typescript solution
function lastStoneWeight(stones: number[]): number {
  const heap = [...stones];

  const siftDown = (idx: number): void => {
    const n = heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < n && heap[left] > heap[largest]) largest = left;
      if (right < n && heap[right] > heap[largest]) largest = right;
      if (largest === idx) break;

      [heap[idx], heap[largest]] = [heap[largest], heap[idx]];
      idx = largest;
    }
  };

  const siftUp = (idx: number): void => {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (heap[parent] >= heap[idx]) break;
      [heap[parent], heap[idx]] = [heap[idx], heap[parent]];
      idx = parent;
    }
  };

  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      siftDown(0);
    }
    return top;
  };

  const push = (val: number): void => {
    heap.push(val);
    siftUp(heap.length - 1);
  };

  for (let i = (heap.length >> 1) - 1; i >= 0; i--) {
    siftDown(i);
  }

  while (heap.length > 1) {
    const first = pop();
    const second = pop();
    if (first > second) {
      push(first - second);
    }
  }

  return heap.length === 1 ? heap[0] : 0;
}
```

### Complexity

- **Time:** O(n log n). Each smash reduces the number of stones by at least 1; there are at most `n - 1` smashes, and each heap operation takes O(log n).
- **Space:** O(n) for the max-heap holding the stones.
