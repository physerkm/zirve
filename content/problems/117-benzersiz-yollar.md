---
title: Benzersiz Yollar
difficulty: medium
tags: [dinamik-programlama, matematik, matris]
function: uniquePaths
params:
  - { name: m, type: "int" }
  - { name: n, type: "int" }
returns: "int"
---
`m x n` boyutunda bir ızgaranın sol üst köşesinde bir robot duruyor. Robot her adımda yalnızca **sağa** ya da **aşağı** gidebilir. Sağ alt köşeye ulaşmanın kaç **farklı yolu** olduğunu döndürün.

Cevap `2 * 10^9`'u geçmeyecek şekilde seçilmiştir.

### Örnek 1

```text
Girdi:  m = 3, n = 7
Çıktı:  28
```

### Örnek 2

```text
Girdi:  m = 3, n = 2
Çıktı:  3
Açıklama: Sağ → Aşağı → Aşağı, Aşağı → Sağ → Aşağı, Aşağı → Aşağı → Sağ.
```

### Kısıtlar

- `1 <= m, n <= 100`

## İpuçları

- Bir hücreye yalnızca üstünden ya da solundan gelinebilir.
- `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. İlk satır ve ilk sütundaki her hücreye tek bir yol vardır.
- Her satır yalnızca bir önceki satıra bağlı olduğu için tek boyutlu bir dizi yeterlidir.

## Çözüm

### Tek satırlık DP

`row[c]`, mevcut satırda `c`. sütuna ulaşan yol sayısıdır. İlk satırda her hücreye tek yol vardır: `row = [1, 1, ..., 1]`. Sonraki her satırda soldan sağa `row[c] += row[c - 1]`: güncellenmeden önceki `row[c]` üstteki hücrenin, `row[c - 1]` ise soldaki hücrenin yol sayısıdır.

```csharp solution
public class Solution
{
    public int UniquePaths(int m, int n)
    {
        var row = new int[n];
        Array.Fill(row, 1);

        for (var r = 1; r < m; r++)
        {
            for (var c = 1; c < n; c++)
            {
                row[c] += row[c - 1];
            }
        }

        return row[n - 1];
    }
}
```

```typescript solution
function uniquePaths(m: number, n: number): number {
  const row = new Array<number>(n).fill(1);

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      row[c] += row[c - 1];
    }
  }

  return row[n - 1];
}
```

### Karmaşıklık

- **Zaman:** O(m × n).
- **Alan:** O(n).

Kombinatorik açıdan her yol `m - 1` aşağı ve `n - 1` sağ adımdan oluşur; cevap `C(m + n - 2, m - 1)`'dir. Bu formül O(min(m, n))'de hesaplanabilir ama ara çarpımlarda taşmaya dikkat etmek gerekir.

## Testler

```json
[
  { "args": [3, 7], "expected": 28, "sample": true },
  { "args": [3, 2], "expected": 3, "sample": true },
  { "args": [1, 1], "expected": 1 },
  { "args": [1, 10], "expected": 1 },
  { "args": [7, 3], "expected": 28 },
  { "args": [10, 10], "expected": 48620 },
  { "args": [23, 12], "expected": 193536720 }
]
```
