---
title: Design Twitter
---
Design a simplified version of Twitter where users can post tweets, follow and unfollow each other, and see the **10 most recent tweets** in their news feed.

Implement the `Twitter` class:

- `Twitter()` initializes an empty system.
- `postTweet(userId, tweetId)` composes a new tweet with ID `tweetId` by the user `userId`. Each call is given a unique `tweetId`.
- `getNewsFeed(userId)` returns the IDs of the 10 most recent tweets in the user's news feed, ordered **from most recent to least recent**. The feed consists of the user's own tweets and the tweets of the users they follow.
- `follow(followerId, followeeId)` makes `followerId` start following `followeeId`.
- `unfollow(followerId, followeeId)` makes `followerId` stop following `followeeId`.

### Example

```text
Operations: Twitter, postTweet(1, 5), getNewsFeed(1), follow(1, 2), postTweet(2, 6), getNewsFeed(1), unfollow(1, 2), getNewsFeed(1)
Output:     null,    null,            [5],            null,         null,            [6, 5],         null,           [5]
```

### Constraints

- `1 <= userId, followerId, followeeId <= 500`
- `0 <= tweetId <= 10^4`
- All tweet IDs are unique.
- At most `3 * 10^4` calls are made in total.
- A user may try to follow themselves; a user always sees their own tweets.

## Hints

- Give every tweet an increasing timestamp; that makes "most recent" comparable.
- Keep a list of tweets and a set of followees per user.
- The feed is a merge of several **sorted** lists (as in "Merge K Sorted Lists"). Put the most recent tweet of each list into a max-heap and pull 10 tweets.

## Solution

### Timestamps, sets, and a k-way merge

- `postTweet`: A global counter gives each tweet an increasing time; the tweet is appended to the end of the user's list as `(time, id)`. The list is naturally sorted by time.
- `follow` / `unfollow`: The users someone follows are kept in a hash set. Following yourself is ignored.
- `getNewsFeed`: For the user and everyone they follow, the **last** tweet of each list goes into a max-heap (keyed by time). Pop the most recent tweet from the heap and push the previous tweet of the same list. Stop once you have 10 tweets or the heap is empty.

```csharp solution
public class Twitter
{
    private int time;
    private readonly Dictionary<int, List<(int Time, int Id)>> tweets = new();
    private readonly Dictionary<int, HashSet<int>> following = new();

    public void PostTweet(int userId, int tweetId)
    {
        if (!tweets.TryGetValue(userId, out var list))
        {
            list = new List<(int Time, int Id)>();
            tweets[userId] = list;
        }

        list.Add((time++, tweetId));
    }

    public IList<int> GetNewsFeed(int userId)
    {
        var users = new HashSet<int> { userId };
        if (following.TryGetValue(userId, out var followees))
        {
            users.UnionWith(followees);
        }

        // Priority: negated time, so the most recent tweet comes out first.
        var heap = new PriorityQueue<(int User, int Index), int>();
        foreach (var user in users)
        {
            if (tweets.TryGetValue(user, out var list) && list.Count > 0)
            {
                heap.Enqueue((user, list.Count - 1), -list[^1].Time);
            }
        }

        var feed = new List<int>();
        while (feed.Count < 10 && heap.Count > 0)
        {
            var (user, index) = heap.Dequeue();
            var list = tweets[user];
            feed.Add(list[index].Id);
            if (index > 0)
            {
                heap.Enqueue((user, index - 1), -list[index - 1].Time);
            }
        }

        return feed;
    }

    public void Follow(int followerId, int followeeId)
    {
        if (followerId == followeeId)
        {
            return;
        }

        if (!following.TryGetValue(followerId, out var set))
        {
            set = new HashSet<int>();
            following[followerId] = set;
        }

        set.Add(followeeId);
    }

    public void Unfollow(int followerId, int followeeId)
    {
        if (following.TryGetValue(followerId, out var set))
        {
            set.Remove(followeeId);
        }
    }
}
```

```typescript solution
class Twitter {
  private time = 0;
  private tweets = new Map<number, [number, number][]>();
  private following = new Map<number, Set<number>>();

  postTweet(userId: number, tweetId: number): void {
    let list = this.tweets.get(userId);
    if (list === undefined) {
      list = [];
      this.tweets.set(userId, list);
    }

    list.push([this.time++, tweetId]);
  }

  getNewsFeed(userId: number): number[] {
    const users = new Set<number>([userId, ...(this.following.get(userId) ?? [])]);

    // Cursors pointing to each user's next tweet; since the number of users is small,
    // a linear scan to pick the most recent one works well enough as a "heap".
    const cursors: { list: [number, number][]; index: number }[] = [];
    for (const user of users) {
      const list = this.tweets.get(user);
      if (list !== undefined && list.length > 0) {
        cursors.push({ list, index: list.length - 1 });
      }
    }

    const feed: number[] = [];
    while (feed.length < 10) {
      let best = -1;
      for (let i = 0; i < cursors.length; i++) {
        const cursor = cursors[i];
        if (cursor.index < 0) continue;
        if (best === -1 || cursor.list[cursor.index][0] > cursors[best].list[cursors[best].index][0]) {
          best = i;
        }
      }

      if (best === -1) break;
      const cursor = cursors[best];
      feed.push(cursor.list[cursor.index][1]);
      cursor.index--;
    }

    return feed;
  }

  follow(followerId: number, followeeId: number): void {
    if (followerId === followeeId) return;
    let set = this.following.get(followerId);
    if (set === undefined) {
      set = new Set<number>();
      this.following.set(followerId, set);
    }

    set.add(followeeId);
  }

  unfollow(followerId: number, followeeId: number): void {
    this.following.get(followerId)?.delete(followeeId);
  }
}
```

### Complexity

- **Time:** `postTweet`, `follow`, `unfollow` are O(1). `getNewsFeed` is O(f log f), where `f` is the number of followed users (the `f` items are enqueued one by one, then the 10 pops take O(10 log f)).
- **Space:** O(number of tweets + number of follow relationships).

Collecting all tweets and sorting them also gives the right answer, but it takes O(T log T). With a heap, you pull only the 10 tweets you need. TypeScript has no built-in priority queue, so the TypeScript solution picks the most recent cursor with a linear scan at each step; that costs O(10 × f) and applies the same merge idea.
