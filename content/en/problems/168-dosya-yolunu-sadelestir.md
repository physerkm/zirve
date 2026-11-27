---
title: Simplify Path
---
You are given an absolute path string `path` for a Unix-style file system (`path` always starts with a `'/'` character). Convert it to the **simplified canonical path**.

In a Unix-style file system:
- A single period `'.'` refers to the current directory.
- A double period `'..'` refers to the parent directory.
- Multiple consecutive slashes (`'//'`, `'///'`, etc.) are treated as a single `'/'`.
- Any sequence of periods other than `'.'` and `'..'` (`'...'`, `'....'`, etc.) is treated as a valid file or directory name.

The simplified canonical path must follow these rules:
- It must start with a single slash `'/'`.
- There must be exactly one `'/'` between two directory names.
- Except for the root directory (`"/"`), the path must not end with a `'/'`.
- It must not contain `'.'` or `'..'` components referring to the current or parent directory.

### Example 1

```text
Input:  path = "/home/"
Output:  "/home"
Explanation: For paths other than the root directory, the trailing slash is removed.
```

### Example 2

```text
Input:  path = "/home//foo/"
Output:  "/home/foo"
Explanation: Consecutive slashes are replaced by a single '/'.
```

### Example 3

```text
Input:  path = "/home/user/Documents/../Pictures"
Output:  "/home/user/Pictures"
Explanation: The ".." component goes back up to the parent directory ("user").
```

### Example 4

```text
Input:  path = "/../"
Output:  "/"
Explanation: The root directory has no parent directory; you stay in the root directory.
```

### Constraints

- `1 <= path.length <= 3000`
- `path` consists of English letters, digits, period `'.'`, slash `'/'` or underscore `'_'`.
- `path` is a valid absolute Unix path.

## Hints

- When you split the path on the `'/'` character (`Split('/')`), you get directory names, `""` (empty parts caused by consecutive or trailing `'/'`), `"."` and `".."`.
- The `""` and `"."` parts don't change the current directory, so they can be skipped directly.
- When `".."` comes, we need to leave the most recently entered directory; a stack (`Stack`) is ideal for this "last in, first out" (LIFO) behavior.
- If `".."` comes while the stack is empty, we are at the root directory; just continue without doing anything.

## Solution

As we walk along a file path, each directory name takes us into a subfolder, while `".."` takes us back from the most recently entered folder to its parent. This "undo the most recently entered directory" operation naturally calls for a **stack**.

First we split the path on slashes with `path.Split('/')`. For each resulting `part`:
1. If the part is empty (`""`) or `"."`, the current location doesn't change; we skip it.
2. If the part is `".."` and the stack is not empty, we pop the most recently entered directory with `stack.Pop()` (if the stack is empty, we are already at the root directory).
3. Every other part (`"home"`, `"..."`, etc.) is a valid directory name; we push it onto the stack with `stack.Push(part)`.

Finally, we join the directory names left on the stack from root to end with `"/"`, prepend `"/"`, and return the result.

```csharp solution
public class Solution
{
    public string SimplifyPath(string path)
    {
        Stack<string> stack = new Stack<string>();
        string[] parts = path.Split('/');

        foreach (string part in parts)
        {
            if (part == "" || part == ".")
            {
                continue;
            }

            if (part == "..")
            {
                if (stack.Count > 0)
                {
                    stack.Pop();
                }
            }
            else
            {
                stack.Push(part);
            }
        }

        string[] dirs = stack.ToArray();
        Array.Reverse(dirs);
        return "/" + string.Join("/", dirs);
    }
}
```

```typescript solution
function simplifyPath(path: string): string {
  const stack: string[] = [];
  const parts = path.split('/');

  for (const part of parts) {
    if (part === '' || part === '.') {
      continue;
    }

    if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      stack.push(part);
    }
  }

  return '/' + stack.join('/');
}
```

### Complexity

- **Time:** O(n). Splitting the string on `'/'`, processing each part on the stack and joining the result take O(n) in total.
- **Space:** O(n). The split parts and the stack use at most O(n) memory.
