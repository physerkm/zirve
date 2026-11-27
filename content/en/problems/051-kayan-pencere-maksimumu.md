---
title: Sliding Window Maximum
---
You are given an integer array `nums` and a sliding window of size `k`. The window starts at the far left of the array and moves one position to the right at each step until it reaches the far right. You can only see the `k` numbers in the window at any time.

Return an array containing the **maximum element** in the window for each window position.

### Example 1

```text
Input:  nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
Output: [3, 3, 5, 5, 6, 7]
Explanation:
Window position               Max
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7
```

### Example 2

```text
Input:  nums = [1], k = 1
Output: [1]
Explanation: In a single-element window, the maximum is the element itself.
```

### Constraints

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `1 <= k <= nums.length`

## Hints

- Scanning the `k` elements from scratch for every window takes O(n·k). As the window slides, think about which elements **can never be the maximum again**.
- When a new element `nums[right]` enters the window from the right, no element further left in the window whose value is less than or equal to `nums[right]` can be the maximum anymore, because `nums[right]` is both larger than them and will stay in the window longer.
- Keep the indices in a **monotonically decreasing** double-ended queue (deque): before adding a new index, remove from the back every index with `nums[back] <= nums[right]`.
- The index at the front of the deque always points to the largest element of the current window; it is removed from the front only when it leaves the window (`deque.First < right - k + 1`).

## Solution

To find each window's maximum in O(1) time, we keep the elements' indices in a **double-ended queue (deque)** so that their values stay in **largest-to-smallest** (monotonically decreasing) order.

When processing the new element at index `right`, we apply three steps:
1. **Remove the expired:** If the index at the front of the deque has fallen behind the window's left edge (`deque.First.Value < right - k + 1`), we remove it from the front.
2. **Discard the smaller ones:** While the values at the indices at the back of the deque are less than or equal to `nums[right]` (`nums[deque.Last.Value] <= nums[right]`), we drop them from the back. Since `nums[right]` is both larger and further right, it will live longer in the window; the older, smaller elements no longer have any chance of being the maximum.
3. **Add and read:** We add index `right` to the back of the deque. From the moment the first full window forms (`right >= k - 1`), at every step the index at the front of the deque (`nums[deque.First.Value]`) is that window's maximum.

Each index enters the deque exactly once and leaves it at most once, so all windows are computed in O(n) time in total.

```csharp solution
public class Solution
{
    public int[] MaxSlidingWindow(int[] nums, int k)
    {
        int n = nums.Length;
        int[] result = new int[n - k + 1];
        LinkedList<int> deque = new LinkedList<int>();

        for (int right = 0; right < n; right++)
        {
            // Drop the index that left the window from the front of the deque.
            if (deque.Count > 0 && deque.First!.Value < right - k + 1)
                deque.RemoveFirst();

            // Drop the ones less than or equal to the new element from the back of the deque.
            while (deque.Count > 0 && nums[deque.Last!.Value] <= nums[right])
                deque.RemoveLast();

            deque.AddLast(right);

            // Record the maximum once the first full window has formed.
            if (right >= k - 1)
                result[right - k + 1] = nums[deque.First!.Value];
        }

        return result;
    }
}
```

```typescript solution
function maxSlidingWindow(nums: number[], k: number): number[] {
  const n = nums.length;
  const result: number[] = [];
  const deque: number[] = [];
  let head = 0;

  for (let right = 0; right < n; right++) {
    if (head < deque.length && deque[head] < right - k + 1) {
      head++;
    }

    while (head < deque.length && nums[deque[deque.length - 1]] <= nums[right]) {
      deque.pop();
    }

    deque.push(right);

    if (right >= k - 1) {
      result.push(nums[deque[head]]);
    }
  }

  return result;
}
```

### Complexity

- **Time:** O(n). Each index is added to the deque once and removed at most once.
- **Space:** O(k) (not counting the output array). The deque holds at most one window's worth (`k`) of indices at a time.
