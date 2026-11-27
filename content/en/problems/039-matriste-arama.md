---
title: Search a 2D Matrix
---
You are given an `m x n` integer matrix `matrix` with these two properties:

- Each row is sorted in **increasing** order from left to right.
- The first element of each row is **greater** than the last element of the previous row.

Return `true` if `target` is in the matrix, or `false` otherwise.

Your solution must run in **O(log(m · n))** time.

### Example 1

```text
Input:  matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3
Output: true
```

### Example 2

```text
Input:  matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13
Output: false
```

### Constraints

- `1 <= m, n <= 100`
- `-10^4 <= matrix[i][j], target <= 10^4`

## Hints

- What do you get if you put the rows end to end? Together, the two properties tell you the result is a single array sorted from start to end.
- To search a sorted array, you use binary search. You don't need to actually build the array.
- Which row and column of the matrix holds element `k` of the virtual `m · n`-element array? Think about division and remainder.

## Solution

Each row is sorted, and each row starts with a value greater than where the previous one ended. So if we put the rows end to end, we get a **single sorted array** of `m · n` elements. And on a sorted array, we use binary search.

We don't actually build the array; we only convert indices. Element `mid` of the virtual array is located in the matrix at:

- row: `mid / cols` (how many full rows were passed)
- column: `mid % cols` (its position within that row)

The rest is the familiar binary search: if the middle value is the target, we found it; if it is smaller than the target, we discard the left half; if it is larger, the right half.

```csharp solution
public class Solution
{
    public bool SearchMatrix(int[][] matrix, int target)
    {
        int rows = matrix.Length;
        int cols = matrix[0].Length;

        // Treat the matrix as a single sorted array of rows * cols elements.
        int left = 0;
        int right = rows * cols - 1;

        while (left <= right)
        {
            int mid = left + (right - left) / 2;
            int value = matrix[mid / cols][mid % cols];

            if (value == target)
                return true;

            if (value < target)
                left = mid + 1;
            else
                right = mid - 1;
        }

        return false;
    }
}
```

```typescript solution
function searchMatrix(matrix: number[][], target: number): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;

  let left = 0;
  let right = rows * cols - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const value = matrix[Math.floor(mid / cols)][mid % cols];

    if (value === target) return true;

    if (value < target) left = mid + 1;
    else right = mid - 1;
  }

  return false;
}
```

### Complexity

- **Time:** O(log(m · n)). The search range halves at every step.
- **Space:** O(1).

**Alternative:** First finding the right row with a binary search on the first column, then finding the target with a binary search in that row, has the same complexity (log m + log n = log(m · n)), but you have to write two separate searches. Treating it as a single array is shorter and less error-prone.

Writing `left + (right - left) / 2` instead of `(left + right) / 2` when computing `mid` is a habit that prevents the sum from overflowing with large indices.
