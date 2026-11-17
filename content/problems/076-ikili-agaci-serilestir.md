---
title: İkili Ağacı Serileştir ve Geri Kur
difficulty: hard
tags: [agac, dfs, tasarim]
kind: class
class: TreeCodec
constructor: []
methods:
  - { name: serialize, params: [{ name: root, type: "TreeNode" }], returns: "string" }
  - { name: deserialize, params: [{ name: data, type: "string" }], returns: "TreeNode" }
---
Serileştirme, bir veri yapısını veya nesneyi bellekte अथवा ağ üzerinden saklanıp iletilebilecek ve daha sonra birebir aynı yapıda geri kurulabilecek bir dizgi (string) biçimine dönüştürme işlemidir.

Bir ikili ağacı serileştiren ve geri kuran `TreeCodec` sınıfını tasarlayın. Çözümünüzün testlerle uyumlu olması için aşağıdaki **Preorder (Kök-Sol-Sağ) virgüllü `"N"` formatını** kullanın:

- `TreeCodec()` dönüştürücü nesnesini oluşturur.
- `serialize(root)` ağacı **Preorder DFS** sırasıyla gezer; düğüm değerlerini virgül (`,`) ile ayırarak yazar ve her `null` (boş) bağlantıyı `"N"` olarak kaydeder. Örneğin `[1, 2, 3]` ağacı `"1,2,N,N,3,N,N"`, boş ağaç (`[]`) ise `"N"` olarak serileştirilir.
- `deserialize(data)` aynı Preorder virgüllü `"N"` formatındaki dizgiyi okuyarak orijinal ikili ağacı geri kurar ve kök düğümünü döndürür.

### Örnek 1

```text
Girdi:
  İşlemler: ["TreeCodec", "serialize", "deserialize"]
  Argümanlar: [[], [[1, 2, 3, null, null, 4, 5]], ["1,2,N,N,3,4,N,N,5,N,N"]]
Çıktı:
  [null, "1,2,N,N,3,4,N,N,5,N,N", [1, 2, 3, null, null, 4, 5]]
Açıklama:
  1 kökünden başlayan Preorder gezinti sırasıyla 1, sol alt ağaç (2, N, N) ve sağ alt ağaç (3, 4, N, N, 5, N, N) değerlerini üretir.
```

### Örnek 2

```text
Girdi:
  İşlemler: ["TreeCodec", "serialize", "deserialize"]
  Argümanlar: [[], [[]], ["N"]]
Çıktı:
  [null, "N", []]
Açıklama:
  Boş ağaç tek bir "N" belirteciyle serileştirilir ve geri okunduğunda null (boş ağaç) döndürür.
```

### Kısıtlar

- Ağaçtaki düğüm sayısı `[0, 10^4]` aralığındadır.
- `-1000 <= Node.val <= 1000`

## İpuçları

- Normal bir Preorder çıktısı tek başına ağacı tekil olarak belirlemeye yetmez; ancak boş çocukları (`null`) `"N"` gibi özel bir belirteçle açıkça yazarsanız ağaç yapısı hiçbir belirsizlik olmadan kodlanmış olur.
- `serialize` içinde bir `List<string>` kullanarak her düğümde değeri (veya `null` ise `"N"`) listeye ekleyip sol ve sağ çocuğa inin; sonunda `string.Join(",", list)` döndürün.
- `deserialize` içinde dizgiyi `Split(',')` ile parçalayın ve okuma konumunu tutan tek bir `index` değişkeniyle aynı Preorder sırasını takip edin.
- Okunan eleman `"N"` ise `null` döndürün; sayı ise yeni `TreeNode` oluşturup önce `node.left`, ardından `node.right` için aynı özyinelemeli fonksiyonu çağırın.

## Çözüm

Normalde tek bir ağaç gezintisi (örneğin yalnızca Preorder) ağacı geri kurmaya yetmez; çünkü hangi düğümün nerede bittiğini bilemeyiz. Ancak her boş (`null`) dalı `"N"` belirteciyle dizgiye dahil ettiğimizde, yaprakların ve tek çocuklu düğümlerin sınırları kesinleşir ve **tek bir Preorder DFS** hem yazma hem de okuma için yeterli hale gelir.

1. **Serileştirme (`serialize`):** Kökten başlayarak Preorder (Kök → Sol → Sağ) sırasıyla ilerleriz. Düğüm `null` ise listeye `"N"` ekler ve döneriz. Değilse düğümün değerini ekler, önce sol alt ağacı sonra sağ alt ağacı serileştiririz.
2. **Geri Kurma (`deserialize`):** Virgülle ayrılmış parçaları (`tokens`) sırayla tüketen bir `index` imleci tutarız. Sıradaki parça `"N"` ise imleci bir ilerletip `null` döndürürüz. Değilse sayıyı okuyup kök düğümü oluştururuz; Preorder sırasında kökün hemen ardından sol alt ağacın tamamı, onun hemen ardından da sağ alt ağacın tamamı geldiği için `node.left = Build()` ve `node.right = Build()` çağrıları ağacı eksiksiz biçimde yeniden kurar.

```csharp solution
public class TreeCodec
{
    public TreeCodec()
    {
    }

    public string Serialize(TreeNode root)
    {
        var tokens = new List<string>();
        SerializeDfs(root, tokens);
        return string.Join(",", tokens);
    }

    private void SerializeDfs(TreeNode node, List<string> tokens)
    {
        if (node == null)
        {
            tokens.Add("N");
            return;
        }

        tokens.Add(node.val.ToString());
        SerializeDfs(node.left, tokens);
        SerializeDfs(node.right, tokens);
    }

    public TreeNode Deserialize(string data)
    {
        string[] tokens = data.Split(',');
        int index = 0;
        return DeserializeDfs(tokens, ref index);
    }

    private TreeNode DeserializeDfs(string[] tokens, ref int index)
    {
        string token = tokens[index++];
        if (token == "N")
            return null;

        var node = new TreeNode(int.Parse(token));
        node.left = DeserializeDfs(tokens, ref index);
        node.right = DeserializeDfs(tokens, ref index);
        return node;
    }
}
```

```typescript solution
class TreeCodec {
  constructor() {}

  serialize(root: TreeNode | null): string {
    const tokens: string[] = [];

    function dfs(node: TreeNode | null): void {
      if (node === null) {
        tokens.push("N");
        return;
      }
      tokens.push(String(node.val));
      dfs(node.left);
      dfs(node.right);
    }

    dfs(root);
    return tokens.join(",");
  }

  deserialize(data: string): TreeNode | null {
    const tokens = data.split(",");
    let index = 0;

    function dfs(): TreeNode | null {
      const token = tokens[index++];
      if (token === "N") return null;

      const node = new TreeNode(Number(token));
      node.left = dfs();
      node.right = dfs();
      return node;
    }

    return dfs();
  }
}
```

### Karmaşıklık

- **Zaman:** O(n). Hem `serialize` hem `deserialize` işleminde her düğüm ve boş bağlantı (`N` belirteci) sabit sayıda (toplam `2n + 1` parça) işlenir.
- **Alan:** O(n). Oluşturulan parça dizisi ve özyineleme çağrı yığını O(n) bellek kullanır.

## Testler

```json
[
  {
    "ops": ["TreeCodec", "serialize", "deserialize"],
    "args": [[], [[1, 2, 3, null, null, 4, 5]], ["1,2,N,N,3,4,N,N,5,N,N"]],
    "expected": [null, "1,2,N,N,3,4,N,N,5,N,N", [1, 2, 3, null, null, 4, 5]],
    "sample": true
  },
  {
    "ops": ["TreeCodec", "serialize", "deserialize"],
    "args": [[], [[]], ["N"]],
    "expected": [null, "N", []],
    "sample": true
  },
  {
    "ops": ["TreeCodec", "serialize", "deserialize"],
    "args": [[], [[1, 2, 3]], ["1,2,N,N,3,N,N"]],
    "expected": [null, "1,2,N,N,3,N,N", [1, 2, 3]]
  },
  {
    "ops": ["TreeCodec", "serialize", "deserialize"],
    "args": [[], [[5]], ["5,N,N"]],
    "expected": [null, "5,N,N", [5]]
  },
  {
    "ops": ["TreeCodec", "serialize", "deserialize"],
    "args": [[], [[1, null, 2, null, 3]], ["1,N,2,N,3,N,N"]],
    "expected": [null, "1,N,2,N,3,N,N", [1, null, 2, null, 3]]
  },
  {
    "ops": ["TreeCodec", "serialize", "deserialize"],
    "args": [[], [[-10, -20, 30, null, -5]], ["-10,-20,N,-5,N,N,30,N,N"]],
    "expected": [null, "-10,-20,N,-5,N,N,30,N,N", [-10, -20, 30, null, -5]]
  }
]
```
