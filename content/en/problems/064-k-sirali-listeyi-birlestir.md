---
title: Merge k Sorted Lists
---
You are given an array `lists` containing the head nodes of `k` linked lists, each sorted in ascending order.

Merge all the linked lists into **one sorted linked list** and return its head node (`head`).

### Example 1

```text
Input:  lists = [[1, 4, 5], [1, 3, 4], [2, 6]]
Output: [1, 1, 2, 3, 4, 4, 5, 6]
Explanation: The linked lists are:
  1 -> 4 -> 5
  1 -> 3 -> 4
  2 -> 6
Merging them all into one sorted list gives:
  1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6
```

### Example 2

```text
Input:  lists = []
Output: []
Explanation: No lists are given, so the result is an empty list.
```

### Example 3

```text
Input:  lists = [[]]
Output: []
Explanation: A single empty list is given, so the result is an empty list.
```

### Constraints

- `k == lists.length`
- `0 <= k <= 10^4`
- `0 <= lists[i].length <= 500`
- `-10^4 <= lists[i][j] <= 10^4`
- `lists[i]` is sorted in ascending order.
- The total number of nodes across all lists does not exceed `10^4`.

## Hints

- Think about how to merge two sorted linked lists in O(n + m) time (using a dummy node and two pointers).
- Merging the lists one after another (`lists[0]` with `lists[1]`, then the result with `lists[2]`...) takes O(N · k) time in total, which is too slow.
- Instead, if you use a **Divide and Conquer** approach and merge the lists in pairs, the number of lists halves every round.
- Alternatively, you can keep the current smallest node of each list in a **min-heap (priority queue)** and extract the smallest one in O(log k) time at each step.

## Solution

The most elegant way to solve this problem in **O(N log k)** time instead of O(N · k), without needing extra memory, is the **Divide and Conquer (pairwise merging)** technique.

When we merge the lists cumulatively from start to finish, the nodes in the first list get scanned again and again, almost `k` times. But if we pair up the lists like a tournament bracket:
1. In the first round, we merge the pairs `(lists[0], lists[1])`, `(lists[2], lists[3])`, ...
2. In the second round, we merge the resulting new lists in pairs again (`interval = 1, 2, 4, 8, ...`).
3. In total, only `⌈log₂ k⌉` merge rounds are performed, and each round passes over all `N` nodes only once.

The helper `MergeTwoLists`, which merges two sorted lists, works in O(1) extra space: instead of creating new nodes, it links the `next` references of the existing nodes behind a `dummy` node.

```csharp solution
public class Solution
{
    public ListNode MergeKLists(ListNode[] lists)
    {
        if (lists == null || lists.Length == 0)
            return null;

        // Merge the lists in pairs, tournament style: the step interval doubles as 1, 2, 4, 8...
        int interval = 1;
        while (interval < lists.Length)
        {
            for (int i = 0; i + interval < lists.Length; i += interval * 2)
            {
                lists[i] = MergeTwoLists(lists[i], lists[i + interval]);
            }

            interval *= 2;
        }

        return lists[0];
    }

    private ListNode MergeTwoLists(ListNode l1, ListNode l2)
    {
        ListNode dummy = new ListNode();
        ListNode tail = dummy;

        while (l1 != null && l2 != null)
        {
            if (l1.val <= l2.val)
            {
                tail.next = l1;
                l1 = l1.next;
            }
            else
            {
                tail.next = l2;
                l2 = l2.next;
            }

            tail = tail.next;
        }

        tail.next = l1 ?? l2;
        return dummy.next;
    }
}
```

```typescript solution
function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
  if (lists.length === 0) return null;

  let interval = 1;
  while (interval < lists.length) {
    for (let i = 0; i + interval < lists.length; i += interval * 2) {
      lists[i] = mergeTwoLists(lists[i], lists[i + interval]);
    }
    interval *= 2;
  }

  return lists[0];
}

function mergeTwoLists(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;

  while (l1 !== null && l2 !== null) {
    if (l1.val <= l2.val) {
      tail.next = l1;
      l1 = l1.next;
    } else {
      tail.next = l2;
      l2 = l2.next;
    }
    tail = tail.next;
  }

  tail.next = l1 ?? l2;
  return dummy.next;
}
```

### Complexity

- **Time:** O(N log k), where `k` is the number of lists and `N` is the total number of nodes across all lists. Each `interval` round halves the number of lists (`log₂ k` rounds), and each round compares at most `N` nodes in total.
- **Space:** O(1). The `next` pointers of the existing nodes are relinked in place, and no recursion stack is used.
