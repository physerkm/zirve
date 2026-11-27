---
title: Surrounded Regions
---
You are given an `m x n` board `board` made of the characters `'X'` and `'O'`. `'O'` cells connected in four directions form a **region**. A region is **surrounded** if it does not touch the edge and is completely enclosed by `'X'` cells.

Turn the `'O'` cells in every surrounded region into `'X'`. The board must be modified in place and returned so that the tests can see the result.

### Example 1

```text
Input:  board = [["X","X","X","X"],
                 ["X","O","O","X"],
                 ["X","X","O","X"],
                 ["X","O","X","X"]]
Output: [["X","X","X","X"],
         ["X","X","X","X"],
         ["X","X","X","X"],
         ["X","O","X","X"]]
Explanation: The O in the bottom row is on the edge, so it is not surrounded.
```

### Example 2

```text
Input:  board = [["X"]]
Output: [["X"]]
```

### Constraints

- `1 <= m, n <= 200`
- `board[i][j]` is `'X'` or `'O'`.

## Hints

- Which `'O'` cells **survive**? The ones connected to the edge.
- Start a DFS from every `'O'` on the edge and temporarily mark all the connected `'O'`s (e.g. as `'S'`).
- Then walk the board: unmarked `'O'`s are surrounded and become `'X'`; marked ones turn back into `'O'`.

## Solution

### Rescuing from the edge

An `'O'` region survives only if it touches the edge. So instead of looking for surrounded regions, we find the **survivors**:

1. Start a DFS from every `'O'` on the edge; mark every `'O'` cell it reaches as `'S'` (safe).
2. Walk the board: the remaining `'O'`s could not reach the edge, so they become `'X'`. The `'S'`s turn back into `'O'`.

```csharp solution
public class Solution
{
    public char[][] Solve(char[][] board)
    {
        var rows = board.Length;
        var cols = board[0].Length;

        void Mark(int r, int c)
        {
            if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] != 'O')
            {
                return;
            }

            board[r][c] = 'S';
            Mark(r + 1, c);
            Mark(r - 1, c);
            Mark(r, c + 1);
            Mark(r, c - 1);
        }

        for (var r = 0; r < rows; r++)
        {
            Mark(r, 0);
            Mark(r, cols - 1);
        }

        for (var c = 0; c < cols; c++)
        {
            Mark(0, c);
            Mark(rows - 1, c);
        }

        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                board[r][c] = board[r][c] == 'S' ? 'O' : 'X';
            }
        }

        return board;
    }
}
```

```typescript solution
function solve(board: string[][]): string[][] {
  const rows = board.length;
  const cols = board[0].length;

  const mark = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== 'O') return;
    board[r][c] = 'S';
    mark(r + 1, c);
    mark(r - 1, c);
    mark(r, c + 1);
    mark(r, c - 1);
  };

  for (let r = 0; r < rows; r++) {
    mark(r, 0);
    mark(r, cols - 1);
  }

  for (let c = 0; c < cols; c++) {
    mark(0, c);
    mark(rows - 1, c);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board[r][c] = board[r][c] === 'S' ? 'O' : 'X';
    }
  }

  return board;
}
```

### Complexity

- **Time:** O(m × n). Each cell is marked at most once in the DFS and read once in the final pass.
- **Space:** O(m × n) recursion depth in the worst case. On very large boards, you can use BFS to avoid a stack overflow.
