---
title: Rotate Image
---
You are given an `n x n` 2D `matrix` representing an image. Rotate the image **90 degrees** clockwise (to the right) and return the rotated matrix.

You must do the rotation **in place**; that is, you must not create another 2D matrix and copy the elements into it.

### Example 1

```text
Input:  matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output:  [[7,4,1],[8,5,2],[9,6,3]]
Explanation: The first row [1,2,3] becomes the last column; the last row [7,8,9] becomes the first column.
```

### Example 2

```text
Input:  matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output:  [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
```

### Constraints

- `n == matrix.length == matrix[i].length`
- `1 <= n <= 20`
- `-1000 <= matrix[i][j] <= 1000`

## Hints

- When you rotate a matrix 90° clockwise, the element at position `(r, c)` moves to position `(c, n - 1 - r)`.
- Tracking indices with four-way cycles is error-prone. Can we split the transformation into two simple symmetry operations instead?
- First **transpose** the matrix (swap `matrix[r][c]` with `matrix[c][r]`): this moves element `(r, c)` to position `(c, r)`.
- Then **reverse** each row in place: position `(c, r)` becomes `(c, n - 1 - r)`, and the 90° clockwise rotation is complete!

## Solution

The cleanest, least error-prone way to rotate a square matrix 90° clockwise in place is to split the work into two basic matrix operations:

1. **Transpose (reflection across the main diagonal):** We swap each element `matrix[i][j]` in the upper triangle (`j > i`) with the element `matrix[j][i]` in the lower triangle. This turns rows into columns and columns into rows (`(i, j) -> (j, i)`).
2. **Reverse the rows (horizontal reflection):** We reverse each row with two pointers moving from the left and right ends toward the middle (or with `Array.Reverse`). The element at position `(j, i)` then lands at `(j, n - 1 - i)`, which is exactly its position after a 90° clockwise rotation.

Both steps only `swap` two cells at a time, so no extra matrix memory is used.

```csharp solution
public class Solution
{
    public int[][] Rotate(int[][] matrix)
    {
        int n = matrix.Length;

        // Step 1: Transpose the matrix (turn rows into columns).
        for (int i = 0; i < n; i++)
        {
            for (int j = i + 1; j < n; j++)
            {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }

        // Step 2: Reverse each row in place.
        for (int i = 0; i < n; i++)
        {
            Array.Reverse(matrix[i]);
        }

        return matrix;
    }
}
```

```typescript solution
function rotate(matrix: number[][]): number[][] {
  const n = matrix.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const temp = matrix[i][j];
      matrix[i][j] = matrix[j][i];
      matrix[j][i] = temp;
    }
  }

  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }

  return matrix;
}
```

### Complexity

- **Time:** O(n²). Each of the `n x n` cells in the matrix is accessed a constant number of times.
- **Space:** O(1). All swaps are done in place on the matrix itself.
