---
title: Largest Rectangle in Histogram
---
You are given an integer array `heights` representing the bar heights of a histogram where each bar has width `1`. Return the **area of the largest rectangle** that fits inside the histogram.

### Example 1

```text
Input:  heights = [2, 1, 5, 6, 2, 3]
Output: 10
Explanation: The largest rectangle spans the bars of height 5 and 6: height = 5, width = 2, area = 10.
```

### Example 2

```text
Input:  heights = [2, 4]
Output: 4
Explanation: The bar of height 4 on its own (4 · 1 = 4) or the height-2 rectangle across the base of both bars (2 · 2 = 4) gives the largest area.
```

### Constraints

- `1 <= heights.length <= 10^5`
- `0 <= heights[i] <= 10^4`

## Hints

- For each bar, ask: "how far does the widest rectangle that uses exactly this bar's height extend?"
- A bar can extend until it hits the first bar **shorter than itself** on its left and on its right.
- Keep `(startIndex, height)` pairs on a stack in increasing order of height: when a shorter bar arrives, the taller bars at the top of the stack have reached their right boundary.
- While popping the taller bars off the stack (`Pop`), extend the new shorter bar's left starting boundary back to the start of the popped bars.

## Solution

The widest rectangle a bar can form with its own height extends until it sees a bar **shorter than itself** on the right and on the left. Scanning left and right for every bar takes O(n²); instead, using a **monotonically increasing stack**, we can find each bar's left and right boundaries in a single pass.

We keep `(Start, Height)` pairs on the stack. Here `Start` shows how far back to the left that height can start:

1. Moving left to right, we arrive at bar `heights[i]` and take its starting boundary as `start = i`.
2. **As long as** the height at the top of the stack is **greater** than `heights[i]`, the bar at the top has hit a shorter bar on its right, so it can't extend any further right. We remove it with `Pop()`, compute the area `prevHeight * (i - prevStart)`, and update `maxArea`.
3. Also, since our new bar can extend left through the taller bars we just popped, we push its left boundary back by setting `start = prevStart`.
4. At the end of the loop, we push the pair `(start, heights[i])` onto the stack.
5. When the array is exhausted, the bars left on the stack were able to extend uninterrupted to the very end of the array (`heights.Length`); we pop them all and check their areas.

```csharp solution
public class Solution
{
    public int LargestRectangleArea(int[] heights)
    {
        var stack = new Stack<(int Start, int Height)>();
        int maxArea = 0;

        for (int i = 0; i < heights.Length; i++)
        {
            int start = i;

            // When a shorter bar arrives, the right boundary of the taller bars on the stack is i.
            while (stack.Count > 0 && stack.Peek().Height > heights[i])
            {
                var (prevStart, prevHeight) = stack.Pop();
                maxArea = Math.Max(maxArea, prevHeight * (i - prevStart));
                start = prevStart; // The shorter bar can extend left to where the taller bar started.
            }

            stack.Push((start, heights[i]));
        }

        // Compute the areas of the bars that reach the end of the array uninterrupted.
        while (stack.Count > 0)
        {
            var (start, height) = stack.Pop();
            maxArea = Math.Max(maxArea, height * (heights.Length - start));
        }

        return maxArea;
    }
}
```

```typescript solution
function largestRectangleArea(heights: number[]): number {
  const stack: { start: number; height: number }[] = [];
  let maxArea = 0;

  for (let i = 0; i < heights.length; i++) {
    let start = i;

    while (stack.length > 0 && stack[stack.length - 1].height > heights[i]) {
      const { start: prevStart, height: prevHeight } = stack.pop()!;
      maxArea = Math.max(maxArea, prevHeight * (i - prevStart));
      start = prevStart;
    }

    stack.push({ start, height: heights[i] });
  }

  while (stack.length > 0) {
    const { start, height } = stack.pop()!;
    maxArea = Math.max(maxArea, height * (heights.length - start));
  }

  return maxArea;
}
```

### Complexity

- **Time:** O(n). Each bar is pushed onto the stack exactly once and popped at most once.
- **Space:** O(n), for the stack holding bars of increasing height.
