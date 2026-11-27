---
title: Valid Sudoku
---
Determine whether a `9 x 9` Sudoku board (`board`) is valid. Only the **filled cells** need to be validated according to the following rules:

1. Each **row** must contain the digits `1-9` without repetition.
2. Each **column** must contain the digits `1-9` without repetition.
3. Each of the nine `3 x 3` **sub-boxes** must contain the digits `1-9` without repetition.

**Note:**
- Filled cells are shown with the characters `'1'`-`'9'`, and empty cells with the character `'.'`.
- A partially filled Sudoku board can be valid without necessarily being solvable. You only need to verify that the currently filled cells don't break the rules.

### Example 1

```text
Input:
board =
[["5","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Output:  true
Explanation: No row, column, or 3x3 sub-box contains a repeated digit.
```

### Example 2

```text
Input:
board =
[["8","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Output:  false
Explanation: The top-left 3x3 sub-box contains two '8's (the first column also contains two '8's).
```

### Constraints

- `board.length == 9`
- `board[i].length == 9`
- `board[i][j]` is a digit (`'1'`-`'9'`) or `'.'`.

## Hints

- Instead of scanning the board once for rows, once for columns, and once for sub-boxes, you can check all three in a single pass.
- For each row `r` (`0..8`), each column `c` (`0..8`), and each `3 x 3` sub-box `b` (`0..8`), keep the digits you've seen in a set (`HashSet`) or a bitmask.
- How do you compute which `3 x 3` sub-box (`0..8`) the cell at `(r, c)` falls into?
- With integer division, the formula `boxIndex = (r / 3) * 3 + (c / 3)` maps every `(r, c)` pair to the correct sub-box between `0` and `8`.

## Solution

Visit every cell `(r, c)` on the board with a single nested loop. Skip empty cells (`'.'`). When you see a filled cell, you need to answer three questions at once:

1. Has this digit already appeared in row `r`?
2. Has this digit already appeared in column `c`?
3. Has this digit already appeared in the `3 x 3` sub-box it belongs to?

To do this, keep the sets (or bitmasks) `rows[9]`, `cols[9]` and `boxes[9]`, representing the 9 rows, 9 columns and 9 sub-boxes. The sub-box index of cell `(r, c)` is computed with integer division as `(r / 3) * 3 + (c / 3)`:
- Boxes in the top band (`r = 0..2`) get indices `0, 1, 2`,
- Boxes in the middle band (`r = 3..5`) get indices `3, 4, 5`,
- Boxes in the bottom band (`r = 6..8`) get indices `6, 7, 8`.

If the digit is already in any of these three sets, return `false`; otherwise add it to all three sets and continue.

```csharp solution
public class Solution
{
    public bool IsValidSudoku(char[][] board)
    {
        HashSet<char>[] rows = new HashSet<char>[9];
        HashSet<char>[] cols = new HashSet<char>[9];
        HashSet<char>[] boxes = new HashSet<char>[9];

        for (int i = 0; i < 9; i++)
        {
            rows[i] = new HashSet<char>();
            cols[i] = new HashSet<char>();
            boxes[i] = new HashSet<char>();
        }

        for (int r = 0; r < 9; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                char val = board[r][c];
                if (val == '.')
                    continue;

                int boxIdx = (r / 3) * 3 + (c / 3);

                if (!rows[r].Add(val) || !cols[c].Add(val) || !boxes[boxIdx].Add(val))
                    return false;
            }
        }

        return true;
    }
}
```

```typescript solution
function isValidSudoku(board: string[][]): boolean {
  const rows = Array.from({ length: 9 }, () => new Set<string>());
  const cols = Array.from({ length: 9 }, () => new Set<string>());
  const boxes = Array.from({ length: 9 }, () => new Set<string>());

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === ".") continue;

      const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);

      if (rows[r].has(val) || cols[c].has(val) || boxes[boxIdx].has(val)) {
        return false;
      }

      rows[r].add(val);
      cols[c].add(val);
      boxes[boxIdx].add(val);
    }
  }

  return true;
}
```

### Complexity

- **Time:** O(1) (or O(N²) for a general `N x N` board). The board always has `9 x 9 = 81` cells, so it runs for at most 81 steps.
- **Space:** O(1) (O(N²) in the general case). The sets hold at most `3 x 81` elements in total.
