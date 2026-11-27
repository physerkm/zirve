---
title: Binary Search
summary: O(log n) search over sorted data. A template for writing it without off-by-one errors, finding the first/last position, and the "binary search on the answer" technique.
---

Binary search is a simple idea: look at the middle of a sorted range and continue into whichever half contains the target. Even so, it's the topic where candidates make the most **off-by-one errors** in interviews. In this lesson you'll see how to write it without bugs, and that the idea is about much more than "finding an element in an array."

## The basic template

```csharp
int BinarySearch(int[] nums, int target)
{
    var left = 0;
    var right = nums.Length - 1;          // closed interval: [left, right]

    while (left <= right)
    {
        var mid = left + (right - left) / 2;

        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }

    return -1;
}
```

The range halves at every step: O(log n) time, O(1) space. At most 20 steps for a million elements.

Choose three details deliberately and stay **consistent**:

1. **Is the interval closed?** Here `[left, right]` is closed, so the starting value is `Length - 1` and the condition is `left <= right`.
2. **The midpoint.** `(left + right) / 2` can cause integer overflow on large arrays; `left + (right - left) / 2` doesn't. In JavaScript you need `Math.floor` to round the result down to an integer.
3. **Narrowing the range.** `mid` has been tested and ruled out, hence `mid + 1` and `mid - 1`. Leaving `mid` in the range here is the most common cause of infinite loops.

## Boundary search: the first position that satisfies a condition

This is the truly powerful form. If the array splits into two parts for some condition, "always false first, then always true," binary search finds **the first position where it becomes true**.

```typescript
// Returns the first index with nums[i] >= target (or nums.length if there is none).
function lowerBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length;                 // half-open interval: [left, right)

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] >= target) right = mid;  // mid may be the answer, keep it in range
    else left = mid + 1;                   // mid is definitely not the answer
  }

  return left;
}
```

This single function solves many questions:

- **Does the element exist?** `i = lowerBound(target)`; `i < n && nums[i] === target`.
- **First occurrence:** `lowerBound(target)`.
- **Last occurrence:** `lowerBound(target + 1) - 1`.
- **How many times it occurs:** `lowerBound(target + 1) - lowerBound(target)`.
- **Insertion position:** `lowerBound(target)`.

Keep the loop invariant in mind: the condition is false for every position to the left of `left`, and true for `right` and every position to its right. The loop ends when `left === right`, and that position is the answer.

## Binary search on the answer

Binary search doesn't require an array; a **monotonic condition** is enough. If the question has the form "what is the **smallest** (or largest) value that satisfies this condition?", and whenever the condition holds for a value it also holds for every larger value, you can binary search over the range of possible answers.

Example: there are piles where `piles[i]` holds bananas, and you have `h` hours. If you can eat `k` bananas per hour (from a single pile per hour), what is the smallest `k` that lets you finish them all?

- If `k` is too small you won't make it; if it's large enough you will: the condition is monotonic.
- The hours needed for a given `k` can be computed in O(n).
- `k` lies between 1 and the largest pile.

```csharp
int MinEatingSpeed(int[] piles, int h)
{
    var left = 1;
    var right = piles.Max();

    while (left < right)
    {
        var speed = left + (right - left) / 2;
        var hours = piles.Sum(p => (long)(p + speed - 1) / speed);   // division rounded up

        if (hours <= h) right = speed;      // it works: try a slower one
        else left = speed + 1;              // it doesn't: we must go faster
    }

    return left;
}
```

The complexity is O(n · log(max)). Clues for recognizing this pattern: phrases like "at least how many…", "at most how much…", "the smallest capacity", "the largest minimum distance," and the possible answers forming a sorted range.

## Rotated sorted array

If a sorted array has been rotated at some point (`[4, 5, 6, 7, 0, 1, 2]`), the array as a whole isn't sorted, but **one side of the midpoint is always sorted**. You check which side is sorted and test whether the target falls in that range:

```typescript
function searchRotated(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;

    if (nums[left] <= nums[mid]) {
      // The left half is sorted.
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      // The right half is sorted.
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }

  return -1;
}
```

## Debugging checklist

If your binary search misbehaves, check these in order:

1. Is your interval definition (closed / half-open) consistent with the starting value and the loop condition?
2. Does the range **actually shrink** in every branch? Trace it by hand on a two-element range.
3. Have you tried an empty array, a single element, the target at the very start, the target at the very end, and the target not in the array?

## Summary

- Binary search works on sorted data or a monotonic condition; it halves the range at each step.
- Know the "first position that satisfies the condition" template by heart; first/last position, counting, and insertion position all derive from it.
- If the question asks for "the smallest/largest valid value" and the condition is monotonic, binary search on the answer itself.
- To guard against off-by-one errors, pick your interval definition once and follow it on every line.
