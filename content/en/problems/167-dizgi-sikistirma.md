---
title: String Compression
---
You are given an array of characters `chars`. Compress it using the following algorithm:

Start with an empty string `s`. For **each group of consecutive repeating characters** in `chars`:
- If the group's length is `1`, append only the character to `s`.
- Otherwise, append the character followed by the group's length (group lengths of `10` or more are split into multiple digit characters such as `"1"`, `"2"`).

Instead of allocating a new array, write the compressed characters **in place** into the input array `chars`, using only **O(1)** extra memory. When writing is done, return the compressed first part of the `chars` array (`chars[..write]`).

### Example 1

```text
Input:  chars = ["a","a","b","b","c","c","c"]
Output:  ["a","2","b","2","c","3"]
Explanation: The consecutive groups are "aa", "bb" and "ccc". Compressed, they give "a2b2c3".
```

### Example 2

```text
Input:  chars = ["a"]
Output:  ["a"]
Explanation: The single-character group "a" stays ["a"], with no length appended.
```

### Example 3

```text
Input:  chars = ["a","b","b","b","b","b","b","b","b","b","b","b","b"]
Output:  ["a","b","1","2"]
Explanation: The groups are "a" and "bbbbbbbbbbbb", which contains 12 "b"s; the number 12 is split into two separate characters, "1" and "2".
```

### Constraints

- `1 <= chars.length <= 2000`
- `chars[i]` is a lowercase English letter, an uppercase English letter, a digit, or a symbol.

## Hints

- Use two pointers named `read` and `write` to both read from the array and write to it in place.
- The compressed output can never be longer than the original group (a group of length `1` becomes `1` character; a group of length `>= 2` replaces at least `2` characters with the character plus its digits). Thanks to this, the `write` pointer never passes the `read` pointer and never overwrites data that hasn't been read yet.
- Save the character at the start of a group, and keep incrementing `read` and `count` as long as the same character continues.
- When the group ends, first write the character at `chars[write++]`; if `count > 1`, write each digit character of `count.ToString()` in order at `chars[write++]`.

## Solution

To compress the array in place without extra memory, we use **two pointers** (`read` and `write`):
- `read` scans the next group of consecutive characters and counts how many times the character repeats.
- `write` points to where the compressed result should be written inside the `chars` array.

At each step, we take the current group's character with `current = chars[read]`. The inner `while` loop increments `read` and `count` by one as long as `chars[read] == current`. So when we reach the end of the group, `count` holds the group's length and `read` is positioned at the first element of the next group.

Then we first write the group's character with `chars[write++] = current`. If `count > 1`, we write the digits of the number one by one, from left to right, at `chars[write++]`.

The length of a compressed group is always less than or equal to the original group's length (`1 -> 1`, `2 -> 2`, `3 -> 2`, `12 -> 3`). So the inequality `write <= read` always holds, and no character that hasn't been read yet is overwritten.

```csharp solution
public class Solution
{
    public char[] Compress(char[] chars)
    {
        int write = 0;
        int read = 0;

        while (read < chars.Length)
        {
            char current = chars[read];
            int count = 0;

            // Count the length of the consecutive group of the same character.
            while (read < chars.Length && chars[read] == current)
            {
                read++;
                count++;
            }

            // Write the character itself first.
            chars[write++] = current;

            // If the length is greater than 1, write its digits in order.
            if (count > 1)
            {
                foreach (char digit in count.ToString())
                {
                    chars[write++] = digit;
                }
            }
        }

        return chars[..write];
    }
}
```

```typescript solution
function compress(chars: string[]): string[] {
  let write = 0;
  let read = 0;

  while (read < chars.length) {
    const current = chars[read];
    let count = 0;

    while (read < chars.length && chars[read] === current) {
      read++;
      count++;
    }

    chars[write++] = current;

    if (count > 1) {
      for (const digit of String(count)) {
        chars[write++] = digit;
      }
    }
  }

  return chars.slice(0, write);
}
```

### Complexity

- **Time:** O(n). The `read` pointer visits each element of the array only once, and the `write` pointer writes at most `n` times.
- **Space:** O(1) extra working space. The compression is performed in place directly on the input array `chars`.
