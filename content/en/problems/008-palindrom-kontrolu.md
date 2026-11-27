---
title: Valid Palindrome
---
A string is a **palindrome** if, after converting all uppercase letters to lowercase and removing every character that isn't a letter or digit, it reads the same forward and backward.

Return `true` if the string `s` is a palindrome, and `false` otherwise.

### Example 1

```text
Input:  s = "A man, a plan, a canal: Panama"
Output:  true
Explanation: "amanaplanacanalpanama" is a palindrome.
```

### Example 2

```text
Input:  s = "race a car"
Output:  false
```

### Constraints

- `1 <= s.length <= 2 * 10^5`
- `s` consists only of printable ASCII characters.

**Follow-up:** Can you solve it with O(1) extra space, without building a new cleaned-up string?

## Hints

- Cleaning the string and comparing it with its reverse works, but uses extra memory.
- Use two pointers, one starting at the beginning and one at the end; skip characters that aren't letters or digits.

## Solution

Place two pointers at the two ends of the string. At each step, first skip characters that aren't letters or digits, then compare the characters at the two ends (converted to lowercase). If they differ, the string isn't a palindrome; if they match, move both pointers inward.

```csharp solution
public class Solution
{
    public bool IsPalindrome(string s)
    {
        var left = 0;
        var right = s.Length - 1;

        while (left < right)
        {
            if (!char.IsAsciiLetterOrDigit(s[left]))
            {
                left++;
            }
            else if (!char.IsAsciiLetterOrDigit(s[right]))
            {
                right--;
            }
            else
            {
                if (char.ToLowerInvariant(s[left]) != char.ToLowerInvariant(s[right])) return false;
                left++;
                right--;
            }
        }

        return true;
    }
}
```

```typescript solution
function isPalindrome(s: string): boolean {
  const isAlphanumeric = (ch: string): boolean => /[a-z0-9]/i.test(ch);

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (!isAlphanumeric(s[left])) {
      left++;
    } else if (!isAlphanumeric(s[right])) {
      right--;
    } else {
      if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
      left++;
      right--;
    }
  }

  return true;
}
```

### Complexity

- **Time:** O(n). Each character is visited at most once.
- **Space:** O(1).

An empty string, or a string with no letters or digits at all (e.g. `" "`), counts as a palindrome; the loop finishes without making any comparison.
