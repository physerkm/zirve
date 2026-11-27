---
title: Set Matrix Zeroes
---
You are given an `m x n` integer matrix `matrix`. If a cell's value is `0`, set its **entire row** and **entire column** to `0`, and return the updated matrix.

You must do this **in place**, that is, using **O(1)** extra memory.

### Example 1

```text
Input:  matrix = [[1,1,1],[1,0,1],[1,1,1]]
Output:  [[1,0,1],[0,0,0],[1,0,1]]
Explanation: Because of the 0 at position (1, 1), row 1 and column 1 are set entirely to 0.
```

### Example 2

```text
Input:  matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
Output:  [[0,0,0,0],[0,4,5,0],[0,3,1,0]]
Explanation: Since cells (0, 0) and (0, 3) in the first row are 0, row 0 and columns 0 and 3 are set entirely to 0.
```

### Constraints

- `m == matrix.length`
- `n == matrix[0].length`
- `1 <= m, n <= 200`
- `-2^31 <= matrix[i][j] <= 2^31 - 1`

## Hints

- If you zero out a row and column immediately for every `0` you see while walking the matrix, you can no longer tell the cells you zeroed later from the original zeros.
- Keeping track of which rows and columns to zero out in two separate arrays (`bool[m]` and `bool[n]`) uses O(m + n) extra space.
- Instead of allocating extra arrays, can you store these flags in the matrix's own **first row** and **first column**?
- If the cell `matrix[0][0]` tries to represent both the first row and the first column, they collide; keep whether the first row must be zeroed in a single `firstRowZero` variable.

## Solution

Instead of allocating extra arrays to remember which rows and columns must be zeroed, we use **row 0** of the matrix as the column flags and **column 0** as the row flags:

1. **Mark the flags:** We scan every cell `(r, c)` in the matrix. If `matrix[r][c] == 0`:
   - We set `matrix[0][c] = 0` to mark that column `c` must be zeroed.
   - If `r > 0`, we set `matrix[r][0] = 0` to mark that row `r` must be zeroed; if `r == 0`, we record that the first row must be zeroed in the variable `firstRowZero = true`. This way `matrix[0][0]` is only the flag for column 0.
2. **Zero the inner cells:** We walk the cells in the ranges `r = 1..m-1` and `c = 1..n-1`. If the row flag (`matrix[r][0] == 0`) or the column flag (`matrix[0][c] == 0`) is zero, we set `matrix[r][c] = 0`. (We don't touch the first row and column yet, so the flags stay intact.)
3. **Zero the first column and first row:** First, if `matrix[0][0] == 0`, we zero column 0; then, if `firstRowZero == true`, we zero row 0.

```csharp solution
public class Solution
{
    public int[][] SetZeroes(int[][] matrix)
    {
        int rows = matrix.Length;
        int cols = matrix[0].Length;
        bool firstRowZero = false;

        // Step 1: Mark the row and column heads of the zero cells.
        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (matrix[r][c] == 0)
                {
                    matrix[0][c] = 0;
                    if (r > 0)
                        matrix[r][0] = 0;
                    else
                        firstRowZero = true;
                }
            }
        }

        // Step 2: Zero the inner cells (excluding the first row and column) based on the flags.
        for (int r = 1; r < rows; r++)
        {
            for (int c = 1; c < cols; c++)
            {
                if (matrix[r][0] == 0 || matrix[0][c] == 0)
                    matrix[r][c] = 0;
            }
        }

        // Step 3: Zero the first column if needed.
        if (matrix[0][0] == 0)
        {
            for (int r = 0; r < rows; r++)
                matrix[r][0] = 0;
        }

        // Step 4: Zero the first row if needed.
        if (firstRowZero)
        {
            for (int c = 0; c < cols; c++)
                matrix[0][c] = 0;
        }

        return matrix;
    }
}
```

```typescript solution
function setZeroes(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let firstRowZero = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[0][c] = 0;
        if (r > 0) {
          matrix[r][0] = 0;
        } else {
          firstRowZero = true;
        }
      }
    }
  }

  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
  }

  if (matrix[0][0] === 0) {
    for (let r = 0; r < rows; r++) {
      matrix[r][0] = 0;
    }
  }

  if (firstRowZero) {
    for (let c = 0; c < cols; c++) {
      matrix[0][c] = 0;
    }
  }

  return matrix;
}
```

### Complexity

- **Time:** O(m · n). The matrix is scanned a constant number of times (at most two full passes plus the edge passes).
- **Space:** O(1). Since the flags are kept in the matrix's own first row and column, only the `firstRowZero` variable is used.
