---
title: Word Search
---
You are given an `m x n` grid of characters (`board`) and a string (`word`). Return `true` if `word` exists in the grid, and `false` otherwise.

The word must be built from letters of sequentially adjacent cells, where adjacent cells are horizontal or vertical neighbors (up, down, left, right). **The same letter cell may not be used more than once in a single word.**

### Example 1

```text
Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Output: true
Explanation: The path (0,0) -> (0,1) -> (0,2) -> (1,2) -> (2,2) -> (2,1) spells "ABCCED".
```

### Example 2

```text
Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Output: true
Explanation: The path (1,3) -> (2,3) -> (2,2) spells "SEE".
```

### Example 3

```text
Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"
Output: false
Explanation: The letter 'B' at (0,1) cannot be used a second time on the same path.
```

### Constraints

- `m == board.length`
- `n == board[i].length`
- `1 <= m, n <= 6`
- `1 <= word.length <= 15`
- `board` and `word` consist only of uppercase and lowercase English letters.

## Hints

- Try every cell `(r, c)` in the grid as a possible starting point for the first letter of the word (`word[0]`).
- From the current cell, run a depth-first search (DFS) in the 4 neighboring directions (up, down, left, right) to try to match the letter `word[k]`.
- To avoid stepping on the same cell twice on your own path, temporarily mark the cell with a special character (for example `'#'`) when you enter it.
- When the search of the neighboring branches is done (on the way back), always restore the cell's original letter (backtracking).

## Solution

We call the recursive function `Dfs(r, c, k)` starting from every cell `(r, c)` in the grid. Here `k` is the index of the next character we are looking for in `word`.

1. **Success case:** If `k == word.Length`, all characters of the word have been matched in order; return `true`.
2. **Bounds and match check:** If the coordinate `(r, c)` is outside the grid or `board[r][c] != word[k]`, this path is invalid; return `false` (if `board[r][c]` was visited earlier and set to `'#'`, it is also ruled out automatically by this check).
3. **Marking visits and backtracking:** Instead of allocating an extra `visited` matrix, we save the current cell's character with `char saved = board[r][c]` and mark it as `board[r][c] = '#'`. Then we call `Dfs(..., k + 1)` for the 4 neighboring cells. If any branch returns `true`, the word has been found. Before leaving the function, we restore the grid with `board[r][c] = saved` so that other starting points or other branches can use this cell.

```csharp solution
public class Solution
{
    public bool Exist(char[][] board, string word)
    {
        int rows = board.Length;
        int cols = board[0].Length;

        bool Dfs(int r, int c, int k)
        {
            if (k == word.Length)
                return true;

            if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] != word[k])
                return false;

            // Mark the cell temporarily so it is not used again.
            char saved = board[r][c];
            board[r][c] = '#';

            bool found = Dfs(r + 1, c, k + 1)
                      || Dfs(r - 1, c, k + 1)
                      || Dfs(r, c + 1, k + 1)
                      || Dfs(r, c - 1, k + 1);

            // Backtrack: restore the cell's original letter.
            board[r][c] = saved;
            return found;
        }

        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (Dfs(r, c, 0))
                    return true;
            }
        }

        return false;
    }
}
```

```typescript solution
function exist(board: string[][], word: string): boolean {
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r: number, c: number, k: number): boolean {
    if (k === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[k]) {
      return false;
    }

    const saved = board[r][c];
    board[r][c] = "#";

    const found =
      dfs(r + 1, c, k + 1) ||
      dfs(r - 1, c, k + 1) ||
      dfs(r, c + 1, k + 1) ||
      dfs(r, c - 1, k + 1);

    board[r][c] = saved;
    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }

  return false;
}
```

### Complexity

- **Time:** O(M * N * 4^L), where `M` and `N` are the dimensions of the grid and `L` is the length of `word`. The DFS from each cell goes at most `L` deep and branches in at most 4 directions at each step (3 after the first step, since the direction it came from is excluded).
- **Space:** O(L). Since the grid is marked in place (`in-place`), no extra matrix is used; only the recursion call stack takes up space proportional to the word length `L`.
