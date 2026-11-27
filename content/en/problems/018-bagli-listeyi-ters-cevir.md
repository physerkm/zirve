---
title: Reverse Linked List
---
You are given the head `head` of a singly linked list. Reverse the list and return its new head.

### Example 1

```text
Input:  head = [1, 2, 3, 4, 5]
Output:  [5, 4, 3, 2, 1]
```

### Example 2

```text
Input:  head = []
Output:  []
```

### Constraints

- The number of nodes is in the range `[0, 5000]`.

**Follow-up:** Can you solve it both iteratively and recursively?

## Hints

- You need to point each node's `next` pointer at the previous node.
- The moment you change the `next` pointer, you lose access to the rest of the list. Save it in a variable first.
- Three pointers are enough: previous, current and next.

## Solution

As you walk the list from start to end, reverse each node's link. The order matters:

1. Save the next node (before breaking the link).
2. Point the current node's `next` pointer at the previous node.
3. Advance the previous and current pointers by one step.

When the loop ends, `previous` points to the last node of the old list, which is the head of the new list.

```csharp solution
public class Solution
{
    public ListNode ReverseList(ListNode head)
    {
        ListNode previous = null;
        var current = head;

        while (current != null)
        {
            var next = current.next;
            current.next = previous;
            previous = current;
            current = next;
        }

        return previous;
    }
}
```

```typescript solution
function reverseList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;

  while (current !== null) {
    const next: ListNode | null = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }

  return previous;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1).

**Recursive solution:** Think of it as "reverse the rest of the list, then attach this node to its end": `head.next.next = head; head.next = null`. It takes O(n) time but uses O(n) space because of the call stack; on very long lists it can cause a stack overflow. That's why the iterative solution is preferred.
