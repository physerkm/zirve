---
title: Course Schedule
---
You have to take a total of `numCourses` courses, numbered from `0` to `numCourses - 1`.

You are given an array of prerequisites `prerequisites`: `prerequisites[i] = [a, b]` means you must complete course `b` before you can take course `a` (`b → a`).

For example, the pair `[0, 1]` means you must finish course `1` before you can take course `0`.

Return `true` if you can complete all courses, and `false` otherwise.

### Example 1

```text
Input:  numCourses = 2, prerequisites = [[1, 0]]
Output:  true
Explanation: There are 2 courses in total. To take course 1, you must first finish course 0; this is possible (0 → 1).
```

### Example 2

```text
Input:  numCourses = 2, prerequisites = [[1, 0], [0, 1]]
Output:  false
Explanation: Course 1 requires course 0, and course 0 requires course 1. Because of the circular dependency, neither can be taken.
```

### Example 3

```text
Input:  numCourses = 4, prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]
Output:  true
Explanation: Take course 0 first, then 1 and 2, and finally course 3 can be completed.
```

### Constraints

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= 5000`
- `prerequisites[i].length == 2`
- `0 <= a, b < numCourses`
- All `prerequisites[i]` pairs are distinct.

## Hints

- Model this problem as a directed graph: each course is a node, and each prerequisite `[a, b]` is an edge in the direction `b → a`.
- Being able to finish all courses is equivalent to the directed graph having **no cycle**.
- You can take courses with no prerequisites (in-degree `indegree == 0`) right away.
- For each course you take, decrement by 1 the `indegree` of the courses it unlocks; add those that drop to `0` to the queue (Kahn's algorithm).

## Solution

The problem asks whether a directed graph has a **cycle** (cycle detection), or equivalently whether a **topological sort** is possible. The cleanest method, with no risk of recursion stack overflow, is **Kahn's algorithm (indegree BFS)**.

1. **Build the graph and in-degrees:** For each `[course, pre]` pair, add the edge `pre → course` to the adjacency list (`adj[pre]`) and increment `indegree[course]` (the number of remaining prerequisites for this course) by 1.
2. **Start with courses that have no prerequisites:** Initially, put every course with `indegree[i] == 0` in a queue (`Queue`); these courses don't depend on any other course and can be taken right away.
3. **Proceed by unlocking courses:** Each course `cur` dequeued counts as completed (`completed++`). For each course `next` that depends on it, decrement `indegree[next]` by 1. If `indegree[next] == 0`, all prerequisites of `next` are complete; add it to the queue too.
4. **Cycle check:** If the graph has a cycle, the `indegree` of no node in that cycle ever drops to `0`, so none of them can enter the queue. When the loop ends, if `completed == numCourses`, all courses could be taken (`true`); otherwise there is a cycle (`false`).

```csharp solution
public class Solution
{
    public bool CanFinish(int numCourses, int[][] prerequisites)
    {
        List<int>[] adj = new List<int>[numCourses];
        for (int i = 0; i < numCourses; i++)
            adj[i] = new List<int>();

        int[] indegree = new int[numCourses];

        // 1. Build the adjacency list and each course's prerequisite count (indegree).
        foreach (int[] edge in prerequisites)
        {
            int course = edge[0];
            int pre = edge[1];
            adj[pre].Add(course);
            indegree[course]++;
        }

        // 2. Enqueue the courses that have no prerequisites (indegree == 0).
        Queue<int> queue = new Queue<int>();
        for (int i = 0; i < numCourses; i++)
        {
            if (indegree[i] == 0)
                queue.Enqueue(i);
        }

        // 3. Complete courses in order and decrement the prerequisite counts of dependent courses.
        int completed = 0;
        while (queue.Count > 0)
        {
            int cur = queue.Dequeue();
            completed++;

            foreach (int next in adj[cur])
            {
                indegree[next]--;
                if (indegree[next] == 0)
                    queue.Enqueue(next);
            }
        }

        return completed == numCourses;
    }
}
```

```typescript solution
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  const indegree = new Array<number>(numCourses).fill(0);

  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    indegree[course]++;
  }

  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (indegree[i] === 0) {
      queue.push(i);
    }
  }

  let completed = 0;
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    completed++;

    for (const next of adj[cur]) {
      indegree[next]--;
      if (indegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return completed === numCourses;
}
```

### Complexity

- **Time:** O(V + E), where `V = numCourses` (the number of courses) and `E = prerequisites.length` (the number of prerequisites). Each course enters the queue at most once, and each edge is processed exactly once.
- **Space:** O(V + E). The adjacency list uses O(V + E) memory; the `indegree` array and the BFS queue use O(V).
