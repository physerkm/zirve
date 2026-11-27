---
title: Median of Two Sorted Arrays
---
You are given two integer arrays `nums1` and `nums2`, of sizes `m` and `n` respectively, each sorted in ascending order. Return the **median** of the two arrays combined.

The overall run time complexity of your algorithm must be **O(log(m + n))**.

### Example 1

```text
Input:  nums1 = [1, 3], nums2 = [2]
Output: 2.0
Explanation: The merged array is [1, 2, 3] and its median is 2.
```

### Example 2

```text
Input:  nums1 = [1, 2], nums2 = [3, 4]
Output: 2.5
Explanation: The merged array is [1, 2, 3, 4] and its median is (2 + 3) / 2 = 2.5.
```

### Constraints

- `nums1.length == m`
- `nums2.length == n`
- `0 <= m <= 1000`
- `0 <= n <= 1000`
- `1 <= m + n <= 2000`
- `-10^6 <= nums1[i], nums2[i] <= 10^6`

## Hints

- Actually merging the two arrays takes O(m + n). To aim for O(log(min(m, n))), you should think about binary search.
- The median is the boundary that splits the combined array into two equal parts (or with the left part one element larger): every element in the left half must be less than or equal to every element in the right half.
- Once you choose how many elements (`i`) the shorter array contributes to the left half, the number of elements the other array contributes (`j = half - i`) is determined automatically.
- To check for the correct split, you only need to compare the four elements immediately to the left and right of the boundary (`maxLeftA <= minRightB` and `maxLeftB <= minRightA`).

## Solution

The median of an array is the point that splits it into two halves of equal length (with the left half holding one extra element when the total count is odd). With two sorted arrays, if we cut `nums1` at position `i` and `nums2` at position `j`:
- The left half contains the first `i` elements of `nums1` and the first `j` elements of `nums2` (`i + j = (m + n + 1) / 2`).
- The right half contains the remaining elements.

For this cut to be a valid median cut, **the largest element in the left half must be less than or equal to the smallest element in the right half**. Since each array is already sorted on its own, we only need to check the cross boundaries:
1. `nums1[i - 1] <= nums2[j]` (`maxLeftA <= minRightB`)
2. `nums2[j - 1] <= nums1[i]` (`maxLeftB <= minRightA`)

We always binary search over the shorter array (`nums1`), between `0` and `m`:
- If `maxLeftA > minRightB`, we took too many large elements from `nums1` into the left half; we move the cut to the left (`right = i - 1`).
- If `maxLeftB > minRightA`, we took too few elements from `nums1` into the left half; we move the cut to the right (`left = i + 1`).
- When both conditions hold, we have found the correct cut: if the total length is odd, the median is the largest element of the left half (`Math.Max(maxLeftA, maxLeftB)`); if it is even, the median is the average of the largest element of the left half and the smallest element of the right half.

```csharp solution
public class Solution
{
    public double FindMedianSortedArrays(int[] nums1, int[] nums2)
    {
        // Always run the binary search on the shorter array.
        if (nums1.Length > nums2.Length)
        {
            return FindMedianSortedArrays(nums2, nums1);
        }

        int m = nums1.Length;
        int n = nums2.Length;
        int half = (m + n + 1) / 2;
        int left = 0;
        int right = m;

        while (left <= right)
        {
            int i = left + (right - left) / 2;
            int j = half - i;

            int maxLeftA = i == 0 ? int.MinValue : nums1[i - 1];
            int minRightA = i == m ? int.MaxValue : nums1[i];
            int maxLeftB = j == 0 ? int.MinValue : nums2[j - 1];
            int minRightB = j == n ? int.MaxValue : nums2[j];

            if (maxLeftA <= minRightB && maxLeftB <= minRightA)
            {
                if ((m + n) % 2 == 1)
                {
                    return Math.Max(maxLeftA, maxLeftB);
                }

                return ((double)Math.Max(maxLeftA, maxLeftB) + Math.Min(minRightA, minRightB)) / 2.0;
            }
            else if (maxLeftA > minRightB)
            {
                right = i - 1;
            }
            else
            {
                left = i + 1;
            }
        }

        return 0.0;
    }
}
```

```typescript solution
function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  if (nums1.length > nums2.length) {
    return findMedianSortedArrays(nums2, nums1);
  }

  const m = nums1.length;
  const n = nums2.length;
  const half = Math.floor((m + n + 1) / 2);
  let left = 0;
  let right = m;

  while (left <= right) {
    const i = Math.floor((left + right) / 2);
    const j = half - i;

    const maxLeftA = i === 0 ? -Infinity : nums1[i - 1];
    const minRightA = i === m ? Infinity : nums1[i];
    const maxLeftB = j === 0 ? -Infinity : nums2[j - 1];
    const minRightB = j === n ? Infinity : nums2[j];

    if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
      if ((m + n) % 2 === 1) {
        return Math.max(maxLeftA, maxLeftB);
      }

      return (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2;
    } else if (maxLeftA > minRightB) {
      right = i - 1;
    } else {
      left = i + 1;
    }
  }

  return 0;
}
```

### Complexity

- **Time:** O(log(min(m, n))). The binary search runs only over the cut positions of the shorter array, and the search range halves at every step.
- **Space:** O(1). Only a constant number of variables are used for the boundary indices and boundary values.
