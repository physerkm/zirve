---
title: Add Two Numbers
---
You are given two non-empty linked lists representing two non-negative integers. The digits are stored in **reverse order**: the head of the list is the ones digit, and each node holds a single digit.

Add the two numbers and return the sum as a linked list in the same format (reverse order, one digit per node).

The numbers do not contain any leading zeros, except the number 0 itself.

### Example 1

```text
Input:  l1 = [2, 4, 3], l2 = [5, 6, 4]
Output: [7, 0, 8]
Explanation: 342 + 465 = 807
```

### Example 2

```text
Input:  l1 = [0], l2 = [0]
Output: [0]
```

### Example 3

```text
Input:  l1 = [9, 9, 9, 9, 9, 9, 9], l2 = [9, 9, 9, 9]
Output: [8, 9, 9, 9, 0, 0, 0, 1]
```

### Constraints

- The number of nodes in each list is in the range `[1, 100]`.
- `0 <= Node.val <= 9`

## Hints

- The lists start at the ones digit. When you add on paper, you also start from the right, at the ones digit.
- At each step, add the two digits and the **carry** from the previous step. The ones digit of the sum goes into the new node, and the tens digit becomes the new carry.
- If one list ends early, treat its digit as 0. If the carry is still 1 when both lists end, you need one more node.
- To avoid special-casing the first node of the result, you can put a temporary "dummy" node at the front.

## Solution

Since the lists start at the ones digit, walking them from head to tail is the same as doing column addition from right to left.

At each step we add three things: the digit from `l1`, the digit from `l2`, and the carry left over from the previous step. The sum is at most 9 + 9 + 1 = 19; the ones digit (`sum % 10`) goes into the new node, and the rest (`sum / 10`, so 0 or 1) is carried to the next step.

The loop condition covers all three cases together: we continue if either list still has digits **or** there is a carry not yet written. A finished list adds nothing to the sum; its digit counts as 0. Forgetting the final carry (for example, 5 + 5 = 10) is the most common mistake in this problem; the `carry != 0` in the condition handles it automatically.

The `dummy` node is a placeholder that sits in front of the result. Thanks to it, you don't need a separate "is the list empty?" check when adding the first digit; at the end, you return `dummy.next`.

```csharp solution
public class Solution
{
    public ListNode AddTwoNumbers(ListNode l1, ListNode l2)
    {
        // The lists start at the ones digit; walking head to tail is column addition from right to left.
        ListNode dummy = new ListNode(); // placeholder in front of the result: the first digit is no special case
        ListNode tail = dummy;           // the current last node of the result
        int carry = 0;

        // Keep going while a list still has digits or there is a carry to write.
        while (l1 != null || l2 != null || carry != 0)
        {
            int sum = carry;

            // A finished list adds nothing; its digit counts as 0.
            if (l1 != null)
            {
                sum += l1.val;
                l1 = l1.next;
            }

            if (l2 != null)
            {
                sum += l2.val;
                l2 = l2.next;
            }

            // sum is at most 9 + 9 + 1 = 19: write the ones digit, keep the rest (0 or 1) as the carry.
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
            carry = sum / 10;
        }

        return dummy.next;
    }
}
```

```typescript solution
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  let carry = 0;

  while (l1 !== null || l2 !== null || carry !== 0) {
    let sum = carry;

    if (l1 !== null) {
      sum += l1.val;
      l1 = l1.next;
    }

    if (l2 !== null) {
      sum += l2.val;
      l2 = l2.next;
    }

    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    carry = Math.floor(sum / 10);
  }

  return dummy.next;
}
```

### Complexity

- **Time:** O(max(m, n)). Each node of the longer list is processed once.
- **Space:** O(1), not counting the returned list.

Converting the lists to numbers first and then adding them doesn't work: a 100-digit number doesn't fit in any integer type. Adding digit by digit avoids overflow and finishes in a single pass.
