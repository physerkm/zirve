---
title: Temel Hesap Makinesi
difficulty: hard
tags: [yigin, dizgi, matematik]
function: calculate
params:
  - { name: s, type: "string" }
returns: "int"
---
Geçerli bir matematiksel ifadeyi temsil eden `s` dizgisi veriliyor. Bu ifadeyi hesaplayan temel bir hesap makinesi gerçekleyin ve hesaplama sonucunu döndürün.

Dizgi; rakamlardan (`0-9`), toplama (`'+'`), çıkarma (`'-'`), parantez (`'('`, `')'`) ve boşluk (`' '`) karakterlerinden oluşur. `'-'` karakteri tekli (unary) operatör olarak da kullanılabilir (örneğin `"-1"` veya `"-(2 + 3)"` geçerlidir).

**Not:** Dizgileri matematiksel ifade olarak değerlendiren `eval()` gibi yerleşik fonksiyonları kullanmamalısınız.

### Örnek 1

```text
Girdi:  s = "1 + 1"
Çıktı:  2
Açıklama: 1 ile 1'in toplamı 2'dir.
```

### Örnek 2

```text
Girdi:  s = " 2-1 + 2 "
Çıktı:  3
Açıklama: Boşluklar yok sayılır; 2 - 1 + 2 = 3.
```

### Örnek 3

```text
Girdi:  s = "(1+(4+5+2)-3)+(6+8)"
Çıktı:  23
Açıklama: İç parantezlerden dışarı doğru: (1 + 11 - 3) + 14 = 9 + 14 = 23.
```

### Kısıtlar

- `1 <= s.length <= 3 * 10^5`
- `s` rakamlar, `'+'`, `'-'`, `'('`, `')'` ve `' '` karakterlerinden oluşur.
- `s` geçerli bir matematiksel ifadeyi temsil eder.
- `'+'` tekli (unary) operatör olarak kullanılmaz (`"+1"` veya `"+(2 + 3)"` gibi ifadeler verilmez).
- `'-'` tekli operatör olarak kullanılabilir (`"-1"` ve `"-(2 + 3)"` geçerlidir).
- Girdide ardışık iki operatör bulunmaz.
- Her sayı ve ara hesaplama sonucu 32-bit işaretli tam sayı (`int`) sınırları içinde kalır.

## İpuçları

- Çarpma ve bölme olmadığı için işlem önceliğini yalnızca parantezler belirler; her çıkarma işlemini bir sonraki sayının işaretini `-1` yapmak olarak düşünebilirsiniz.
- Çok basamaklı sayıları okurken rakam gördükçe `number = number * 10 + (c - '0')` ile sayıyı biriktirin.
- `'('` karakteriyle karşılaştığınızda, o ana kadar biriken `result` ve parantezin önündeki `sign` değerini bir yığına (`Stack`) kaydedip yeni parantez içi için `result = 0` ve `sign = 1` ile temiz bir başlangıç yapın.
- `')'` karakterine geldiğinizde parantez içi sonucu önce yığının tepesindeki işaretle çarpın, ardından yığındaki bir önceki ara sonuçla toplayın.

## Çözüm

İfadede yalnızca toplama, çıkarma ve parantezler yer aldığından her terimi işaretiyle (`+1` veya `-1`) birlikte `result` değişkenine ekleyerek soldan sağa tek geçişte ilerleyebiliriz.

Üç temel durum değişkeni tutarız:
1. `result`: Mevcut parantez seviyesinde o ana kadar hesaplanan toplam.
2. `number`: Okunmakta olan çok basamaklı sayı.
3. `sign`: Bir sonraki sayının veya parantezin işareti (`+1` ya da `-1`).

Dizgiyi karakter karakter tararken:
- **Rakam** görürsek `number = number * 10 + (c - '0')` ile sayıyı büyütürüz.
- **`'+'` veya `'-'`** görürsek bir önceki sayının okunması bitmiştir: `result += sign * number` ile sonuca ekler, `number = 0` yapar ve yeni işareti `sign` içine yazarız. Bu yaklaşım `"- (2 + 3)"` gibi tekli eksi durumlarında da doğal biçimde çalışır çünkü `number` başlangıçta `0` olduğu için `result` değişmez, yalnızca `sign = -1` olur.
- **`'('`** görürsek yeni bir alt ifade başlıyordur. Mevcut `result` ve parantezin önündeki `sign` değerlerini yığına (`Stack`) iteriz; ardından `result = 0` ve `sign = 1` yaparak parantez içini bağımsız bir ifade gibi hesaplamaya başlarız.
- **`')'`** görürsek önce parantez içindeki son sayıyı `result += sign * number` ile toplama katarız. Sonra yığından önce parantezin işaretini çekip `result` ile çarpar, ardından parantez öncesindeki ara toplamı çekip `result` üzerine ekleriz.

Döngü bittiğinde parantez dışında kalmış son bir sayı varsa `result + sign * number` ile onu da ekleyerek nihai sonucu döndürürüz.

```csharp solution
public class Solution
{
    public int Calculate(string s)
    {
        Stack<int> stack = new Stack<int>();
        int result = 0;
        int number = 0;
        int sign = 1;

        foreach (char c in s)
        {
            if (char.IsDigit(c))
            {
                number = number * 10 + (c - '0');
            }
            else if (c == '+')
            {
                result += sign * number;
                number = 0;
                sign = 1;
            }
            else if (c == '-')
            {
                result += sign * number;
                number = 0;
                sign = -1;
            }
            else if (c == '(')
            {
                // Mevcut toplamı ve parantezin önündeki işareti sakla.
                stack.Push(result);
                stack.Push(sign);
                result = 0;
                sign = 1;
            }
            else if (c == ')')
            {
                result += sign * number;
                number = 0;
                result *= stack.Pop(); // Parantez önündeki işaret
                result += stack.Pop(); // Parantez öncesi ara toplam
            }
        }

        return result + sign * number;
    }
}
```

```typescript solution
function calculate(s: string): number {
  const stack: number[] = [];
  let result = 0;
  let number = 0;
  let sign = 1;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= '0' && c <= '9') {
      number = number * 10 + (c.charCodeAt(0) - 48);
    } else if (c === '+') {
      result += sign * number;
      number = 0;
      sign = 1;
    } else if (c === '-') {
      result += sign * number;
      number = 0;
      sign = -1;
    } else if (c === '(') {
      stack.push(result);
      stack.push(sign);
      result = 0;
      sign = 1;
    } else if (c === ')') {
      result += sign * number;
      number = 0;
      result *= stack.pop()!;
      result += stack.pop()!;
    }
  }

  return result + sign * number;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizgideki her karakter tam olarak bir kez işlenir ve yığın işlemleri O(1) sürer.
- **Alan:** O(n). İç içe parantezlerin derinliği kadar yığında eleman tutulur; en kötü durumda O(n) bellek kullanılır.

## Testler

```json
[
  { "args": ["1 + 1"], "expected": 2, "sample": true },
  { "args": [" 2-1 + 2 "], "expected": 3, "sample": true },
  { "args": ["(1+(4+5+2)-3)+(6+8)"], "expected": 23, "sample": true },
  { "args": ["- (3 + (4 + 5))"], "expected": -12 },
  { "args": ["2147483647"], "expected": 2147483647 },
  { "args": ["1-(     -2)"], "expected": 3 },
  { "args": ["100 - (25 - (10 + 5))"], "expected": 90 },
  { "args": ["-(10 - (2 + 3)) + (4 - 1)"], "expected": -2 }
]
```
