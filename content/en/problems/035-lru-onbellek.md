---
title: LRU Cache
---
Design a fixed-capacity cache that evicts the **Least Recently Used** (LRU) key.

Implement the `LRUCache` class with these methods:

- `LRUCache(capacity)` creates the cache with a positive capacity.
- `get(key)` returns the key's value if it exists, and `-1` otherwise.
- `put(key, value)` updates the value if the key exists; otherwise it inserts the pair. If the insertion makes the number of items exceed the capacity, the **least recently used** key is evicted.

Both `get` and `put` count as "using" a key. Both methods must run in **O(1)** average time.

### Example

```text
Operations: LRUCache(2), put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4)
Output:     null,        null,      null,      1,      null,      -1,     null,      -1,     3,      4

Explanation:
  put(3, 3)  -> capacity is full; the least recently used key 2 is evicted (1 was just read).
  put(4, 4)  -> the least recently used key 1 is evicted.
```

### Constraints

- `1 <= capacity <= 3000`
- At most 2 · 10^5 operations are made.

## Hints

- O(1) access by key requires a hash table. But a hash table can't answer "which one was least recently used?"
- Which data structure keeps the usage order and can **remove an element from the middle and move it to the front** in O(1)?
- Hash table + doubly linked list: the table maps a key to its list node; the list keeps the usage order.

## Solution

There are two requirements, and no single data structure meets both:

1. **O(1) access by key** → hash table.
2. **Updating the usage order in O(1)** (moving an element to most recent, evicting the oldest) → doubly linked list.

We combine them: the list keeps the elements from most recently used to least recently used; the hash table maps each key to its **node** in the list. Since we can reach the node directly, unlinking it and moving it to the front takes constant time.

- `get`: find the node, move it to the front, return the value.
- `put`: if the key exists, update the value and move it to the front. Otherwise, add a new node at the front; if the capacity is exceeded, remove the node at the **end** of the list from both the list and the table.

The C# solution uses the built-in `LinkedList<T>` class. The TypeScript solution relies on `Map` **preserving insertion order**: deleting a key and inserting it again moves it to the end of the order (most recent), and `keys().next()` gives the oldest key.

```csharp solution
public class LRUCache
{
    private readonly int _capacity;
    private readonly Dictionary<int, LinkedListNode<(int Key, int Value)>> _nodes = new();
    private readonly LinkedList<(int Key, int Value)> _order = new();   // head: most recent, tail: oldest

    public LRUCache(int capacity)
    {
        _capacity = capacity;
    }

    public int Get(int key)
    {
        if (!_nodes.TryGetValue(key, out var node)) return -1;

        _order.Remove(node);
        _order.AddFirst(node);
        return node.Value.Value;
    }

    public void Put(int key, int value)
    {
        if (_nodes.TryGetValue(key, out var existing))
        {
            _order.Remove(existing);
        }
        else if (_nodes.Count == _capacity)
        {
            var oldest = _order.Last;
            _order.RemoveLast();
            _nodes.Remove(oldest.Value.Key);
        }

        _nodes[key] = _order.AddFirst((key, value));
    }
}
```

```typescript solution
class LRUCache {
  private readonly capacity: number;
  private readonly entries = new Map<number, number>();   // insertion order: oldest -> most recent

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    const value = this.entries.get(key);
    if (value === undefined) return -1;

    // Deleting and re-inserting moves the key to the "most recent" position.
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  put(key: number, value: number): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size === this.capacity) {
      const oldest = this.entries.keys().next().value as number;
      this.entries.delete(oldest);
    }

    this.entries.set(key, value);
  }
}
```

### Complexity

- **Time:** O(1) for both `get` and `put`.
- **Space:** O(capacity).

In an interview, you are often asked to write the doubly linked list **yourself** instead of using the built-in `LinkedList` or the `Map` trick. In that case, placing a dummy node at the head and at the tail removes the "empty list" and "single element" special cases.
