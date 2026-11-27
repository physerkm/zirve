---
title: Time Based Key-Value Store
---
Design a key-value store that can hold multiple values for the same key at different times and can read the value at a given moment.

Implement the `TimeMap` class:

- `TimeMap()` creates an empty store.
- `set(key, value, timestamp)` stores the key together with its value at the given timestamp.
- `get(key, timestamp)` returns, among the values previously stored with `set` such that `timestamp_prev <= timestamp`, the one with the **largest timestamp**. If there is no such value, it returns `""`.

The timestamps in `set` calls are in **strictly increasing** order.

### Example

```text
Operations: TimeMap, set("foo", "bar", 1), get("foo", 1), get("foo", 3), set("foo", "bar2", 4), get("foo", 4), get("foo", 5)
Output:     null,    null,               "bar",         "bar",         null,                 "bar2",        "bar2"
Explanation: At time 3, the latest value stored for "foo" is "bar" from time 1.
```

### Constraints

- `1 <= key.length, value.length <= 100`
- `key` and `value` consist of lowercase letters and digits.
- `1 <= timestamp <= 10^7`
- The timestamps in `set` calls are strictly increasing.
- At most `2 * 10^5` calls in total will be made to `set` and `get`.

## Hints

- For each key, keep a list of `(time, value)` pairs.
- Because timestamps arrive in increasing order, this list is **sorted automatically**.
- For `get`, use binary search to find the largest time in the list that is not greater than `timestamp`.

## Solution

### A sorted list per key plus binary search

A hash table maps each key to its own `(time, value)` list. `set` only appends to the end of the list: since timestamps arrive in increasing order, the list stays sorted and appending is O(1).

For `get(key, t)`, we look for the **last** element in the list that satisfies `time <= t`. In the binary search, `lo = 0` and `hi = n - 1`; if `time[mid] <= t`, then `mid` is a candidate and we keep looking to the right, otherwise we go left. If no candidate is found (all entries are after `t`, or the key doesn't exist at all), we return `""`.

```csharp solution
public class TimeMap
{
    private readonly Dictionary<string, List<(int Time, string Value)>> store = new();

    public void Set(string key, string value, int timestamp)
    {
        if (!store.TryGetValue(key, out var list))
        {
            list = new List<(int Time, string Value)>();
            store[key] = list;
        }

        list.Add((timestamp, value));
    }

    public string Get(string key, int timestamp)
    {
        if (!store.TryGetValue(key, out var list))
        {
            return "";
        }

        var lo = 0;
        var hi = list.Count - 1;
        var answer = "";

        while (lo <= hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (list[mid].Time <= timestamp)
            {
                answer = list[mid].Value;
                lo = mid + 1;
            }
            else
            {
                hi = mid - 1;
            }
        }

        return answer;
    }
}
```

```typescript solution
class TimeMap {
  private store = new Map<string, [number, string][]>();

  set(key: string, value: string, timestamp: number): void {
    let list = this.store.get(key);
    if (list === undefined) {
      list = [];
      this.store.set(key, list);
    }

    list.push([timestamp, value]);
  }

  get(key: string, timestamp: number): string {
    const list = this.store.get(key);
    if (list === undefined) {
      return "";
    }

    let lo = 0;
    let hi = list.length - 1;
    let answer = "";

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (list[mid][0] <= timestamp) {
        answer = list[mid][1];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return answer;
  }
}
```

### Complexity

- **Time:** `set` O(1), `get` O(log m), where `m` is the number of entries for that key.
- **Space:** O(total number of `set` calls).

If timestamps didn't arrive in sorted order, `set` would need a sorted structure (for example `SortedList` in C#). In an interview, pointing out where this assumption comes from is a good signal.
