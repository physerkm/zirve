---
title: Kelime Merdiveni
difficulty: hard
tags: [graf, bfs, hash-tablosu, dizgi]
function: ladderLength
params:
  - { name: beginWord, type: "string" }
  - { name: endWord, type: "string" }
  - { name: wordList, type: "List<string>" }
returns: "int"
---

Bir başlangıç kelimesi `beginWord` ile bitiş kelimesi `endWord` arasındaki **dönüşüm dizisi**, `beginWord -> s_1 -> s_2 -> ... -> s_k` biçiminde aşağıdaki kuralları sağlayan bir kelime zinciridir:

- Ardışık her kelime çifti birbirinden **tam olarak tek bir harf** ile farklıdır.
- `1 <= i <= k` için her `s_i` kelimesi `wordList` içinde yer almalıdır. (`beginWord` kelimesinin `wordList` içinde bulunması şart değildir.)
- Son kelime `s_k == endWord` olmalıdır.

İki kelime (`beginWord` ve `endWord`) ve bir sözlük (`wordList`) verildiğinde, `beginWord` kelimesinden `endWord` kelimesine **en kısa dönüşüm dizisindeki kelime sayısını** döndürün. Eğer böyle bir dönüşüm dizisi oluşturulamıyorsa `0` döndürün.

### Örnek 1

```text
Girdi:  beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Çıktı:  5
Açıklama: En kısa dönüşüm dizisi "hit" -> "hot" -> "dot" -> "dog" -> "cog" olup 5 kelimeden oluşur.
```

### Örnek 2

```text
Girdi:  beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]
Çıktı:  0
Açıklama: endWord ("cog") kelime listesinde yer almadığından geçerli bir dönüşüm dizisi yoktur.
```

### Kısıtlar

- `1 <= beginWord.length <= 10`
- `endWord.length == beginWord.length`
- `1 <= wordList.length <= 5000`
- `wordList[i].length == beginWord.length`
- `beginWord`, `endWord` ve `wordList[i]` yalnızca küçük İngilizce harflerden oluşur.
- `beginWord != endWord`
- `wordList` içindeki tüm kelimeler birbirinden farklıdır.

## İpuçları

- Her kelimeyi bir graf düğümü, tek harf farkı olan iki kelime arasındaki geçişi de ağırlıksız ve yönsüz bir kenar olarak düşünün.
- Ağırlıksız bir grafta en kısa yolu bulmak için en uygun algoritma **Genişlik Öncelikli Arama (BFS)**'dir.
- Bir kelimenin komşularını bulmak için sözlükteki tüm kelimelerle tek tek karşılaştırmak O(N²) sürer; bunun yerine kelimenin her harfini `'a'`–`'z'` arası değiştirip oluşan aday kelimenin bir `HashSet` içinde olup olmadığını O(1)'de sorgulayın.
- Ziyaret edilen bir kelimeyi `HashSet` içinden hemen silmek, hem ekstra `visited` kümesi ihtiyacını ortadan kaldırır hem de aynı kelimeye daha uzun bir yoldan tekrar girilmesini önler.

## Çözüm

Problem özünde ağırlıksız bir grafta **en kısa yol** problemidir: her kelime bir düğüm, tek harf değişimiyle birbirine dönüşebilen iki kelime ise komşudur. En kısa dönüşüm zincirini aradığımız için `beginWord`'den başlayarak **katman katman BFS (Genişlik Öncelikli Arama)** uygularız.

Önce `wordList` içindeki tüm kelimeleri O(1) arama yapabilmek için bir `HashSet` (`wordSet`) içine alırız. `endWord` bu kümede yoksa hedefe ulaşmak imkânsızdır; doğrudan `0` döneriz.

BFS kuyruğuna `beginWord`'ü koyup adım sayısını (`steps = 1`) başlatırız. Her katmanda kuyruktaki mevcut kelimeleri çekeriz. Çektiğimiz kelimenin her indeksindeki harfi sırasıyla `'a'`'dan `'z'`'ye kadar değiştirerek olası tüm tek harfli dönüşümleri üretiriz. Üretilen `nextWord` eğer `wordSet` içindeyse, bu kelimeye en kısa yoldan ilk kez ulaştığımızı anlarız: kelimeyi kümeden siler (`wordSet.Remove`) ve kuyruğa ekleriz. `endWord` kelimesine ulaştığımız anda mevcut katman derinliği en kısa dönüşüm dizisinin uzunluğunu verir.

```csharp solution
public class Solution
{
    public int LadderLength(string beginWord, string endWord, IList<string> wordList)
    {
        HashSet<string> wordSet = new HashSet<string>(wordList);
        if (!wordSet.Contains(endWord))
            return 0;

        Queue<string> queue = new Queue<string>();
        queue.Enqueue(beginWord);
        wordSet.Remove(beginWord);

        int steps = 1;

        while (queue.Count > 0)
        {
            int levelSize = queue.Count;

            for (int q = 0; q < levelSize; q++)
            {
                string word = queue.Dequeue();
                if (word == endWord)
                    return steps;

                char[] chars = word.ToCharArray();
                for (int i = 0; i < chars.Length; i++)
                {
                    char original = chars[i];
                    for (char c = 'a'; c <= 'z'; c++)
                    {
                        if (c == original)
                            continue;

                        chars[i] = c;
                        string nextWord = new string(chars);

                        if (wordSet.Remove(nextWord))
                            queue.Enqueue(nextWord);
                    }
                    chars[i] = original;
                }
            }

            steps++;
        }

        return 0;
    }
}
```

```typescript solution
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const wordSet = new Set<string>(wordList);
  if (!wordSet.has(endWord)) return 0;

  let queue: string[] = [beginWord];
  wordSet.delete(beginWord);
  let steps = 1;

  while (queue.length > 0) {
    const nextQueue: string[] = [];

    for (const word of queue) {
      if (word === endWord) return steps;

      const chars = word.split('');
      for (let i = 0; i < chars.length; i++) {
        const original = chars[i];
        for (let code = 97; code <= 122; code++) {
          const c = String.fromCharCode(code);
          if (c === original) continue;

          chars[i] = c;
          const nextWord = chars.join('');

          if (wordSet.delete(nextWord)) {
            nextQueue.push(nextWord);
          }
        }
        chars[i] = original;
      }
    }

    queue = nextQueue;
    steps++;
  }

  return 0;
}
```

### Karmaşıklık

- **Zaman:** O(N · M²). Burada `N` kelime listesindeki kelime sayısı, `M` ise bir kelimenin uzunluğudur. Her kelime kuyruğa en fazla bir kez girer; her kelime için `M` pozisyonda 26 harf denenir ve `M` uzunluğunda yeni bir dizgi oluşturulup kümede sorgulanır (`26 · M · M`).
- **Alan:** O(N · M). `wordSet` ve BFS kuyruğu en fazla `N` adet `M` uzunluklu kelime tutar.

## Testler

```json
[
  { "args": ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], "expected": 5, "sample": true },
  { "args": ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], "expected": 0, "sample": true },
  { "args": ["a", "c", ["a", "b", "c"]], "expected": 2 },
  { "args": ["hot", "dog", ["hot", "dog"]], "expected": 0 },
  { "args": ["hot", "dog", ["hot", "dog", "dot"]], "expected": 3 },
  { "args": ["leet", "code", ["lest", "leet", "lose", "code", "lode", "robe", "lost"]], "expected": 6 },
  { "args": ["red", "tax", ["ted", "tex", "red", "tax", "tad", "den", "rex", "pee"]], "expected": 4 }
]
```
