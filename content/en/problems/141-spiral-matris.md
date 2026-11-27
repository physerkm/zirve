---
title: Spiral Matrix
---
You are given an `m x n` `matrix`. Return a list containing all the elements of the matrix in clockwise **spiral order**, starting from the top-left corner.

### Example 1

```text
Input:  matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output:  [1,2,3,6,9,8,7,4,5]
Explanation: Go clockwise around the outer frame (1->2->3->6->9->8->7->4) and finish with the 5 in the center.
```

### Example 2

```text
Input:  matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output:  [1,2,3,4,8,12,11,10,9,5,6,7]
```

### Constraints

- `m == matrix.length`
- `n == matrix[i].length`
- `1 <= m, n <= 10`
- `-100 <= matrix[i][j] <= 100`

## Hints

- Picture four walls bounding the unvisited region: `top` (top row), `bottom` (bottom row), `left` (left column) and `right` (right column).
- In each round, in order: walk the top row from left to right, the right column from top to bottom, the bottom row from right to left, and the left column from bottom to top.
- After fully walking an edge, move that wall one step inward (`top++`, `right--`, `bottom--`, `left++`).
- When a strip of a single row or a single column remains, don't forget to check `top <= bottom` before walking the bottom row and `left <= right` before walking the left column, so you don't read the same cells again in reverse.

## Solution

The clearest way to simulate the spiral movement over the matrix is to track the not-yet-visited rectangular region with four boundary variables:
- `top = 0`, `bottom = m - 1`
- `left = 0`, `right = n - 1`

As long as `top <= bottom && left <= right` holds, we scan the four directions in order:
1. **Left to right (top edge):** We add every element in row `top` from `left` to `right` to the list and move the top boundary down (`top++`).
2. **Top to bottom (right edge):** We add every element in column `right` from `top` to `bottom` to the list and move the right boundary left (`right--`).
3. **Right to left (bottom edge):** If a valid row still remains after the top boundary moved down (`top <= bottom`), we walk row `bottom` from `right` to `left` and move the bottom boundary up (`bottom--`).
4. **Bottom to top (left edge):** If a valid column still remains after the right boundary moved left (`left <= right`), we walk column `left` from `bottom` to `top` and move the left boundary right (`left++`).

```csharp solution
public class Solution
{
    public IList<int> SpiralOrder(int[][] matrix)
    {
        List<int> result = new List<int>();
        int top = 0, bottom = matrix.Length - 1;
        int left = 0, right = matrix[0].Length - 1;

        while (top <= bottom && left <= right)
        {
            // 1. Walk the top row from left to right.
            for (int c = left; c <= right; c++)
                result.Add(matrix[top][c]);
            top++;

            // 2. Walk the right column from top to bottom.
            for (int r = top; r <= bottom; r++)
                result.Add(matrix[r][right]);
            right--;

            // 3. If a row remains, walk the bottom row from right to left.
            if (top <= bottom)
            {
                for (int c = right; c >= left; c--)
                    result.Add(matrix[bottom][c]);
                bottom--;
            }

            // 4. If a column remains, walk the left column from bottom to top.
            if (left <= right)
            {
                for (int r = bottom; r >= top; r--)
                    result.Add(matrix[r][left]);
                left++;
            }
        }

        return result;
    }
}
```

```typescript solution
function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = [];
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      result.push(matrix[top][c]);
    }
    top++;

    for (let r = top; r <= bottom; r++) {
      result.push(matrix[r][right]);
    }
    right--;

    if (top <= bottom) {
      for (let c = right; c >= left; c--) {
        result.push(matrix[bottom][c]);
      }
      bottom--;
    }

    if (left <= right) {
      for (let r = bottom; r >= top; r--) {
        result.push(matrix[r][left]);
      }
      left++;
    }
  }

  return result;
}
```

### Complexity

- **Time:** O(m · n). Each of the `m x n` elements in the matrix is visited exactly once.
- **Space:** O(1) extra space (apart from the output list `result`, only four boundary variables are used).
