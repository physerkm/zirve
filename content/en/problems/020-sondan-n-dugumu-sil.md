---
title: Remove Nth Node From End of List
---
You are given the head `head` of a linked list. Remove the `n`th node **from the end** of the list and return the head of the list.

### Example 1

```text
Input:  head = [1, 2, 3, 4, 5], n = 2
Output:  [1, 2, 3, 5]
Explanation: The 2nd node from the end is 4.
```

### Example 2

```text
Input:  head = [1], n = 1
Output:  []
```

### Example 3

```text
Input:  head = [1, 2], n = 1
Output:  [1]
```

### Constraints

- The number of nodes is `sz`, `1 <= sz <= 30`
- `0 <= Node.val <= 100`
- `1 <= n <= sz`

**Follow-up:** Can you do it in a single pass over the list?

## Hints

- With two passes it's easy: first find the length, then go to node number `length - n` from the start.
- For a single pass, keep **a fixed distance** between two pointers. When the front one reaches the end, where is the back one?
- Removing the head node looks like a special case. If you put a fake node (dummy) in front of the list, that case goes away.

## Solution

### Two pointers n nodes apart

Add a `dummy` node at the front of the list; that way, "the node just before the one to remove" always exists, even if the node to remove is the head.

The `fast` pointer first moves `n + 1` steps ahead. Then `slow` and `fast` advance together. When `fast` goes past the end of the list (`null`), `slow` is **right before** the node to remove: there are exactly `n` nodes between them. `slow.next = slow.next.next` skips over the node.

```csharp solution
public class Solution
{
    public ListNode RemoveNthFromEnd(ListNode head, int n)
    {
        var dummy = new ListNode(0, head);
        var slow = dummy;
        var fast = dummy;

        for (var i = 0; i <= n; i++)
        {
            fast = fast.next;
        }

        while (fast != null)
        {
            slow = slow.next;
            fast = fast.next;
        }

        slow.next = slow.next.next;
        return dummy.next;
    }
}
```

```typescript solution
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let slow: ListNode = dummy;
  let fast: ListNode | null = dummy;

  for (let i = 0; i <= n; i++) {
    fast = fast!.next;
  }

  while (fast !== null) {
    slow = slow.next!;
    fast = fast.next;
  }

  slow.next = slow.next!.next;
  return dummy.next;
}
```

### Complexity

- **Time:** O(sz). The list is traversed once.
- **Space:** O(1).

In linked list problems, the `dummy` node is the standard way to eliminate special cases in any operation that can change the head node (removal, insertion, merging).
