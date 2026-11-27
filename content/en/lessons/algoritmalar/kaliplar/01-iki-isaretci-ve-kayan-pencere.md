---
title: Two Pointers and Sliding Window
summary: Two patterns that turn nested loops into a single pass in array and string problems. When to use them, how to set them up, and which mistakes to watch out for.
---

Many array and string problems can be solved by trying "all pairs" or "all subarrays"; that is O(n²) or worse. The two pointers and sliding window patterns solve the same problems **in a single pass**. The shared idea: when you advance a pointer, you eliminate in bulk the candidates that can never be useful again.

## Two pointers: converging from both ends

**When:** The array is **sorted** and you're looking for a pair that satisfies a condition, or you're doing a symmetric operation from both ends of the array inward (palindromes, reversing).

Let's find two numbers in a sorted array that sum to `target`:

```typescript
function pairWithSum(sorted: number[], target: number): [number, number] | null {
  let left = 0;
  let right = sorted.length - 1;

  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;   // sum too small: we need a larger number
    else right--;               // sum too large: we need a smaller number
  }

  return null;
}
```

**Why is it correct?** If the sum is too small, `sorted[left]` can't reach the target even with the largest remaining number (`sorted[right]`); so it's useless in every pair and can safely be skipped. Each step definitely eliminates one candidate, so the loop takes at most `n` steps: O(n) time, O(1) space.

The same pattern shows up in these problems: palindrome checking, container with most water, three sum (fix one number and use two pointers on the rest; O(n²) overall).

## Two pointers: same direction (fast and slow)

**When:** You want to filter or compact an array **in place** (without extra memory). `slow` marks the write position, `fast` the read position.

```csharp
// Removes duplicates from a sorted array in place and returns the number of unique elements.
int RemoveDuplicates(int[] nums)
{
    if (nums.Length == 0) return 0;

    var slow = 0;
    for (var fast = 1; fast < nums.Length; fast++)
    {
        if (nums[fast] != nums[slow])
        {
            slow++;
            nums[slow] = nums[fast];
        }
    }

    return slow + 1;
}
```

In linked lists, the same idea, with one pointer moving one step and the other moving two, is used to find the middle node and to detect cycles.

## Sliding window

**When:** The question asks for "the **longest / shortest contiguous** subarray or substring that satisfies some condition." The keyword is **contiguous**.

The window is the range `[left, right]`. `right` advances by one each step, growing the window; when the window breaks the condition, `left` advances to shrink it. Each element enters the window at most once and leaves it at most once: O(n) overall.

### Variable-size window

The length of the longest substring without repeating characters:

```typescript
function longestUnique(s: string): number {
  const inWindow = new Set<string>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    // While the window is invalid, shrink it from the left.
    while (inWindow.has(s[right])) {
      inWindow.delete(s[left]);
      left++;
    }

    inWindow.add(s[right]);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

Don't assume O(n²) just because you see a `while` nested inside a `for`: `left` advances at most `n` times in total. This is a classic example of **amortized** analysis, and you're expected to explain it in an interview.

The template is always the same:

1. Expand the window with `right` and update the window state.
2. While the window is **invalid**, shrink it with `left` and update the state.
3. While the window is valid, update the answer.

For "shortest" questions, steps 2 and 3 swap: you shrink the window while it's **valid**, updating the answer before each shrink.

### Fixed-size window

The maximum sum over all windows of size `k`: summing each window from scratch would be O(n·k). Instead, as the window slides one position to the right, add the element coming in and subtract the element going out.

```csharp
int MaxWindowSum(int[] nums, int k)
{
    var sum = 0;
    for (var i = 0; i < k; i++) sum += nums[i];

    var best = sum;
    for (var right = k; right < nums.Length; right++)
    {
        sum += nums[right] - nums[right - k];
        best = Math.Max(best, sum);
    }

    return best;
}
```

## Which pattern when

| Clue | Pattern |
| --- | --- |
| Sorted array, looking for a pair or triplet | Two pointers converging from both ends |
| Filtering or compacting "in place" | Two pointers in the same direction |
| "Longest / shortest **contiguous**…" | Variable-size window |
| "For every window of size k…" | Fixed-size window |
| A subarray sum is asked for, but there are **negative** numbers | A window doesn't work; prefix sums + hash table |

The last row matters. The sliding window relies on the assumption that growing the window changes the state in only one direction (e.g. the sum always increases). Negative numbers break that assumption.

## Common mistakes

- **The loop condition.** When converging, is it `left < right` or `left <= right`? If using the same element twice isn't allowed, use `<`.
- **Window length.** `right - left + 1`; forgetting the `+1` is a classic off-by-one error.
- **Forgetting to update the state.** As `left` advances, don't forget to remove the element leaving the window from the counter or set.
- **The cost of sorting.** If you need to sort the array for two pointers, you pay O(n log n) and lose the original indices. If indices are required, a hash table may be a better fit.

## Summary

- Both patterns rest on the observation "there's no need to try this candidate again," and they reduce O(n²) to O(n).
- Sorted data and pair search: two pointers from both ends. Contiguous subarray: sliding window.
- In a sliding window, the inner `while` loop takes `n` steps in total; the complexity is O(n).
