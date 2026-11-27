---
title: Integer to English Words
---
You are given a non-negative integer `num`. Return the number written out in English words. Words are separated by a single space and each word starts with a capital letter; `"and"` and hyphens are not used.

### Example 1

```text
Input:  num = 123
Output:  "One Hundred Twenty Three"
```

### Example 2

```text
Input:  num = 12345
Output:  "Twelve Thousand Three Hundred Forty Five"
```

### Example 3

```text
Input:  num = 1234567
Output:  "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"
```

### Constraints

- `0 <= num <= 2^31 - 1`

## Hints

- In English, numbers are read in groups of three: billions, millions, thousands and the rest.
- First write a helper function that converts a number between 0 and 999 into words.
- Numbers below 20 have special names (`Eleven`, `Twelve`, …, `Nineteen`). Don't forget to skip groups that are zero and to return `"Zero"` for `0`.

## Solution

### Groups of three

The number is split into groups of three digits from the right, and each group is written with the `Three(n)` helper (0-999); the scale word (`Billion`, `Million`, `Thousand`) is added after the group. Groups whose value is `0` are skipped entirely: `1000010` → `"One Million Ten"`.

`Three(n)` works like this:

- If `n >= 100`, write `Ones[n / 100] + " Hundred"`, then handle the remainder `n % 100`.
- If the remainder is `< 20`, write its special name directly (the `Ones` table covers 0-19).
- Otherwise, write the name of the tens digit (`Tens[n / 10]`) and, if it isn't zero, the ones digit.

The pieces are collected in a list and joined with single spaces, so no extra spaces appear.

```csharp solution
public class Solution
{
    private static readonly string[] Ones =
    {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    };

    private static readonly string[] Tens =
    {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    };

    public string NumberToWords(int num)
    {
        if (num == 0)
        {
            return "Zero";
        }

        var words = new List<string>();
        (int Value, string Name)[] scales = { (1_000_000_000, "Billion"), (1_000_000, "Million"), (1_000, "Thousand"), (1, "") };

        foreach (var (value, name) in scales)
        {
            var group = num / value;
            if (group == 0)
            {
                continue;
            }

            Three(group, words);
            if (name.Length > 0)
            {
                words.Add(name);
            }

            num %= value;
        }

        return string.Join(" ", words);
    }

    private static void Three(int n, List<string> words)
    {
        if (n >= 100)
        {
            words.Add(Ones[n / 100]);
            words.Add("Hundred");
            n %= 100;
        }

        if (n >= 20)
        {
            words.Add(Tens[n / 10]);
            n %= 10;
        }

        if (n > 0)
        {
            words.Add(Ones[n]);
        }
    }
}
```

```typescript solution
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const words: string[] = [];
  const three = (n: number): void => {
    if (n >= 100) {
      words.push(ONES[Math.floor(n / 100)], 'Hundred');
      n %= 100;
    }
    if (n >= 20) {
      words.push(TENS[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) words.push(ONES[n]);
  };

  const scales: [number, string][] = [[1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1_000, 'Thousand'], [1, '']];
  for (const [value, name] of scales) {
    const group = Math.floor(num / value);
    if (group === 0) continue;
    three(group);
    if (name) words.push(name);
    num %= value;
  }

  return words.join(' ');
}
```

### Complexity

- **Time:** O(1). The number has at most 10 digits; four groups are processed.
- **Space:** O(1).

This problem tests **edge cases** more than the algorithm: `0`, numbers from 10 to 19, zero groups (`1000000`), and zeros inside a group (`105`, `1010`). Listing them up front in an interview is a good signal.
