---
title: Top K Frequent Elements
---
You are given an integer array `nums` and an integer `k`. Return **the `k` most frequent elements** in the array. You can return the answer in any order.

The answer is guaranteed to be unique.

Your algorithm's time complexity must be better than **O(n log n)** (where `n` is the length of the array).

### Example 1

```text
Input:  nums = [1, 1, 1, 2, 2, 3], k = 2
Output:  [1, 2]
Explanation: 1 appears 3 times, 2 appears 2 times, and 3 appears once. The 2 most frequent elements are 1 and 2.
```

### Example 2

```text
Input:  nums = [1], k = 1
Output:  [1]
Explanation: The array has only one element, 1.
```

### Example 3

```text
Input:  nums = [4, 4, 4, 6, 6, 2, 2, 2, 2], k = 2
Output:  [2, 4]
Explanation: 2 appears 4 times, 4 appears 3 times, and 6 appears 2 times.
```

### Constraints

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `k` is in the range `[1, the number of unique elements in the array]`.
- The answer is guaranteed to be unique.

## Hints

- First, count how many times each number appears in O(n) time with a hash table (`Dictionary` / `Map`).
- Sorting by frequency takes O(n log n), and using a min-heap of size `k` takes O(n log k). So how can you find the answer in O(n) time without sorting at all?
- A number's frequency can be at most `nums.length`. Consider building a "bucket array" whose indices represent frequency values.
- Walk backward from the highest-frequency bucket (`nums.length`) and collect `k` elements.

## Solution

Count how many times each element appears with a hash table (`count`) in O(n) time. Sorting the elements by frequency after that would take O(n log n); however, since frequency values are bounded between `1` and `n` (`nums.Length`), you can use **bucket sort** to bring the time down to O(n).

Create a `buckets` array of size `n + 1`. The list at index `f` of this array holds the numbers that appear exactly `f` times in `nums`. Add each `(number, frequency)` pair from the hash table to the corresponding bucket `buckets[frequency]`.

Finally, scan the `buckets` array from the far right (index `n`) to the left. Write the numbers from non-empty buckets into the result array in order, and as soon as you reach `k` elements, stop and return the result.

```csharp solution
public class Solution
{
    public int[] TopKFrequent(int[] nums, int k)
    {
        // 1. Compute how many times each number appears (its frequency).
        Dictionary<int, int> count = new Dictionary<int, int>();
        foreach (int num in nums)
        {
            count[num] = count.GetValueOrDefault(num, 0) + 1;
        }

        // 2. Build buckets indexed by frequency.
        List<int>[] buckets = new List<int>[nums.Length + 1];
        foreach (KeyValuePair<int, int> pair in count)
        {
            int num = pair.Key;
            int freq = pair.Value;
            if (buckets[freq] == null)
                buckets[freq] = new List<int>();
            buckets[freq].Add(num);
        }

        // 3. Collect k elements, going backward from the highest frequency.
        int[] result = new int[k];
        int idx = 0;
        for (int f = buckets.Length - 1; f >= 1 && idx < k; f--)
        {
            if (buckets[f] == null)
                continue;

            foreach (int num in buckets[f])
            {
                result[idx++] = num;
                if (idx == k)
                    return result;
            }
        }

        return result;
    }
}
```

```typescript solution
function topKFrequent(nums: number[], k: number): number[] {
  const count = new Map<number, number>();
  for (const num of nums) {
    count.set(num, (count.get(num) ?? 0) + 1);
  }

  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of count.entries()) {
    buckets[freq].push(num);
  }

  const result: number[] = [];
  for (let f = buckets.length - 1; f >= 1 && result.length < k; f--) {
    for (const num of buckets[f]) {
      result.push(num);
      if (result.length === k) {
        return result;
      }
    }
  }

  return result;
}
```

### Complexity

- **Time:** O(n). Counting frequencies takes O(n), filling the buckets takes O(n), and scanning the buckets from the end takes at most O(n) steps.
- **Space:** O(n). The frequency table and the bucket array of size `n + 1` hold at most `n` unique elements in total.
