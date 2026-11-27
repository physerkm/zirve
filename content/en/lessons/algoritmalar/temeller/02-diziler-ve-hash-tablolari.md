---
title: Arrays and Hash Tables
summary: The two data structures used in more than half of all interview questions. How they work, how long each operation takes, and how a hash table turns O(n²) solutions into O(n).
---

The two tools you'll use most often in coding interviews are the array and the hash table. Most "easy" and "medium" problems come down to using these two correctly.

## Arrays

An array stores its elements **next to each other** in memory. That's why the address of element `i` can be computed directly and access takes constant time. The price: inserting an element in the middle or deleting one from the middle requires shifting all the elements after it.

| Operation | Complexity |
| --- | --- |
| Access / update by index | O(1) |
| Append to the end (dynamic array) | O(1) amortized |
| Insert / delete at the start or in the middle | O(n) |
| Search by value (unsorted) | O(n) |
| Search by value (sorted, binary search) | O(log n) |

Their counterparts in each language:

| | Fixed-size | Dynamic |
| --- | --- | --- |
| C# | `int[]` | `List<int>` |
| JavaScript / TypeScript | — | `Array` (`number[]`) |

Contiguous data makes good use of the CPU cache. That's why, in practice, traversing an array is noticeably faster than traversing a linked list with the same number of elements; Big-O doesn't show this.

### Strings are arrays too, but immutable

In C# and JavaScript, strings are **immutable**. Changing a character or concatenating two strings creates a new string. That's why concatenating with `+=` inside a loop is O(n²).

```csharp
// Bad: at each step, the entire string built so far is copied.
var result = "";
foreach (var part in parts) result += part;

// Good: O(n)
var builder = new StringBuilder();
foreach (var part in parts) builder.Append(part);
var result2 = builder.ToString();
```

The JavaScript equivalent is to collect the parts in an array and call `parts.join('')`.

## Hash tables

A hash table stores key–value pairs and performs lookup, insertion, and deletion by key in **average O(1)** time.

How it works:

1. The key is passed through a **hash function** and turned into an integer.
2. That number is mapped to a **bucket** in the table's internal array: `index = hash % capacity`.
3. The value is written to that bucket.

If two different keys land in the same bucket, you get a **collision**. Collisions are usually resolved by keeping a small list in the bucket (chaining) or by checking an empty neighboring bucket (open addressing). When the table starts filling up, its capacity is increased and all elements are reinserted; that's why insertion is "amortized" O(1).

| Operation | Average | Worst |
| --- | --- | --- |
| Lookup / insert / delete | O(1) | O(n) |

The worst case is all keys landing in the same bucket. With a good hash function you won't see it in practice; saying "average O(1)" in an interview is enough, but showing that you know the worst case is a plus.

| | Key → value | Key only (set) |
| --- | --- | --- |
| C# | `Dictionary<TKey, TValue>` | `HashSet<T>` |
| JavaScript / TypeScript | `Map` | `Set` |

In JavaScript, use `Map` instead of a plain object (`{}`): keys don't have to be strings, insertion order is preserved, and `size` is constant time.

### What it takes to be a key

For a type to work correctly as a key in a hash table, two equal values must produce **the same hash**. In C#, if you're going to use your own class as a key, you must override `Equals` and `GetHashCode` together (or use a `record`, which does this for you). If a key is modified after it's added to the table, it can never be found again; keys should be immutable.

In JavaScript, `Map` compares objects by **identity**: `map.get([1, 2])` can't find a different array with the same contents. When you need a composite key, convert the values to a string: `` `${row},${col}` ``.

## Three questions a hash table answers

**1. "Have I seen this before?"** Use a set.

```typescript
function hasDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}
```

**2. "How many times has this occurred?"** Use a frequency table.

```csharp
var counts = new Dictionary<char, int>();
foreach (var c in text)
{
    counts[c] = counts.GetValueOrDefault(c) + 1;
}
```

Questions like whether two strings are anagrams, the `k` most frequent elements, and the first non-repeating character are all variations of this pattern.

**3. "Where is the complement I'm looking for?"** Keep a mapping from value to index (or some other piece of information).

In the Two Sum problem, for each `x` you check whether `target - x` has appeared before. A single pass is enough instead of two nested loops: O(n²) → O(n).

The shared idea is this: **instead of "searching back," store what you've seen in a searchable form.**

## When a hash table isn't enough

A hash table doesn't keep its keys in order. If you need any of the following, choose a different structure:

- **Ordered traversal, smallest/largest key, range queries:** a balanced tree (`SortedDictionary`, `SortedSet`), with O(log n) operations.
- **Repeatedly extracting the smallest/largest element:** a heap (`PriorityQueue`).
- **If the keys fall within a small integer range** (e.g. the 26 lowercase letters): a plain array is both faster and simpler.

```csharp
var counts = new int[26];
foreach (var c in word) counts[c - 'a']++;
```

## Common mistakes

- **Modifying while iterating.** Adding or removing elements while iterating over a collection with `foreach` throws an exception in C# and gives unexpected results in JavaScript.
- **Forgetting the cost of `Contains`.** `List.Contains` and `Array.includes` are O(n). If you call them inside a loop, convert to a set.
- **Reading a missing key.** In C#, `dict[key]` throws an exception if the key doesn't exist; use `TryGetValue` or `GetValueOrDefault`. In JavaScript, `map.get(key)` returns `undefined`; since the value itself might be `0`, test with `map.has(key)` instead of `if (map.get(key))`.
- **Boundary errors.** Always think separately about an empty array, a single-element array, and the last index of the array.

## Summary

- Array: O(1) access, O(n) insertion in the middle. Strings are immutable; don't concatenate them in a loop.
- Hash table: average O(1) lookup, insertion, and deletion; it doesn't keep order.
- Three core uses: membership (set), frequency counting, finding the complement.
- Anywhere you find yourself saying "I'm searching with a nested loop," think of a hash table.
