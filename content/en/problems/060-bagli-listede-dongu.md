---
title: Linked List Cycle
---
You are given `head`, the head of a linked list. Determine whether the list contains a **cycle**.

A list has a cycle if some node can be reached again by continuously following the `next` pointer. In the tests, the cycle is described by `pos`, the 0-indexed position of the node that the tail connects to (`pos = -1` means there is no cycle). `pos` is **not** passed to the function as a parameter.

Return `true` if there is a cycle, otherwise `false`.

### Example 1

```text
Input:  head = [3, 2, 0, -4], pos = 1
Output: true
Explanation: The last node (-4) connects to the node at position 1 (2).
```

### Example 2

```text
Input:  head = [1, 2], pos = 0
Output: true
```

### Example 3

```text
Input:  head = [1], pos = -1
Output: false
```

### Constraints

- The number of nodes is in the range `[0, 10^4]`.
- `-10^5 <= Node.val <= 10^5`
- `pos` is `-1` or a valid position in the list.

**Follow-up:** Can you solve it with O(1) extra memory?

## Hints

- If you store the nodes you visit in a set, you can tell when you reach the same node a second time. That takes O(n) memory.
- Think of two runners, one slow and one fast. On a circular track, what happens to the fast one relative to the slow one?
- Let `slow` advance one node per step and `fast` two. If there is a cycle they meet; otherwise `fast` reaches the end of the list.

## Solution

### Floyd's tortoise and hare algorithm

Two pointers start from the head of the list: `slow` advances one node per step, `fast` advances two.

- If there is **no** cycle, `fast` (or `fast.next`) reaches `null` and the answer is `false`.
- If there **is** a cycle, both pointers eventually enter it. Inside the cycle, `fast` gets one node closer to `slow` with every step; since the gap shrinks by exactly one per step, it can't jump over it, and they **are guaranteed to meet**.

The comparison is done on node references, not values: different nodes can hold the same value.

```csharp solution
public class Solution
{
    public bool HasCycle(ListNode head)
    {
        var slow = head;
        var fast = head;

        while (fast != null && fast.next != null)
        {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast)
            {
                return true;
            }
        }

        return false;
    }
}
```

```typescript solution
function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
}
```

### Complexity

- **Time:** O(n). Without a cycle, `fast` reaches the end in n/2 steps; with a cycle, once `slow` enters it, it is caught within at most the cycle's length in steps.
- **Space:** O(1).

The same two-pointer technique is also the basis of problems such as "the node where the cycle begins" and "find the duplicate number".
