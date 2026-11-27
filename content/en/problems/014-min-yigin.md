---
title: Min Stack
---
Design a stack that supports push, pop, reading the top element, and **reading the minimum element**, all in constant time.

Implement the `MinStack` class with these methods:

- `MinStack()` creates an empty stack.
- `push(value)` pushes the value onto the top of the stack.
- `pop()` removes the element on top.
- `top()` returns the element on top.
- `getMin()` returns the minimum element in the stack.

Each method must run in **O(1)** time.

### Example

```text
Operations:  MinStack, push(-2), push(0), push(-3), getMin, pop, top, getMin
Output:      null,     null,     null,    null,     -3,     null, 0,  -2
```

### Constraints

- `pop`, `top` and `getMin` are only called when the stack is not empty.
- At most 3 · 10^4 operations are performed.

## Hints

- Keeping the minimum element in a single variable isn't enough: once that element is popped, you can't know the new minimum.
- Consider storing, together with each element, the answer to "what was the stack's minimum while this element was on top?"

## Solution

The difficulty is in `pop`. If you keep the minimum element in a single variable, you have to scan the whole stack to find the previous minimum once that element is removed.

The solution is to store **the minimum value so far** alongside each element. Each layer of the stack holds a `(value, min_at_this_layer)` pair. When a new element is pushed, its min is the smaller of the new value and the min of the layer below. When an element is popped, the min of the layer below is already correct; nothing needs to be recomputed.

```csharp solution
public class MinStack
{
    private readonly Stack<(int Value, int Min)> _items = new();

    public MinStack()
    {
    }

    public void Push(int value)
    {
        var min = _items.Count == 0 ? value : Math.Min(value, _items.Peek().Min);
        _items.Push((value, min));
    }

    public void Pop()
    {
        _items.Pop();
    }

    public int Top()
    {
        return _items.Peek().Value;
    }

    public int GetMin()
    {
        return _items.Peek().Min;
    }
}
```

```typescript solution
class MinStack {
  private items: { value: number; min: number }[] = [];

  push(value: number): void {
    const min = this.items.length === 0 ? value : Math.min(value, this.items[this.items.length - 1].min);
    this.items.push({ value, min });
  }

  pop(): void {
    this.items.pop();
  }

  top(): number {
    return this.items[this.items.length - 1].value;
  }

  getMin(): number {
    return this.items[this.items.length - 1].min;
  }
}
```

### Complexity

- **Time:** O(1) for every operation.
- **Space:** O(n). One extra number is stored per element.

**Alternative:** Keeping a second "min stack" and pushing onto it only when the new value is less than or equal to the current minimum uses less memory on most inputs. Skipping the equality case is a classic bug: when the same minimum value is pushed twice and popped once, the min stack is emptied by mistake.
