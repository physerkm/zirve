---
title: Reconstruct Itinerary
---

You are given a list `tickets`, where each entry `[from_i, to_i]` represents a plane ticket (its departure and arrival airports). Reconstruct the itinerary using **all of the tickets exactly once** and return the airports in the order they are visited.

Every itinerary must start at the airport `"JFK"`. If there are multiple valid itineraries, you must return the one that is **smallest in lexical (alphabetical) order** when the airport codes are read as a single sequence.

- For example, the itinerary `["JFK", "LGA"]` is smaller than `["JFK", "LGB"]`, because `"LGA"` comes before `"LGB"` alphabetically.

You are guaranteed that the given tickets form at least one valid itinerary.

### Example 1

```text
Input:  tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]
Output: ["JFK","MUC","LHR","SFO","SJC"]
Explanation: The only itinerary that starts at JFK and uses all tickets is JFK -> MUC -> LHR -> SFO -> SJC.
```

### Example 2

```text
Input:  tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]
Output: ["JFK","ATL","JFK","SFO","ATL","SFO"]
Explanation: Another valid itinerary is ["JFK","SFO","ATL","JFK","ATL","SFO"], but ["JFK","ATL","JFK","SFO","ATL","SFO"] is smaller alphabetically.
```

### Constraints

- `1 <= tickets.length <= 300`
- `tickets[i].length == 2`
- `from_i.length == 3`
- `to_i.length == 3`
- `from_i` and `to_i` consist of uppercase English letters.
- `from_i != to_i`

## Hints

- If you think of each ticket as a directed edge, you are looking for a path that visits every edge exactly once; in graph theory, this is known as an **Eulerian path**.
- To get the alphabetically smallest itinerary, sort the destinations leaving each airport and always try the smallest available destination first.
- When you pick the smallest destination, you may walk into a **dead end** (an airport with no outgoing tickets left) before using up the remaining tickets. That dead-end airport must actually be the **very last** stop of the whole itinerary!
- Adding an airport to the result once it has no tickets left to fly out (post-order DFS) and reversing the list at the end (**Hierholzer's algorithm**) gives the exact answer in O(E log E) time without backtracking.

## Solution

The problem is to find the lexicographically smallest **Eulerian path** in a directed graph that starts at node `"JFK"` and uses every edge exactly once. We use **Hierholzer's algorithm** for this.

First, we collect the destinations for each departure airport in an adjacency list. Since we always want to pick the alphabetically smallest destination, and removing an element from the end of an array (`RemoveAt(Count - 1)` / `pop()`) takes O(1), we sort each neighbor list in **reverse alphabetical** order. That way, the element at the end of the list is always the alphabetically smallest ticket.

Starting from `"JFK"`, we run a depth-first search (`Dfs`):
1. As long as the current airport has unused tickets, we take the smallest destination ticket out of the list and move to that airport.
2. When an airport has no tickets left to fly out (we hit a dead end), we add that airport to the `route` list (post-order).

Since a valid Eulerian path is guaranteed, the first node where we hit a dead end is actually the **final** airport of the whole journey. As we unwind, we also add the cycles in the correct order. Finally, reversing the `route` list gives the itinerary from start to finish.

```csharp solution
public class Solution
{
    public IList<string> FindItinerary(IList<IList<string>> tickets)
    {
        Dictionary<string, List<string>> adj = new Dictionary<string, List<string>>();

        foreach (IList<string> ticket in tickets)
        {
            string from = ticket[0];
            string to = ticket[1];
            if (!adj.TryGetValue(from, out List<string>? list))
            {
                list = new List<string>();
                adj[from] = list;
            }
            list.Add(to);
        }

        // Sort destinations in reverse alphabetical order so we can pop from the end in O(1).
        foreach (List<string> list in adj.Values)
        {
            list.Sort((a, b) => string.CompareOrdinal(b, a));
        }

        List<string> route = new List<string>();

        void Dfs(string airport)
        {
            if (adj.TryGetValue(airport, out List<string>? dests))
            {
                while (dests.Count > 0)
                {
                    string next = dests[dests.Count - 1];
                    dests.RemoveAt(dests.Count - 1);
                    Dfs(next);
                }
            }
            route.Add(airport);
        }

        Dfs("JFK");
        route.Reverse();
        return route;
    }
}
```

```typescript solution
function findItinerary(tickets: string[][]): string[] {
  const adj = new Map<string, string[]>();

  for (const [from, to] of tickets) {
    let list = adj.get(from);
    if (!list) {
      list = [];
      adj.set(from, list);
    }
    list.push(to);
  }

  for (const list of adj.values()) {
    list.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  }

  const route: string[] = [];

  function dfs(airport: string): void {
    const dests = adj.get(airport);
    while (dests && dests.length > 0) {
      const next = dests.pop()!;
      dfs(next);
    }
    route.push(airport);
  }

  dfs("JFK");
  return route.reverse();
}
```

### Complexity

- **Time:** O(E log E), where `E` is the number of tickets (edges). Sorting the neighbor lists takes O(E log E); during the DFS, each ticket is removed from its list and visited exactly once, in O(1).
- **Space:** O(E). The adjacency list, the recursion call stack, and the result array hold at most `E + 1` elements.
