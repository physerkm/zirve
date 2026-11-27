---
title: Reverse Nodes in k-Group
---
You are given `head`, the head of a linked list, and a positive integer `k`. Reverse the nodes of the list **in groups of `k`** and return the modified list.

If the number of nodes is not a multiple of `k`, the fewer than `k` nodes left at the end stay **as they are**. You may not change the values of the nodes; only the nodes themselves may be moved.

### Example 1

```text
Input:  head = [1, 2, 3, 4, 5], k = 2
Output: [2, 1, 4, 3, 5]
```

### Example 2

```text
Input:  head = [1, 2, 3, 4, 5], k = 3
Output: [3, 2, 1, 4, 5]
```

### Constraints

- The number of nodes is `n`, `1 <= k <= n <= 5000`
- `0 <= Node.val <= 1000`

**Follow-up:** Can you solve it with O(1) extra memory?

## Hints

- First think about reversing a single group: why do the node before the group and the node after it matter?
- Before starting each group, check whether there are `k` nodes left. If not, you're done.
- Start with a `dummy` node. Let `groupPrev` always point to the node just before the group to be reversed; after the group is reversed, the old first node becomes the group's new last node.

## Solution

### Reversing group by group, in place

We put a `dummy` in front of the list and start with `groupPrev = dummy`. In each round:

1. Moving `k` steps from `groupPrev` finds `kth`, the last node of the group. If fewer than `k` nodes remain, the loop ends.
2. `groupNext = kth.next` is saved. The group is reversed with the classic reversal, except that `prev` starts as `groupNext` instead of `null`. This way the group's new last node (the old first node) is automatically linked to the next part.
3. `groupPrev.next = kth` links the previous part to the group's new head, and `groupPrev` moves to the group's new last node.

```csharp solution
public class Solution
{
    public ListNode ReverseKGroup(ListNode head, int k)
    {
        var dummy = new ListNode(0, head);
        var groupPrev = dummy;

        while (true)
        {
            var kth = groupPrev;
            for (var i = 0; i < k && kth != null; i++)
            {
                kth = kth.next;
            }

            if (kth == null)
            {
                break;
            }

            var groupNext = kth.next;
            var prev = groupNext;
            var current = groupPrev.next;
            while (current != groupNext)
            {
                var next = current.next;
                current.next = prev;
                prev = current;
                current = next;
            }

            var firstOfGroup = groupPrev.next;
            groupPrev.next = kth;
            groupPrev = firstOfGroup;
        }

        return dummy.next;
    }
}
```

```typescript solution
function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let groupPrev: ListNode = dummy;

  while (true) {
    let kth: ListNode | null = groupPrev;
    for (let i = 0; i < k && kth !== null; i++) {
      kth = kth.next;
    }

    if (kth === null) {
      break;
    }

    const groupNext: ListNode | null = kth.next;
    let prev: ListNode | null = groupNext;
    let current: ListNode | null = groupPrev.next;
    while (current !== groupNext) {
      const next: ListNode | null = current!.next;
      current!.next = prev;
      prev = current;
      current = next;
    }

    const firstOfGroup = groupPrev.next!;
    groupPrev.next = kth;
    groupPrev = firstOfGroup;
  }

  return dummy.next;
}
```

### Complexity

- **Time:** O(n). Each node is counted once and reversed once.
- **Space:** O(1). A recursive solution is also possible, but it uses an O(n / k) call stack.
