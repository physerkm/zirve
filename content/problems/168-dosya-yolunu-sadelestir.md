---
title: Dosya Yolunu Sadeleştir
difficulty: medium
tags: [yigin, dizgi]
function: simplifyPath
params:
  - { name: path, type: "string" }
returns: "string"
---
Unix tarzı bir dosya sistemine ait mutlak yol dizgisi `path` veriliyor (`path` her zaman `'/'` karakteriyle başlar). Bu yolu **basitleştirilmiş kurallı (canonical) yola** dönüştürün.

Unix tarzı dosya sisteminde:
- Tek nokta `'.'` mevcut dizini temsil eder.
- Çift nokta `'..'` bir üst dizini temsil eder.
- Ardışık birden fazla eğik çizgi (`'//'`, `'///'` vb.) tek bir `'/'` olarak değerlendirilir.
- `'.'` ve `'..'` dışındaki her nokta dizisi (`'...'`, `'....'` vb.) geçerli bir dosya veya dizin adı olarak kabul edilir.

Basitleştirilmiş kurallı yol şu kurallara uymalıdır:
- Tek bir eğik çizgi `'/'` ile başlamalıdır.
- İki dizin adı arasında yalnızca tek bir `'/'` bulunmalıdır.
- Kök dizin (`"/"`) hariç yolun sonunda `'/'` bulunmamalıdır.
- Mevcut veya üst dizini belirten `'.'` ya da `'..'` bileşenleri içermemelidir.

### Örnek 1

```text
Girdi:  path = "/home/"
Çıktı:  "/home"
Açıklama: Kök dizin dışındaki yollarda sondaki eğik çizgi kaldırılır.
```

### Örnek 2

```text
Girdi:  path = "/home//foo/"
Çıktı:  "/home/foo"
Açıklama: Ardışık eğik çizgiler tek bir '/' ile değiştirilir.
```

### Örnek 3

```text
Girdi:  path = "/home/user/Documents/../Pictures"
Çıktı:  "/home/user/Pictures"
Açıklama: ".." bileşeni bir üst dizine ("user") geri çıkar.
```

### Örnek 4

```text
Girdi:  path = "/../"
Çıktı:  "/"
Açıklama: Kök dizinin bir üst dizini yoktur; kök dizinde kalınır.
```

### Kısıtlar

- `1 <= path.length <= 3000`
- `path` İngilizce harfler, rakamlar, nokta `'.'`, eğik çizgi `'/'` veya alt çizgi `'_'` karakterlerinden oluşur.
- `path` geçerli bir mutlak Unix yoludur.

## İpuçları

- Yolu `'/'` karakterine göre böldüğünüzde (`Split('/')`) elinize dizin adları, `""` (ardışık veya sondaki `'/'` kaynaklı boş parçalar), `"."` ve `".."` gelir.
- `""` ve `"."` parçaları mevcut dizini değiştirmediği için doğrudan atlanabilir.
- `".."` geldiğinde en son girilen dizinden çıkmamız gerekir; "son girenin ilk çıkması" (LIFO) davranışı için bir yığın (`Stack`) idealdir.
- Yığın boşken `".."` gelirse kök dizindeyiz demektir; hiçbir şey yapmadan devam edin.

## Çözüm

Bir dosya yolunda ilerlerken her dizin adı bizi bir alt klasöre sokar, `".."` ise en son girdiğimiz klasörden bir üst klasöre geri çıkarır. Bu "en son girilen dizini geri alma" işlemi doğal olarak bir **yığın (Stack)** yapısı gerektirir.

Önce `path.Split('/')` ile yolu eğik çizgilerden böleriz. Elde ettiğimiz her `part` parçası için:
1. Parça boşsa (`""`) veya `"."` ise mevcut konum değişmez; atlarız.
2. Parça `".."` ise ve yığın boş değilse `stack.Pop()` ile en son girdiğimiz dizini yığından çıkarırız (yığın boşsa zaten kök dizindeyizdir).
3. Diğer tüm parçalar (`"home"`, `"..."` vb.) geçerli dizin adıdır; `stack.Push(part)` ile yığına ekleriz.

Son olarak yığında kalan dizin adlarını kökten uca doğru `"/"` ile birleştirip başına `"/"` ekleyerek döndürürüz.

```csharp solution
public class Solution
{
    public string SimplifyPath(string path)
    {
        Stack<string> stack = new Stack<string>();
        string[] parts = path.Split('/');

        foreach (string part in parts)
        {
            if (part == "" || part == ".")
            {
                continue;
            }

            if (part == "..")
            {
                if (stack.Count > 0)
                {
                    stack.Pop();
                }
            }
            else
            {
                stack.Push(part);
            }
        }

        string[] dirs = stack.ToArray();
        Array.Reverse(dirs);
        return "/" + string.Join("/", dirs);
    }
}
```

```typescript solution
function simplifyPath(path: string): string {
  const stack: string[] = [];
  const parts = path.split('/');

  for (const part of parts) {
    if (part === '' || part === '.') {
      continue;
    }

    if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      stack.push(part);
    }
  }

  return '/' + stack.join('/');
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizgiyi `'/'` ile bölmek, her parçayı yığında işlemek ve sonucu birleştirmek toplamda O(n) sürer.
- **Alan:** O(n). Bölünen parçalar ve yığın en fazla O(n) bellek kullanır.

## Testler

```json
[
  { "args": ["/home/"], "expected": "/home", "sample": true },
  { "args": ["/home//foo/"], "expected": "/home/foo", "sample": true },
  { "args": ["/home/user/Documents/../Pictures"], "expected": "/home/user/Pictures", "sample": true },
  { "args": ["/../"], "expected": "/" },
  { "args": ["/.../a/../b/c/../d/./"], "expected": "/.../b/d" },
  { "args": ["/a/./b/../../c/"], "expected": "/c" },
  { "args": ["/a/../../b/../c//.//"], "expected": "/c" },
  { "args": ["///"], "expected": "/" }
]
```
