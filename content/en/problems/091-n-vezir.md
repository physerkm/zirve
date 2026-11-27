---
title: N-Queens
---
The **n-queens** puzzle is the problem of placing `n` queens on an `n x n` chessboard so that no two queens attack each other. In chess, a queen attacks any other piece in the same row, the same column, or the same diagonal.

Given an integer `n`, return **all distinct solutions to the n-queens puzzle**. You may return the answer in any order.

Each solution is the list of rows of an `n x n` chessboard, where `'Q'` marks a queen and `'.'` marks an empty square.

### Example 1

```text
Input:  n = 4
Output: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]
Explanation: There are 2 distinct valid arrangements for the 4-queens puzzle, shown above.
```

### Example 2

```text
Input:  n = 1
Output: [["Q"]]
Explanation: On a 1x1 board, the queen goes on the only square.
```

### Constraints

- `1 <= n <= 9`

## Hints

- Since two queens cannot share a row, try placing the queens row by row (exactly one queen in each row from `0` to `n - 1`).
- Before you put a queen on square `(r, c)`, you need to check whether a queen has already been placed in that column or on either of its two diagonals.
- On the positive diagonal running from top right to bottom left, the sum `r + c` is constant for every square; on the negative diagonal running from top left to bottom right, the difference `r - c` is constant for every square.
- By keeping the occupied columns (`c`), positive diagonals (`r + c`), and negative diagonals (`r - c`) in sets (`HashSet`), you can check for conflicts in O(1) time.

## Solution

Every row must contain exactly one queen. This observation lets us build a **backtracking** algorithm that runs the search row by row (`r = 0, 1, …, n - 1`).

In row `r`, we try every column `c` from `0` to `n - 1`. We don't need to scan the board again to tell whether square `(r, c)` is safe:
- Squares in the same column share the same `c` value.
- Squares on the diagonal going from top right to bottom left share the same sum `r + c`.
- Squares on the diagonal going from top left to bottom right share the same difference `r - c`.

Using three separate sets (`cols`, `posDiag`, `negDiag`), we check in **O(1)** time whether square `(r, c)` is under attack. If the square is safe, we place the queen, add the corresponding `c`, `r + c`, and `r - c` values to the sets, and move on to row `r + 1`. When we return from the child call, we remove the queen and take the values out of the sets (backtracking), then try the next column. When `r == n`, all queens have been placed successfully, and we add the current board to the result.

```csharp solution
public class Solution
{
    public IList<IList<string>> SolveNQueens(int n)
    {
        var result = new List<IList<string>>();
        var cols = new HashSet<int>();
        var posDiag = new HashSet<int>(); // r + c
        var negDiag = new HashSet<int>(); // r - c

        var board = new char[n][];
        for (int i = 0; i < n; i++)
        {
            board[i] = new char[n];
            Array.Fill(board[i], '.');
        }

        void Backtrack(int r)
        {
            if (r == n)
            {
                var copy = new List<string>(n);
                for (int i = 0; i < n; i++)
                    copy.Add(new string(board[i]));
                result.Add(copy);
                return;
            }

            for (int c = 0; c < n; c++)
            {
                if (cols.Contains(c) || posDiag.Contains(r + c) || negDiag.Contains(r - c))
                    continue;

                cols.Add(c);
                posDiag.Add(r + c);
                negDiag.Add(r - c);
                board[r][c] = 'Q';

                Backtrack(r + 1);

                cols.Remove(c);
                posDiag.Remove(r + c);
                negDiag.Remove(r - c);
                board[r][c] = '.';
            }
        }

        Backtrack(0);
        return result;
    }
}
```

```typescript solution
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const cols = new Set<number>();
  const posDiag = new Set<number>(); // r + c
  const negDiag = new Set<number>(); // r - c

  const board: string[][] = Array.from({ length: n }, () => Array(n).fill("."));

  function backtrack(r: number): void {
    if (r === n) {
      result.push(board.map((row) => row.join("")));
      return;
    }

    for (let c = 0; c < n; c++) {
      if (cols.has(c) || posDiag.has(r + c) || negDiag.has(r - c)) {
        continue;
      }

      cols.add(c);
      posDiag.add(r + c);
      negDiag.add(r - c);
      board[r][c] = "Q";

      backtrack(r + 1);

      cols.delete(c);
      posDiag.delete(r + c);
      negDiag.delete(r - c);
      board[r][c] = ".";
    }
  }

  backtrack(0);
  return result;
}
```

### Complexity

- **Time:** O(n!). There are at most `n` valid column choices in the first row, at most `n - 1` in the second, and at most `n - 2` in the third; in practice, the diagonal constraints prune the search tree much earlier. The conflict check for each square takes O(1).
- **Space:** O(n²). An `n x n` matrix holds the board state, and the recursion stack and the sets use O(n) memory.
