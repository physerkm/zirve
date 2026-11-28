---
title: Twitter Tasarla
difficulty: medium
tags: [tasarim, heap, hash-tablosu, bagli-liste]
kind: class
class: Twitter
constructor: []
methods:
  - { name: postTweet, params: [{ name: userId, type: "int" }, { name: tweetId, type: "int" }], returns: "void" }
  - { name: getNewsFeed, params: [{ name: userId, type: "int" }], returns: "List<int>" }
  - { name: follow, params: [{ name: followerId, type: "int" }, { name: followeeId, type: "int" }], returns: "void" }
  - { name: unfollow, params: [{ name: followerId, type: "int" }, { name: followeeId, type: "int" }], returns: "void" }
---
Kullanıcıların tweet atabildiği, birbirini takip edip takipten çıkabildiği ve haber akışında **en yeni 10 tweet'i** görebildiği basitleştirilmiş bir Twitter tasarlayın.

`Twitter` sınıfını gerçekleştirin:

- `Twitter()` boş bir sistem oluşturur.
- `postTweet(userId, tweetId)` `userId` kullanıcısı adına `tweetId` kimlikli yeni bir tweet atar. Her çağrıda benzersiz bir `tweetId` verilir.
- `getNewsFeed(userId)` kullanıcının haber akışındaki en yeni 10 tweet'in kimliklerini **en yeniden en eskiye** döndürür. Akış, kullanıcının kendi tweet'leri ile takip ettiği kullanıcıların tweet'lerinden oluşur.
- `follow(followerId, followeeId)` `followerId`, `followeeId`'yi takip etmeye başlar.
- `unfollow(followerId, followeeId)` `followerId`, `followeeId`'yi takipten çıkar.

### Örnek

```text
İşlemler:  Twitter, postTweet(1, 5), getNewsFeed(1), follow(1, 2), postTweet(2, 6), getNewsFeed(1), unfollow(1, 2), getNewsFeed(1)
Çıktı:     null,    null,            [5],            null,         null,            [6, 5],         null,           [5]
```

### Kısıtlar

- `1 <= userId, followerId, followeeId <= 500`
- `0 <= tweetId <= 10^4`
- Bütün tweet kimlikleri birbirinden farklıdır.
- Toplamda en fazla `3 * 10^4` çağrı yapılır.
- Bir kullanıcı kendini takip etmeye çalışabilir; kullanıcı kendi tweet'lerini her zaman görür.

## İpuçları

- Her tweet'e artan bir zaman damgası verin; "en yeni" böylece karşılaştırılabilir olur.
- Kullanıcı başına tweet listesi ve takip edilenler kümesi tutun.
- Akış, birkaç **sıralı** listenin birleştirilmesidir ("K Sıralı Listeyi Birleştir"). Her listenin en yeni tweet'ini bir max-heap'e koyun ve 10 tweet çekin.

## Çözüm

### Zaman damgası, kümeler ve k-yollu birleştirme

- `postTweet`: Genel bir sayaç her tweet'e artan bir zaman verir; tweet, kullanıcının listesinin sonuna `(zaman, id)` olarak eklenir. Liste kendiliğinden zamana göre sıralıdır.
- `follow` / `unfollow`: Kullanıcının takip ettikleri bir hash kümesinde tutulur. Kendini takip etme göz ardı edilir.
- `getNewsFeed`: Kullanıcının kendisi ve takip ettikleri için her listenin **son** tweet'i bir max-heap'e (zamana göre) konur. Heap'ten en yeni tweet çekilir ve aynı listenin bir önceki tweet'i heap'e eklenir. 10 tweet toplanınca ya da heap boşalınca durulur.

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

        // Öncelik: zamanın tersi, böylece en yeni tweet önce çıkar.
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

    // Her kullanıcının sıradaki tweet'ini gösteren işaretçiler; en yeniyi seçmek için
    // kullanıcı sayısı küçük olduğundan doğrusal tarama yeterli bir "heap" işlevi görür.
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

### Karmaşıklık

- **Zaman:** `postTweet`, `follow`, `unfollow` O(1). `getNewsFeed` O(f log f); `f` takip edilen kullanıcı sayısı (heap'e `f` öğe tek tek eklenir, ardından 10 çekme O(10 log f) sürer).
- **Alan:** O(tweet sayısı + takip ilişkisi sayısı).

Bütün tweet'leri toplayıp sıralamak da doğru sonuç verir, ama O(T log T) sürer. Heap ile yalnızca gereken 10 tweet çekilir. TypeScript çözümünde hazır öncelik kuyruğu olmadığı için her adımda en yeni işaretçi doğrusal taramayla seçilir; bu O(10 × f) eder ve aynı birleştirme fikrini uygular.

## Testler

```json
[
  {
    "ops": ["Twitter", "postTweet", "getNewsFeed", "follow", "postTweet", "getNewsFeed", "unfollow", "getNewsFeed"],
    "args": [[], [1, 5], [1], [1, 2], [2, 6], [1], [1, 2], [1]],
    "expected": [null, null, [5], null, null, [6, 5], null, [5]],
    "sample": true
  },
  {
    "ops": ["Twitter", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "postTweet", "getNewsFeed"],
    "args": [[], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1]],
    "expected": [null, null, null, null, null, null, null, null, null, null, null, null, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]]
  },
  {
    "ops": ["Twitter", "postTweet", "follow", "getNewsFeed", "unfollow", "getNewsFeed", "postTweet", "follow", "getNewsFeed"],
    "args": [[], [1, 1], [1, 1], [1], [1, 1], [1], [2, 2], [1, 2], [1]],
    "expected": [null, null, null, [1], null, [1], null, null, [2, 1]]
  },
  {
    "ops": ["Twitter", "postTweet", "postTweet", "follow", "postTweet", "getNewsFeed", "getNewsFeed", "getNewsFeed"],
    "args": [[], [1, 10], [2, 20], [2, 1], [1, 30], [2], [1], [3]],
    "expected": [null, null, null, null, null, [30, 20, 10], [30, 10], []]
  }
]
```
