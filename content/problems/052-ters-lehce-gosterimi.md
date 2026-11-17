---
title: Ters Lehçe Gösterimini Hesapla
difficulty: medium
tags: [yigin, dizi]
function: evalRPN
params:
  - { name: tokens, type: "string[]" }
returns: "int"
---
**Ters Lehçe Gösterimi (Reverse Polish Notation — RPN)** ile verilmiş bir aritmetik ifadeyi temsil eden `tokens` dizisi veriliyor. İfadenin değerini hesaplayıp tam sayı olarak döndürün.

Geçerli operatörler `'+'`, `'-'`, `'*'` ve `'/'` karakterleridir. Her işlenen (operand) bir tam sayı veya başka bir alt ifadenin sonucu olabilir.

- İki tam sayı arasındaki bölme işlemi **sıfıra doğru budanır (truncate toward zero)**.
- Sıfıra bölme işlemi bulunmaz.
- Girdi her zaman geçerli bir Ters Lehçe Gösterimi ifadesidir.

### Örnek 1

```text
Girdi:  tokens = ["2", "1", "+", "3", "*"]
Çıktı:  9
Açıklama: ((2 + 1) * 3) = 9
```

### Örnek 2

```text
Girdi:  tokens = ["4", "13", "5", "/", "+"]
Çıktı:  6
Açıklama: (4 + (13 / 5)) = 4 + 2 = 6
```

### Örnek 3

```text
Girdi:  tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]
Çıktı:  22
Açıklama:
((10 * (6 / ((9 + 3) * -11))) + 17) + 5
= ((10 * (6 / -132)) + 17) + 5
= ((10 * 0) + 17) + 5
= 22
```

### Kısıtlar

- `1 <= tokens.length <= 10^4`
- `tokens[i]` ya `"+", "-", "*", "/"` operatörlerinden biridir ya da `[-200, 200]` aralığında bir tam sayı dizgisidir.

## İpuçları

- Ters Lehçe Gösteriminde her operatör, kendisinden hemen önce gelen son iki değerin üzerine uygulanır. "En son eklenen iki elemanı çekme" ihtiyacı doğrudan **Yığın (Stack)** veri yapısını işaret eder.
- Diziyi soldan sağa tarayın: eleman bir sayıysa yığına itin (`Push`).
- Eleman bir operatörse yığından iki sayı çekin (`Pop`), işlemi uygulayın ve sonucu tekrar yığına itin.
- Çıkarma ve bölme işlemlerinde işlenenlerin sırasına dikkat edin: yığından **ilk çekilen** sayı sağdaki işlenen (`b`), **ikinci çekilen** sayı soldaki işlenendir (`a`); yani işlem `a - b` ve `a / b` olmalıdır.

## Çözüm

Ters Lehçe Gösteriminde (postfix) paranteze ihtiyaç duyulmamasının sebebi, her operatörün en son üretilmiş iki sayı üzerinde çalışmasıdır. Bu davranışı bir **yığın (`Stack<int>`)** ile doğrudan modelleyebiliriz:

1. `tokens` dizisindeki her elemanı sırayla okuruz.
2. Eleman bir sayıysa tam sayıya çevirip yığına iteriz.
3. Eleman `+`, `-`, `*`, `/` operatörlerinden biriyse:
   - Yığının tepesinden önce ikinci işleneni (`b = stack.Pop()`), ardından birinci işleneni (`a = stack.Pop()`) çekeriz.
   - `a (op) b` işlemini hesaplayıp sonucu tekrar yığına iteriz. (C#'ta tam sayı bölmesi `a / b` doğal olarak sıfıra doğru budanır; JavaScript/TypeScript'te `(a / b) | 0` veya `Math.trunc` kullanılır.)
4. Dizi bittiğinde yığında kalan tek eleman ifadenin sonucudur.

```csharp solution
public class Solution
{
    public int EvalRPN(string[] tokens)
    {
        Stack<int> stack = new Stack<int>();

        foreach (string token in tokens)
        {
            if (token == "+" || token == "-" || token == "*" || token == "/")
            {
                int b = stack.Pop();
                int a = stack.Pop();

                int res = token switch
                {
                    "+" => a + b,
                    "-" => a - b,
                    "*" => a * b,
                    _ => a / b
                };

                stack.Push(res);
            }
            else
            {
                stack.Push(int.Parse(token));
            }
        }

        return stack.Pop();
    }
}
```

```typescript solution
function evalRPN(tokens: string[]): number {
  const stack: number[] = [];

  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const b = stack.pop()!;
      const a = stack.pop()!;

      let res: number;
      if (token === "+") res = a + b;
      else if (token === "-") res = a - b;
      else if (token === "*") res = a * b;
      else res = (a / b) | 0;

      stack.push(res);
    } else {
      stack.push(Number(token));
    }
  }

  return stack.pop()!;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her sembol bir kez okunur; yığına ekleme ve çıkarma işlemleri O(1) sürer.
- **Alan:** O(n). Yığında aynı anda en fazla O(n) sayı tutulur.

## Testler

```json
[
  { "args": [["2", "1", "+", "3", "*"]], "expected": 9, "sample": true },
  { "args": [["4", "13", "5", "/", "+"]], "expected": 6, "sample": true },
  { "args": [["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]], "expected": 22, "sample": true },
  { "args": [["42"]], "expected": 42 },
  { "args": [["5", "3", "-"]], "expected": 2 },
  { "args": [["-7", "2", "/"]], "expected": -3 },
  { "args": [["3", "-4", "+"]], "expected": -1 },
  { "args": [["15", "7", "1", "1", "+", "-", "/", "3", "*", "2", "1", "1", "+", "+", "-"]], "expected": 5 }
]
```
