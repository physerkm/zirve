---
title: Logger Rate Limiter
---
Design a logging system that receives a stream of messages and allows **the same message** to be printed at most **once every 10 seconds**. A message printed at time `t` should not be printed again until time `t + 10`.

Messages arrive in chronological order; several messages may arrive at the same time.

Implement the `Logger` class:

- `Logger()` creates the object.
- `shouldPrintMessage(timestamp, message)` returns `true` if the message should be printed at this time, and `false` otherwise.

### Example

```text
Operations:  Logger, (1, "foo"), (2, "bar"), (3, "foo"), (8, "bar"), (10, "foo"), (11, "foo")
Output:      null,   true,       true,       false,      false,      false,       true
Explanation: "foo" was printed at 1; it is allowed again at 11.
```

### Constraints

- `0 <= timestamp <= 10^9`
- Timestamps are in non-decreasing order.
- `1 <= message.length <= 30`
- At most `10^4` calls are made.

## Hints

- You need only one piece of information per message: the next time it may be printed.
- Keep a `message → earliest allowed time` map in a hash table.

## Solution

### Next allowed time per message

The dictionary holds, for each message, the **earliest time it may be printed** next. If the incoming message is not in the dictionary, or `timestamp` has reached that time, the message is printed and its allowed time is updated to `timestamp + 10`. Otherwise the method returns `false` and the dictionary doesn't change; a rejected message doesn't extend the waiting period.

```csharp solution
public class Logger
{
    private readonly Dictionary<string, int> nextAllowed = new();

    public bool ShouldPrintMessage(int timestamp, string message)
    {
        if (nextAllowed.TryGetValue(message, out var allowedAt) && timestamp < allowedAt)
        {
            return false;
        }

        nextAllowed[message] = timestamp + 10;
        return true;
    }
}
```

```typescript solution
class Logger {
  private nextAllowed = new Map<string, number>();

  shouldPrintMessage(timestamp: number, message: string): boolean {
    const allowedAt = this.nextAllowed.get(message);
    if (allowedAt !== undefined && timestamp < allowedAt) {
      return false;
    }

    this.nextAllowed.set(message, timestamp + 10);
    return true;
  }
}
```

### Complexity

- **Time:** O(1) (excluding hashing, which is proportional to the message length).
- **Space:** O(number of distinct messages).

If you don't want memory to grow without bound, messages not seen in the last 10 seconds can be evicted from the dictionary using a queue or periodic cleanup; in interviews this improvement usually comes up as a follow-up question.
