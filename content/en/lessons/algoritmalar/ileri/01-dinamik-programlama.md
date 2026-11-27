---
title: Dynamic Programming
summary: The technique of solving overlapping subproblems once and storing the results. How to recognize a problem as DP, define the state and the transition, and write it top-down and bottom-up.
---

Dynamic programming (DP) is intimidating because the solutions look like magic at first glance. In fact, the method is mechanical: write the brute-force recursion, notice that **the same subproblem is solved over and over**, and store the results.

## When DP works

Two conditions must hold together:

1. **Optimal substructure.** The answer to the problem can be built from the answers to smaller subproblems.
2. **Overlapping subproblems.** The same subproblem comes up more than once.

If the second condition is missing (e.g. merge sort), it's divide and conquer; storing results doesn't help.

Clues in the problem statement: "how many **distinct ways** are there", "what is the **minimum / maximum** number of…", "**is it** possible", and having to make a **choice** at each step. The input size is also a clue: if `n` is a few thousand, an O(n²) DP is likely expected.

## The five-step method

Take the staircase example: in how many distinct ways can you climb a staircase with `n` steps if each move climbs either 1 or 2 steps?

**1. Define the state.** `ways(i)`: the number of ways to reach step `i`. Being able to define the state **in words, in a single sentence** is half the job.

**2. Write the transition.** You reach step `i` either from `i-1` or from `i-2`:
`ways(i) = ways(i-1) + ways(i-2)`

**3. Identify the base cases.** `ways(0) = 1` (not climbing at all is one way), `ways(1) = 1`.

**4. Choose the evaluation order.** From smallest to largest.

**5. State where the answer is.** `ways(n)`.

### Top-down: recursion + memoization

Write the brute-force recursion, then store the results in a table. This is the easiest form to reason about.

```typescript
function climbStairs(n: number, memo = new Map<number, number>()): number {
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n)!;

  const result = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, result);
  return result;
}
```

Without memoization the solution is O(2ⁿ); with it, each subproblem is solved once, so it drops to O(n).

### Bottom-up: filling a table

The same transition is written as a loop, starting from the base cases. It doesn't use the recursion stack.

```csharp
int ClimbStairs(int n)
{
    var ways = new int[n + 1];
    ways[0] = 1;
    if (n >= 1) ways[1] = 1;

    for (var i = 2; i <= n; i++)
    {
        ways[i] = ways[i - 1] + ways[i - 2];
    }

    return ways[n];
}
```

**Space optimization:** If the transition only looks at the last two values, you don't need to keep the whole table; two variables are enough and space drops to O(1). In an interview, solve it with the table first, then **mention** this optimization.

## How to compute the complexity

**Time = number of states × cost of the transition per state.** For the staircase there are `n` states and a constant-time transition: O(n). Space is the number of stored states.

## Typical patterns

### One-dimensional: take it or skip it

**House robber:** Given a row of houses, how much money can you collect without robbing two adjacent houses?

- State: `best(i)` = the largest amount you can get from the first `i` houses.
- Transition: you either skip house `i` (`best(i-1)`) or rob it and skip the previous one (`best(i-2) + money[i]`).

```typescript
function rob(nums: number[]): number {
  let previous = 0;   // best(i-2)
  let current = 0;    // best(i-1)

  for (const money of nums) {
    [previous, current] = [current, Math.max(current, previous + money)];
  }

  return current;
}
```

### Unlimited choice: coin change

What is the **minimum** number of coins needed to make up `amount` with the given coin denominations?

- State: `fewest(a)` = the minimum number of coins needed for amount `a`.
- Transition: if the last coin used is `c`, then `fewest(a) = 1 + fewest(a - c)`; take the minimum over all `c`.
- Base case: `fewest(0) = 0`. Use an "infinity" value for unreachable amounts.

```csharp
int CoinChange(int[] coins, int amount)
{
    var fewest = new int[amount + 1];
    Array.Fill(fewest, int.MaxValue);
    fewest[0] = 0;

    for (var a = 1; a <= amount; a++)
    {
        foreach (var coin in coins)
        {
            if (coin <= a && fewest[a - coin] != int.MaxValue)
            {
                fewest[a] = Math.Min(fewest[a], fewest[a - coin] + 1);
            }
        }
    }

    return fewest[amount] == int.MaxValue ? -1 : fewest[amount];
}
```

Complexity: O(amount × number of coin types). The **greedy** approach (always take the largest coin) is wrong here: with coins `[1, 3, 4]` and amount `6`, greedy finds `4+1+1` (3 coins), while the correct answer is `3+3` (2 coins). If you propose a greedy solution, you must be able to argue why it's correct; if you're not sure, DP is the safe path.

### Over two sequences: grid DP

In problems involving two strings or a two-dimensional grid, the state has two indices. **Longest common subsequence** (LCS):

- State: `lcs(i, j)` = the length of the longest common subsequence of the first `i` characters of `a` and the first `j` characters of `b`.
- Transition: if the last characters are equal, `lcs(i-1, j-1) + 1`; otherwise `max(lcs(i-1, j), lcs(i, j-1))`.

The table is `(n+1) × (m+1)`; time and space are O(n·m). Edit distance, number of paths in a grid, and longest palindromic subsequence belong to the same family.

### Longest increasing subsequence (LIS)

- State: `lis(i)` = the length of the longest increasing subsequence **ending** at element `i`.
- Transition: `lis(i) = 1 + max(lis(j))`, over all `j` with `j < i` and `nums[j] < nums[i]`.

This is O(n²). Notice that the state is defined as "**ending** at `i`": the answer is not `lis(n-1)` but the maximum of all `lis(i)`. Defining the state correctly often requires this kind of "fix the end" trick.

## When you're stuck

1. **Write the brute-force recursion first.** Its parameters are your state.
2. What are the recursion's parameters? Is it called again with the same parameters? If so, store the results.
3. If you can't define the state in words, you can't write the transition either. Change the definition: "the first `i` elements", "ending at `i`", "starting at `i`", "with remaining capacity `c`".
4. Fill in the table **by hand** for a small example. The pattern usually shows up there.

## Summary

- DP = recursion + storing the results of overlapping subproblems.
- The method: state, transition, base cases, order, where the answer is.
- Time = number of states × transition cost.
- Top-down is easier to reason about; bottom-up doesn't use the stack and lends itself to space optimization.
- If you're not sure about a greedy solution, verify it with DP.
