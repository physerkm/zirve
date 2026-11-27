---
title: Linked List, Stack, and Queue
summary: Three fundamental linear structures. Pointer techniques for linked lists, the kinds of problems a stack solves, the queue, and the monotonic stack pattern.
---

## Linked list

In a linked list, each node holds a value and a **pointer to the next node**. The elements don't sit next to each other in memory, so there's no access by index, but inserting and deleting at a known position takes constant time.

| Operation | Array | Linked list |
| --- | --- | --- |
| Access by index | O(1) | O(n) |
| Insert / delete at the start | O(n) | O(1) |
| Insert / delete after a known node | O(n) | O(1) |
| Search | O(n) | O(n) |

In interview questions, the list is usually defined like this:

```csharp
public class ListNode
{
    public int val;
    public ListNode next;
}
```

Linked list problems test **pointer management** more than algorithmic knowledge. Four techniques solve nearly all of them.

### 1. Dummy head node

If the head of the list can change (deletion, merging), putting a fake node at the front eliminates special cases like "the list is empty" or "the first node is being deleted."

```csharp
ListNode MergeSorted(ListNode a, ListNode b)
{
    var dummy = new ListNode();
    var tail = dummy;

    while (a != null && b != null)
    {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }

    tail.next = a ?? b;       // attach the remainder as is
    return dummy.next;
}
```

### 2. Reversing in place

Three pointers are enough: previous, current, next. You must save the next node **before** breaking the link.

```typescript
function reverse(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;

  while (current !== null) {
    const next = current.next;   // 1. save the next node
    current.next = previous;     // 2. reverse the link
    previous = current;          // 3. move forward
    current = next;
  }

  return previous;
}
```

### 3. Fast and slow pointers

One moves one step at a time, the other two. When the fast pointer reaches the end, the slow one is **in the middle**. If the list has a **cycle**, the fast pointer is guaranteed to catch the slow one (Floyd's algorithm); if there's no cycle, the fast pointer reaches `null`. Both use O(1) extra space.

### 4. Two pointers a fixed distance apart

"Remove the `n`th node from the end": move the first pointer `n` steps ahead, then advance both together. When the leading one reaches the end, the trailing one is right before the node to delete. There's no need to traverse the list twice.

The best way to avoid mistakes in linked list questions is to **draw** a small example of three or four nodes and update the pointers step by step.

## Stack

A stack works on the **last in, first out** (LIFO) principle: insertion (`push`), removal (`pop`), and looking at the top (`peek`) are O(1).

| | Type | Push / pop / peek |
| --- | --- | --- |
| C# | `Stack<T>` | `Push` / `Pop` / `Peek` |
| JavaScript | `Array` | `push` / `pop` / `at(-1)` |

Think of a stack in these situations:

- Anything where **the most recently opened must close first**: matching parentheses, nested structures, expression evaluation.
- **Undo** and going back in history.
- **Turning recursion into a loop:** depth-first search (DFS) can be written with your own stack; this prevents call stack overflow on very deep inputs.

```typescript
function isBalanced(text: string): boolean {
  const closing: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];

  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (ch in closing) {
      if (stack.pop() !== closing[ch]) return false;
    }
  }

  return stack.length === 0;   // no parentheses should be left open
}
```

### Monotonic stack

Questions like "for each element, find the **first larger element to its right**" are O(n²) with brute force. A monotonic stack brings this down to O(n): the stack holds, in **decreasing** order, the indices of elements that haven't found their answer yet. If a new element is larger than the ones on top, it's the answer they've been waiting for.

```csharp
// For each day, returns how many days remain until a warmer day.
int[] DailyTemperatures(int[] temps)
{
    var answer = new int[temps.Length];
    var waiting = new Stack<int>();           // indices of days still waiting for an answer

    for (var day = 0; day < temps.Length; day++)
    {
        while (waiting.Count > 0 && temps[day] > temps[waiting.Peek()])
        {
            var earlier = waiting.Pop();
            answer[earlier] = day - earlier;
        }

        waiting.Push(day);
    }

    return answer;
}
```

Each index enters the stack once and leaves it at most once; despite the inner `while` loop, the total is O(n).

## Queue

A queue works on the **first in, first out** (FIFO) principle. Its most important use is **breadth-first search** (BFS): a node's neighbors are added to the queue and nodes are processed in the order they were added, so you advance layer by layer.

| | Type | Note |
| --- | --- | --- |
| C# | `Queue<T>` | `Enqueue` / `Dequeue`, both O(1) |
| JavaScript | `Array` | `shift()` is **O(n)** |

In JavaScript, `array.shift()` shifts every element on each call. If you're going to use an array as a queue on large inputs, keep a **head index** instead of removing elements:

```typescript
const queue: number[] = [start];
for (let head = 0; head < queue.length; head++) {
  const node = queue[head];
  // ... add the neighbors with queue.push(...)
}
```

A structure that supports insertion and removal at both ends is called a **deque** (in C#, `LinkedList<T>` can be used for this). The monotonic queue used to find the maximum element of a sliding window in O(n) is built on a deque.

## Summary

- Linked list: O(1) insertion/deletion, O(n) access. Know the dummy node, reversal, fast–slow, and fixed-gap two-pointer techniques.
- Stack: nested structures, matching, DFS. A monotonic stack solves "next greater element" questions in O(n).
- Queue: BFS and in-order processing. In JavaScript, watch out for the cost of `shift()`.
