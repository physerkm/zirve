---
title: Insert Delete GetRandom O(1)
---
Design a set in which every operation runs in **average O(1)** time.

Implement the `RandomizedSet` class:

- `RandomizedSet()` creates an empty set.
- `insert(val)` inserts `val` if it is not in the set and returns `true`; otherwise it returns `false`.
- `remove(val)` removes `val` if it is in the set and returns `true`; otherwise it returns `false`.
- `getRandom()` returns a random element from the set, with **every element equally likely**. When it is called, the set contains at least one element.

To keep the tests deterministic, `getRandom` is only called when the set contains **a single element**; your solution should still pick uniformly at random in every case.

### Example

```text
Operations:  RandomizedSet, insert(1), remove(2), insert(2), remove(1), getRandom(), insert(2), getRandom()
Output:      null,          true,      false,     true,      true,      2,           false,     2
```

### Constraints

- `-2^31 <= val <= 2^31 - 1`
- At most `2 * 10^5` calls are made in total.

## Hints

- A hash set handles insertion and removal in O(1), but it can't give you a random element in O(1).
- An array gives O(1) access by random index, but removing from the middle is O(n).
- Use both together: keep the values in an array and each value's index in the array in a dictionary. When removing, **swap the element with the last element of the array** and remove from the end.

## Solution

### Array + index dictionary

- `values`: a dynamic array holding the elements.
- `indexOf`: the position of each value inside `values`.

`insert`: if the value is not in the dictionary, append it to the end of the array and record its index.

`remove`: let `i` be the index of the value to remove. Move the array's **last** element to position `i` and update its index in the dictionary; then remove the end of the array. Removing from the end is O(1), and since order doesn't matter, swapping is fine.

`getRandom`: `values[random(0, Count)]`. Because the array has no gaps, every element is equally likely.

```csharp solution
public class RandomizedSet
{
    private readonly List<int> values = new();
    private readonly Dictionary<int, int> indexOf = new();
    private readonly Random random = new();

    public bool Insert(int val)
    {
        if (indexOf.ContainsKey(val))
        {
            return false;
        }

        indexOf[val] = values.Count;
        values.Add(val);
        return true;
    }

    public bool Remove(int val)
    {
        if (!indexOf.TryGetValue(val, out var i))
        {
            return false;
        }

        var last = values[^1];
        values[i] = last;
        indexOf[last] = i;
        values.RemoveAt(values.Count - 1);
        indexOf.Remove(val);
        return true;
    }

    public int GetRandom()
    {
        return values[random.Next(values.Count)];
    }
}
```

```typescript solution
class RandomizedSet {
  private values: number[] = [];
  private indexOf = new Map<number, number>();

  insert(val: number): boolean {
    if (this.indexOf.has(val)) return false;
    this.indexOf.set(val, this.values.length);
    this.values.push(val);
    return true;
  }

  remove(val: number): boolean {
    const i = this.indexOf.get(val);
    if (i === undefined) return false;

    const last = this.values[this.values.length - 1];
    this.values[i] = last;
    this.indexOf.set(last, i);
    this.values.pop();
    this.indexOf.delete(val);
    return true;
  }

  getRandom(): number {
    return this.values[Math.floor(Math.random() * this.values.length)];
  }
}
```

### Complexity

- **Time:** Average O(1) per operation.
- **Space:** O(n).

In `remove`, it matters that the removal from the dictionary happens **last**: if the value being removed is the last element itself (`last == val`), `indexOf[last] = i` is written first, then the entry is deleted, so no stale entry is left in the dictionary.
