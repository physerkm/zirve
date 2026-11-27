---
title: Daily Temperatures
---
`temperatures[i]` is the temperature on day `i`. Return an array `answer` of the same length, where `answer[i]` is the number of days you have to wait after day `i` for a **warmer** day. If there is no warmer day, `answer[i]` should be `0`.

### Example 1

```text
Input:  temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
Output:  [1, 1, 4, 2, 1, 1, 0, 0]
```

### Example 2

```text
Input:  temperatures = [30, 40, 50, 60]
Output:  [1, 1, 1, 0]
```

### Constraints

- `1 <= temperatures.length <= 10^5`
- `30 <= temperatures[i] <= 100`

## Hints

- Scanning to the right for each day is O(n²).
- The question "first greater element to the right" is the monotonic stack pattern.
- Keep on the stack the **indices** of days that haven't found their warmer day yet. If the new day is warmer than the day on top of the stack, that day's answer has been found.

## Solution

The stack holds the indices of days still waiting for their answer. The temperatures of these days decrease from the bottom of the stack to the top (otherwise the lower day's answer would already have been found).

When you reach a new day, if the day on top of the stack is colder, then this is the "warmer day" it was waiting for: pop its index from the stack and write the difference in days. Repeat this as long as the top day is colder, then push the new day onto the stack.

```csharp solution
public class Solution
{
    public int[] DailyTemperatures(int[] temperatures)
    {
        var answer = new int[temperatures.Length];
        var waiting = new Stack<int>();

        for (var day = 0; day < temperatures.Length; day++)
        {
            while (waiting.Count > 0 && temperatures[day] > temperatures[waiting.Peek()])
            {
                var earlier = waiting.Pop();
                answer[earlier] = day - earlier;
            }

            waiting.Push(day);
        }

        return answer;
    }
}
```

```typescript solution
function dailyTemperatures(temperatures: number[]): number[] {
  const answer: number[] = new Array(temperatures.length).fill(0);
  const waiting: number[] = [];

  for (let day = 0; day < temperatures.length; day++) {
    while (waiting.length > 0 && temperatures[day] > temperatures[waiting[waiting.length - 1]]) {
      const earlier = waiting.pop()!;
      answer[earlier] = day - earlier;
    }

    waiting.push(day);
  }

  return answer;
}
```

### Complexity

- **Time:** O(n). Despite the nested loop, each index is pushed onto the stack once and popped at most once.
- **Space:** O(n).

The days left on the stack when the loop ends have no warmer day; their answers stay at the initial value `0`.
