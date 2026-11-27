---
title: Merge Two Sorted Lists
---
You are given the heads `list1` and `list2` of two linked lists sorted in ascending order. Merge the two lists into **a single sorted list** by linking their nodes together, and return its head.

### Example 1

```text
Input:  list1 = [1, 2, 4], list2 = [1, 3, 4]
Output:  [1, 1, 2, 3, 4, 4]
```

### Example 2

```text
Input:  list1 = [], list2 = [0]
Output:  [0]
```

### Constraints

- The number of nodes in each list is in the range `[0, 50]`.
- Both lists are sorted in ascending order.

## Hints

- Compare the nodes at the heads of the two lists; the smaller one is appended to the result list.
- To avoid treating the head of the result list as a special case, start with a fake **dummy node**.
- When one of the lists runs out, the rest of the other is already sorted; you can link it as is.

## Solution

Build the result list behind a dummy node; `tail` always points to the last node of the result list. At each step, link the smaller of the two head nodes after `tail` and advance one step in that list.

When one of the lists is exhausted, the remainder of the other is linked with a single assignment: it's already sorted, and all its elements are greater than or equal to those in the result.

```csharp solution
public class Solution
{
    public ListNode MergeTwoLists(ListNode list1, ListNode list2)
    {
        var dummy = new ListNode();
        var tail = dummy;

        while (list1 != null && list2 != null)
        {
            if (list1.val <= list2.val)
            {
                tail.next = list1;
                list1 = list1.next;
            }
            else
            {
                tail.next = list2;
                list2 = list2.next;
            }

            tail = tail.next;
        }

        tail.next = list1 ?? list2;
        return dummy.next;
    }
}
```

```typescript solution
function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }

    tail = tail.next;
  }

  tail.next = list1 ?? list2;
  return dummy.next;
}
```

### Complexity

- **Time:** O(n + m). Each node is visited once.
- **Space:** O(1). No new nodes are created; the existing nodes are relinked.

The dummy node technique eliminates the "result list is empty" special case in every linked list problem where the head can change.
