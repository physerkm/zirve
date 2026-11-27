---
title: Complexity Analysis (Big-O)
summary: The language for measuring how a solution scales as its input grows. Time and space complexity, the common classes, and how to do the analysis in an interview.
---

For every solution you write in an interview, you'll be asked two questions: "What's the time complexity?" and "What's the space complexity?" A candidate who can't answer these clearly scores poorly even if the code is correct. The good news: the math involved is light, and learning a few patterns covers most cases.

## What Big-O tells you

Big-O tells you how the amount of work an algorithm does **grows as the input size grows**. It measures the growth rate, not seconds. There are two simplification rules:

1. **Drop constant factors.** An algorithm that takes `3n` steps and one that takes `n/2` steps are both O(n).
2. **Keep the dominant term.** `n² + 100n + 5` is O(n²); as `n` grows, the other terms become insignificant.

Technically, Big-O is an **upper bound**. In interviews, unless stated otherwise, it refers to the **worst case**.

## Common classes

| Complexity | Name | Typical example | Steps for n = 1,000,000 |
| --- | --- | --- | --- |
| O(1) | Constant | Indexing into an array, lookup in a hash table | 1 |
| O(log n) | Logarithmic | Binary search, search in a balanced tree | ~20 |
| O(n) | Linear | Traversing an array once | 1,000,000 |
| O(n log n) | Linearithmic | Efficient sorting (merge sort, quicksort on average) | ~20,000,000 |
| O(n²) | Quadratic | Trying all pairs | 10¹² |
| O(2ⁿ) | Exponential | Generating all subsets | infeasible |
| O(n!) | Factorial | Generating all permutations | infeasible |

A rough rule: a modern processor does around 10⁸ simple operations per second. If the constraints say `n ≤ 10⁵`, an O(n²) solution (10¹⁰ operations) won't pass; you should look for O(n log n) or O(n). If you see `n ≤ 20`, an exponential solution may be expected.

## Reading complexity from code

**Sequential blocks add, nested blocks multiply.**

```csharp
// O(n) + O(n) = O(n)
foreach (var x in items) Console.WriteLine(x);
foreach (var x in items) Console.WriteLine(x * 2);

// O(n) * O(n) = O(n²)
foreach (var a in items)
    foreach (var b in items)
        Console.WriteLine(a + b);
```

**If the loop variable doubles or halves at each step, there's a logarithm.**

```csharp
// i: 1, 2, 4, 8, ... n  ->  O(log n)
for (var i = 1; i < n; i *= 2) { }
```

**If the inner loop's bound depends on the outer loop, compute the sum.**

```csharp
// The inner loop runs 0, 1, 2, ..., n-1 times: n(n-1)/2  ->  O(n²)
for (var i = 0; i < n; i++)
    for (var j = 0; j < i; j++) { }
```

**Different inputs get different letters.** Code that traverses two separate arrays in nested loops is not O(n²) but O(a · b). Making this distinction makes a difference in an interview.

**Watch out for hidden costs.** A one-line library call may not be constant time:

```csharp
// Because list.Contains is O(n), this loop is O(n²).
foreach (var x in items)
    if (list.Contains(x)) count++;

// Concatenating strings in a loop copies a new string every time: O(n²).
var s = "";
foreach (var word in words) s += word;      // use StringBuilder
```

## Analyzing recursion

The cost of a recursive function is roughly **number of calls × work per call**. Drawing the call tree is the most reliable method.

```csharp
int Fib(int n) => n < 2 ? n : Fib(n - 1) + Fib(n - 2);
```

Each call makes two calls and the tree has depth `n`: about 2ⁿ nodes, so O(2ⁿ) time. **Space**, however, is not the total size of the tree but its **depth**: at most `n` frames are on the stack at the same time, so O(n) space.

Common recursion patterns:

| Pattern | Example | Result |
| --- | --- | --- |
| Halve the problem, do constant work | Binary search | O(log n) |
| Split into two halves, do linear work | Merge sort | O(n log n) |
| Visit each node once | Tree traversal | O(n) |
| Branch in two at each step, depth n | Subsets | O(2ⁿ) |

## Space complexity

Space analysis counts the memory an algorithm uses **beyond the input**:

- The arrays, hash tables, and queues you create.
- **The recursion call stack.** This is the most frequently forgotten item. A recursion of depth `n` uses O(n) space even if it creates no data structures.

Time and space are often traded for each other: spending O(n) memory on a hash table to bring O(n²) time down to O(n) is the most common move in interviews.

## Amortized analysis

Some operations are cheap most of the time and expensive once in a while. `List<T>.Add` is an example: when the capacity fills up, all elements are copied into a new array twice the size (O(n)), but this happens rarely. Over `n` additions, the total copying is `n + n/2 + n/4 + … < 2n`, so the **amortized** cost per addition is O(1). The same reasoning applies to inserting into a hash table.

## How to explain it in an interview

Don't just state the result; give the reasoning in one sentence:

> "I traverse the array once and do a constant-time hash table lookup for each element, so time is O(n). In the worst case the table holds all the elements, so space is O(n)."

Do the analysis without being asked. Stating the complexity of the brute-force solution and saying "we can bring this down to X" directly raises your problem-solving score.

## Summary

- Big-O measures the growth rate: drop the constants, keep the dominant term.
- Sequential blocks add, nested blocks multiply, and halving loops are logarithmic.
- For recursion, look at the number of nodes in the call tree for time and its depth for space.
- The constraints give away the target complexity: `n ≤ 10⁵` usually calls for O(n log n) or better.
- Know the cost of library calls: `Contains`, string concatenation, `Sort`.
