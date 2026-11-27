---
title: Course Schedule II
---
You have to take a total of `numCourses` courses, numbered from `0` to `numCourses - 1`.

You are given an array of prerequisites `prerequisites`: `prerequisites[i] = [a, b]` means you must finish course `b` before you can take course `a` (`b → a`).

Return the **order of courses** you should take to finish all courses. If there are several valid orderings, you may return any of them. If it is impossible to finish all courses (there is a cycle), return **an empty array** (`[]`).

### Example 1

```text
Input:  numCourses = 2, prerequisites = [[1, 0]]
Output: [0, 1]
Explanation: There are 2 courses in total. To take course 1, you must first finish course 0. So the correct order is [0, 1].
```

### Example 2

```text
Input:  numCourses = 4, prerequisites = [[1, 0], [2, 1], [3, 2], [3, 0]]
Output: [0, 1, 2, 3]
Explanation: Taking course 1 after course 0, course 2 after course 1, and course 3 last satisfies all prerequisites.
```

### Example 3

```text
Input:  numCourses = 1, prerequisites = []
Output: [0]
Explanation: There is a single course with no prerequisites.
```

### Constraints

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= numCourses * (numCourses - 1)`
- `prerequisites[i].length == 2`
- `0 <= a, b < numCourses`
- `a != b`
- All `[a, b]` pairs are distinct.

## Hints

- This problem asks you to produce a **topological sort** of a directed graph.
- Use Kahn's algorithm (indegree BFS) to track the number of remaining prerequisites (`indegree`) for each course.
- Append every course you take out of the queue to the result array (`order`) in order.
- If, when the queue is empty, the number of courses in the result array is less than `numCourses`, the graph has a cycle; in that case, return an empty array `[]`.

## Solution

In **Course Schedule I**, we only counted whether all courses could be finished. In this problem, we record the courses that come out of the queue, in order, in an `order` array, which gives us a valid **topological sort**.

1. For each prerequisite `[course, pre]`, we add the directed edge `pre → course` to the adjacency list (`adj[pre]`) and increment `indegree[course]` by 1.
2. At the start, we add the courses with no prerequisites (`indegree[i] == 0`) to the queue (`Queue`).
3. Until the queue is empty:
   - Take a course `cur` out of the queue and write it to the result array with `order[idx++] = cur`.
   - For each course `next` that `cur` unlocks, decrement `indegree[next]` by 1; add the ones that drop to `0` to the queue.
4. At the end of the loop, if `idx == numCourses`, all courses have been arranged in a valid order, and we return the `order` array. Otherwise, a cycle has prevented some courses from being taken; we return an empty array (`Array.Empty<int>()`).

```csharp solution
public class Solution
{
    public int[] FindOrder(int numCourses, int[][] prerequisites)
    {
        List<int>[] adj = new List<int>[numCourses];
        for (int i = 0; i < numCourses; i++)
            adj[i] = new List<int>();

        int[] indegree = new int[numCourses];

        foreach (int[] edge in prerequisites)
        {
            int course = edge[0];
            int pre = edge[1];
            adj[pre].Add(course);
            indegree[course]++;
        }

        Queue<int> queue = new Queue<int>();
        for (int i = 0; i < numCourses; i++)
        {
            if (indegree[i] == 0)
                queue.Enqueue(i);
        }

        int[] order = new int[numCourses];
        int idx = 0;

        while (queue.Count > 0)
        {
            int cur = queue.Dequeue();
            order[idx++] = cur;

            foreach (int next in adj[cur])
            {
                indegree[next]--;
                if (indegree[next] == 0)
                    queue.Enqueue(next);
            }
        }

        return idx == numCourses ? order : Array.Empty<int>();
    }
}
```

```typescript solution
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
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

  const order: number[] = [];
  let head = 0;

  while (head < queue.length) {
    const cur = queue[head++];
    order.push(cur);

    for (const next of adj[cur]) {
      indegree[next]--;
      if (indegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return order.length === numCourses ? order : [];
}
```

### Complexity

- **Time:** O(V + E), where `V = numCourses` and `E = prerequisites.length`. Each node enters the queue and the result array at most once, and each edge is examined exactly once.
- **Space:** O(V + E). The adjacency list uses O(V + E), and the `indegree` array, the queue, and the result array use O(V).
