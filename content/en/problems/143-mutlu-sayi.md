---
title: Happy Number
---
Write an algorithm to determine whether a number `n` is a **happy number**.

A **happy number** is defined by the following process:
- Start with any positive integer,
- Replace the number with the sum of the squares of its digits,
- Repeat the process until the number equals `1` (where it will stay) or it enters an **endless cycle** that does not include `1`,
- Numbers for which this process ends at `1` are **happy numbers**.

Return `true` if `n` is a happy number, and `false` otherwise.

### Example 1

```text
Input:  n = 19
Output:  true
Explanation:
1² + 9² = 82
8² + 2² = 68
6² + 8² = 100
1² + 0² + 0² = 1
```

### Example 2

```text
Input:  n = 2
Output:  false
Explanation: It enters a cycle that never reaches 1: 2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 ...
```

### Constraints

- `1 <= n <= 2^31 - 1`

## Hints

- The sum of the squared digits of a multi-digit number shrinks quickly (for example, even for `999,999,999` the sum is only `9 × 81 = 729`); so the sequence cannot grow forever.
- Since the number cannot keep growing, it either reaches `1` or comes back to a number it has seen before and enters a cycle.
- You can catch the cycle by keeping previously seen numbers in a `HashSet`; but how do you detect the cycle without extra memory?
- You can apply **Floyd's Tortoise and Hare** method (`slow` and `fast` pointers), used to find cycles in linked lists, here as well.

## Solution

We can think of moving from each number to the next one (`SumOfSquares(x)`) as advancing to the next node of a hidden linked list. Even for the largest `int` value, `2,147,483,647`, the sum of squared digits drops below `243` within a few steps. Since there are finitely many states, the chain either settles at `1` or enters a cycle.

If we use **Floyd's cycle detection algorithm** instead of keeping the seen numbers in a `HashSet`, **O(1)** extra memory is enough:
- The slow pointer (`slow`) applies `SumOfSquares` once per step, and the fast pointer (`fast`) applies it twice.
- If the chain reaches `1`, `fast` (or `slow`) becomes `1` and we return `true`.
- If the chain has a cycle other than `1`, the fast pointer catches up with the slow pointer inside the cycle (`slow == fast`) and we return `false`.

```csharp solution
public class Solution
{
    public bool IsHappy(int n)
    {
        int slow = n;
        int fast = SumOfSquares(n);

        // Advance until fast reaches 1 or the two pointers meet in a cycle.
        while (fast != 1 && slow != fast)
        {
            slow = SumOfSquares(slow);
            fast = SumOfSquares(SumOfSquares(fast));
        }

        return fast == 1;
    }

    private int SumOfSquares(int num)
    {
        int sum = 0;
        while (num > 0)
        {
            int digit = num % 10;
            sum += digit * digit;
            num /= 10;
        }
        return sum;
    }
}
```

```typescript solution
function isHappy(n: number): boolean {
  const sumOfSquares = (num: number): number => {
    let sum = 0;
    while (num > 0) {
      const digit = num % 10;
      sum += digit * digit;
      num = Math.floor(num / 10);
    }
    return sum;
  };

  let slow = n;
  let fast = sumOfSquares(n);

  while (fast !== 1 && slow !== fast) {
    slow = sumOfSquares(slow);
    fast = sumOfSquares(sumOfSquares(fast));
  }

  return fast === 1;
}
```

### Complexity

- **Time:** O(log n). Computing the sum of a number's squared digits takes as many steps as it has digits, i.e., O(log n); after the first step the values are at most 730 and drop below 243 within a few steps, so the loop ends within a constant number of steps.
- **Space:** O(1). Only the `slow` and `fast` variables are used instead of a `HashSet`.
