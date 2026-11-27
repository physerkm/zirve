---
title: Cheapest Flights Within K Stops
---

There are `n` cities connected by some flights. You are given an array `flights` where `flights[i] = [from_i, to_i, price_i]` means there is a directed flight from city `from_i` to city `to_i` with cost `price_i`.

You are also given a source city `src`, a destination city `dst`, and a maximum number of stops `k`. Return the **cheapest price** from `src` to `dst` using **at most `k` stops** (that is, at most `k + 1` flights). If there is no such route, return `-1`.

### Example 1

```text
Input:  n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1
Output:  700
Explanation: With at most 1 stop, you take the route 0 -> 1 -> 3 for a total cost of 100 + 600 = 700. (The route 0 -> 1 -> 2 -> 3 costs 400 but needs 2 stops.)
```

### Example 2

```text
Input:  n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1
Output:  200
Explanation: With 1 stop, the route 0 -> 1 -> 2 costs 100 + 100 = 200 in total.
```

### Example 3

```text
Input:  n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0
Output:  500
Explanation: With no stops (k = 0), only the direct flight 0 -> 2 can be used, and it costs 500.
```

### Constraints

- `1 <= n <= 100`
- `0 <= flights.length <= (n * (n - 1) / 2)`
- `flights[i].length == 3`
- `0 <= from_i, to_i < n`
- `from_i != to_i`
- `1 <= price_i <= 10^4`
- There is at most one flight in the same direction between any two cities.
- `0 <= src, dst, k < n`
- `src != dst`

## Hints

- Making at most `k` stops means using at most `k + 1` edges (flights) from the source to the destination.
- For shortest-path problems with a limit on the number of edges, the **Bellman-Ford** algorithm is a very natural choice: each round (iteration) of the algorithm adds 1 to the number of flights used.
- So that a city price updated in a round does not affect another flight in the same round (otherwise you would make more than one stop in a single round), make a copy of the current prices (`tempPrices`) at the start of each round.
- If `prices[dst]` still holds its initial infinite value after `k + 1` rounds, the destination is unreachable; return `-1`.

## Solution

This problem asks for the shortest path from node `src` to node `dst` in a weighted, directed graph using **at most `k + 1` edges**. Standard Dijkstra focuses only on minimizing cost, so it may pick a cheaper path with many stops and exceed the stop limit. Instead, we use a `k + 1`-step version of the **Bellman-Ford** algorithm.

Initially we set the cost of every city other than `src` to infinity (`int.MaxValue`) and `prices[src]` to `0`. Then we scan all the flights `k + 1` times in total (from 0 to `k`):

1. At the start of each round, create `tempPrices`, a copy of the `prices` array.
2. For each flight `[u, v, w]`, if city `u` was reachable at the end of the previous round (`prices[u] != int.MaxValue`) and `prices[u] + w < tempPrices[v]`, update `tempPrices[v]`.
3. When the round ends, assign `prices = tempPrices`.

Using the copy (`tempPrices`) is critical: because we read from the previous round's `prices` and write to `tempPrices`, the costs after round `i` are guaranteed to be the cheapest costs reachable with **at most `i + 1` flights**.

```csharp solution
public class Solution
{
    public int FindCheapestPrice(int n, int[][] flights, int src, int dst, int k)
    {
        int[] prices = new int[n];
        Array.Fill(prices, int.MaxValue);
        prices[src] = 0;

        for (int i = 0; i <= k; i++)
        {
            int[] tempPrices = (int[])prices.Clone();

            foreach (int[] flight in flights)
            {
                int u = flight[0];
                int v = flight[1];
                int price = flight[2];

                if (prices[u] == int.MaxValue)
                    continue;

                if (prices[u] + price < tempPrices[v])
                    tempPrices[v] = prices[u] + price;
            }

            prices = tempPrices;
        }

        return prices[dst] == int.MaxValue ? -1 : prices[dst];
    }
}
```

```typescript solution
function findCheapestPrice(
  n: number,
  flights: number[][],
  src: number,
  dst: number,
  k: number
): number {
  let prices = new Array<number>(n).fill(Infinity);
  prices[src] = 0;

  for (let i = 0; i <= k; i++) {
    const tempPrices = [...prices];

    for (const [u, v, price] of flights) {
      if (prices[u] === Infinity) continue;

      if (prices[u] + price < tempPrices[v]) {
        tempPrices[v] = prices[u] + price;
      }
    }

    prices = tempPrices;
  }

  return prices[dst] === Infinity ? -1 : prices[dst];
}
```

### Complexity

- **Time:** O((k + 1) · E), where `E` is the number of flights in `flights`. We run `k + 1` rounds, each visiting every flight.
- **Space:** O(n), for the `prices` and `tempPrices` arrays that hold the city costs.
