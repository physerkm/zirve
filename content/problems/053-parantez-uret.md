---
title: Parantez Üret
difficulty: medium
tags: [dizgi, geri-izleme, ozyineleme]
function: generateParenthesis
params:
  - { name: n, type: "int" }
returns: "List<string>"
compare: unordered
---
`n` çift parantez verildiğinde, **kurallı (iyi biçimlendirilmiş)** tüm parantez kombinasyonlarını üreten bir fonksiyon yazın.

Kurallı bir parantez dizgisinde her açılış parantezi `'('` kendisinden sonra gelen bir kapanış parantezi `')'` ile eşleşmeli ve hiçbir noktada kapanış parantezi sayısı açılış parantezi sayısını geçmemelidir.

### Örnek 1

```text
Girdi:  n = 3
Çıktı:  ["((()))", "(()())", "(())()", "()(())", "()()()"]
Açıklama: 3 çift parantezle oluşturulabilecek kurallı kombinasyonların tamamı 5 tanedir.
```

### Örnek 2

```text
Girdi:  n = 1
Çıktı:  ["()"]
Açıklama: Tek çift parantezle yalnızca "()" oluşturulabilir.
```

### Kısıtlar

- `1 <= n <= 8`

## İpuçları

- Tüm uzunluğu `2 * n` olan dizgileri üretip sonradan geçerli mi diye kontrol etmek (`2^(2n)` aday) çok yavaştır; yalnızca **geçerli kalmaya devam eden** dalları ilerletin.
- Şu ana kadar eklenen açılış parantezi sayısını `open`, kapanış parantezi sayısını `close` ile takip edin.
- Yeni bir `'('` karakterini ne zaman ekleyebilirsiniz? Henüz `n` tane açılış parantezi kullanmadıysanız (`open < n`).
- Yeni bir `')'` karakterini ne zaman ekleyebilirsiniz? Şu ana kadar açılmış ama kapanmamış en az bir parantez varsa (`close < open`).

## Çözüm

Bu problem **geri izleme (backtracking)** tekniğinin en klasik örneklerinden biridir. Boş bir dizgiden başlayarak her adımda iki karar veririz: `'('` eklemek veya `')'` eklemek. Geçersiz dizgileri hiç üretmemek için iki basit kural uygularız:

1. **Açılış kuralı (`open < n`):** Toplamda en fazla `n` adet `'('` kullanabiliriz. `open < n` olduğu sürece dizginin sonuna `'('` ekleyip özyinelemeli olarak devam edebiliriz.
2. **Kapanış kuralı (`close < open`):** Bir `')'` karakteri ancak daha önce açılmış ve henüz kapanmamış bir `'('` varsa geçerlidir. Dolayısıyla yalnızca `close < open` olduğunda `')'` ekleyebiliriz.

Dizginin uzunluğu `2 * n` değerine ulaştığında (`open == n` ve `close == n`), geçerli bir kombinasyon tamamlanmış demektir; sonuç listesine ekler ve geri döneriz.

```csharp solution
public class Solution
{
    public IList<string> GenerateParenthesis(int n)
    {
        List<string> result = new List<string>();
        char[] current = new char[2 * n];

        void Backtrack(int pos, int open, int close)
        {
            if (pos == 2 * n)
            {
                result.Add(new string(current));
                return;
            }

            if (open < n)
            {
                current[pos] = '(';
                Backtrack(pos + 1, open + 1, close);
            }

            if (close < open)
            {
                current[pos] = ')';
                Backtrack(pos + 1, open, close + 1);
            }
        }

        Backtrack(0, 0, 0);
        return result;
    }
}
```

```typescript solution
function generateParenthesis(n: number): string[] {
  const result: string[] = [];
  const current: string[] = [];

  function backtrack(open: number, close: number): void {
    if (current.length === 2 * n) {
      result.push(current.join(""));
      return;
    }

    if (open < n) {
      current.push("(");
      backtrack(open + 1, close);
      current.pop();
    }

    if (close < open) {
      current.push(")");
      backtrack(open, close + 1);
      current.pop();
    }
  }

  backtrack(0, 0);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(4^n / √n). Üretilen geçerli parantez dizgilerinin sayısı n'inci Catalan sayısı `C_n = (1 / (n + 1)) * C(2n, n) ≈ 4^n / (n√(πn))` kadardır ve her biri O(n) zamanda oluşturulur.
- **Alan:** O(n) (çıktı listesi hariç). Özyineleme çağrı yığınının derinliği ve `current` tamponu en fazla `2n` boyutundadır.

## Testler

```json
[
  { "args": [3], "expected": ["((()))", "(()())", "(())()", "()(())", "()()()"], "sample": true },
  { "args": [1], "expected": ["()"], "sample": true },
  { "args": [2], "expected": ["(())", "()()"] },
  { "args": [4], "expected": ["(((())))", "((()()))", "((())())", "((()))()", "(()(()))", "(()()())", "(()())()", "(())(())", "(())()()", "()((()))", "()(()())", "()(())()", "()()(())", "()()()()"] },
  { "args": [5], "expected": ["((((()))))", "(((()())))", "(((())()))", "(((()))())", "(((())))()", "((()(())))", "((()()()))", "((()())())", "((()()))()", "((())(()))", "((())()())", "((())())()", "((()))(())", "((()))()()", "(()((())))", "(()(()()))", "(()(())())", "(()(()))()", "(()()(()))", "(()()()())", "(()()())()", "(()())(())", "(()())()()", "(())((()))", "(())(()())", "(())(())()", "(())()(())", "(())()()()", "()(((())))", "()((()()))", "()((())())", "()((()))()", "()(()(()))", "()(()()())", "()(()())()", "()(())(())", "()(())()()", "()()((()))", "()()(()())", "()()(())()", "()()()(())", "()()()()()"] },
  { "args": [6], "expected": ["(((((())))))", "((((()()))))", "((((())())))", "((((()))()))", "((((())))())", "((((()))))()", "(((()(()))))", "(((()()())))", "(((()())()))", "(((()()))())", "(((()())))()", "(((())(())))", "(((())()()))", "(((())())())", "(((())()))()", "(((()))(()))", "(((()))()())", "(((()))())()", "(((())))(())", "(((())))()()", "((()((()))))", "((()(()())))", "((()(())()))", "((()(()))())", "((()(())))()", "((()()(())))", "((()()()()))", "((()()())())", "((()()()))()", "((()())(()))", "((()())()())", "((()())())()", "((()()))(())", "((()()))()()", "((())((())))", "((())(()()))", "((())(())())", "((())(()))()", "((())()(()))", "((())()()())", "((())()())()", "((())())(())", "((())())()()", "((()))((()))", "((()))(()())", "((()))(())()", "((()))()(())", "((()))()()()", "(()(((()))))", "(()((()())))", "(()((())()))", "(()((()))())", "(()((())))()", "(()(()(())))", "(()(()()()))", "(()(()())())", "(()(()()))()", "(()(())(()))", "(()(())()())", "(()(())())()", "(()(()))(())", "(()(()))()()", "(()()((())))", "(()()(()()))", "(()()(())())", "(()()(()))()", "(()()()(()))", "(()()()()())", "(()()()())()", "(()()())(())", "(()()())()()", "(()())((()))", "(()())(()())", "(()())(())()", "(()())()(())", "(()())()()()", "(())(((())))", "(())((()()))", "(())((())())", "(())((()))()", "(())(()(()))", "(())(()()())", "(())(()())()", "(())(())(())", "(())(())()()", "(())()((()))", "(())()(()())", "(())()(())()", "(())()()(())", "(())()()()()", "()((((()))))", "()(((()())))", "()(((())()))", "()(((()))())", "()(((())))()", "()((()(())))", "()((()()()))", "()((()())())", "()((()()))()", "()((())(()))", "()((())()())", "()((())())()", "()((()))(())", "()((()))()()", "()(()((())))", "()(()(()()))", "()(()(())())", "()(()(()))()", "()(()()(()))", "()(()()()())", "()(()()())()", "()(()())(())", "()(()())()()", "()(())((()))", "()(())(()())", "()(())(())()", "()(())()(())", "()(())()()()", "()()(((())))", "()()((()()))", "()()((())())", "()()((()))()", "()()(()(()))", "()()(()()())", "()()(()())()", "()()(())(())", "()()(())()()", "()()()((()))", "()()()(()())", "()()()(())()", "()()()()(())", "()()()()()()"] }
]
```
