---
title: Reorder List
---
You are given `head`, the head of a singly linked list. The list looks like this:

```text
L0 → L1 → … → Ln-1 → Ln
```

Reorder the list into this form:

```text
L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …
```

You **may not modify the values** of the nodes; you may only change the links between nodes. The list must be rearranged in place, and the head node must be returned so the tests can see the result.

### Example 1

```text
Input:  head = [1, 2, 3, 4]
Output: [1, 4, 2, 3]
```

### Example 2

```text
Input:  head = [1, 2, 3, 4, 5]
Output: [1, 5, 2, 4, 3]
```

### Constraints

- The number of nodes is in the range `[1, 5 * 10^4]`.
- `1 <= Node.val <= 1000`

## Hints

- Putting the nodes in an array and weaving from both ends works with O(n) extra space. Can you do it with O(1) space?
- The desired order is the first half of the list woven together, one by one, with the **reversed** second half.
- Three steps: find the middle with slow/fast pointers, reverse the second half, then merge the two lists alternately.

## Solution

### Find the middle, reverse, weave

1. **Find the middle.** `slow` moves one step, `fast` moves two. When `fast` reaches the end, `slow` is on the last node of the first half.
2. **Split off and reverse the second half.** `second = slow.next`, then `slow.next = null` disconnects the two lists. The second half is reversed with the classic three-pointer method.
3. **Weave.** The links are rebuilt by taking one node from the first list, then one from the second. Since the first half is at most one node longer than the second, the weaving is complete once the second list runs out.

```csharp solution
public class Solution
{
    public ListNode ReorderList(ListNode head)
    {
        var slow = head;
        var fast = head;
        while (fast.next != null && fast.next.next != null)
        {
            slow = slow.next;
            fast = fast.next.next;
        }

        ListNode prev = null;
        var current = slow.next;
        slow.next = null;
        while (current != null)
        {
            var next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }

        var first = head;
        var second = prev;
        while (second != null)
        {
            var firstNext = first.next;
            var secondNext = second.next;
            first.next = second;
            second.next = firstNext;
            first = firstNext;
            second = secondNext;
        }

        return head;
    }
}
```

```typescript solution
function reorderList(head: ListNode | null): ListNode | null {
  if (head === null) return head;

  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next!;
    fast = fast.next.next;
  }

  let prev: ListNode | null = null;
  let current = slow.next;
  slow.next = null;
  while (current !== null) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  let first: ListNode | null = head;
  let second = prev;
  while (second !== null) {
    const firstNext: ListNode | null = first!.next;
    const secondNext: ListNode | null = second.next;
    first!.next = second;
    second.next = firstNext;
    first = firstNext;
    second = secondNext;
  }

  return head;
}
```

### Complexity

- **Time:** O(n). Each phase traverses the list at most once.
- **Space:** O(1).

This problem combines three core linked list skills (finding the middle, reversing, merging) in a single question; thinking of each one as a separate helper function keeps the code simple.
