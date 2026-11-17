---
title: Görüntüyü Döndür
difficulty: medium
tags: [matris, matematik]
function: rotate
params:
  - { name: matrix, type: "int[][]" }
returns: "int[][]"
---
Bir görüntüyü temsil eden `n x n` boyutlarında 2 boyutlu bir `matrix` veriliyor. Görüntüyü saat yönünde **90 derece** (sağa) döndürün ve döndürülmüş matrisi geri döndürün.

Döndürme işlemini **yerinde (in-place)** yapmalısınız; yani başka bir 2 boyutlu matris oluşturup elemanları oraya kopyalamamalısınız.

### Örnek 1

```text
Girdi:  matrix = [[1,2,3],[4,5,6],[7,8,9]]
Çıktı:  [[7,4,1],[8,5,2],[9,6,3]]
Açıklama: İlk satır [1,2,3] son sütun haline gelir; son satır [7,8,9] ilk sütun haline gelir.
```

### Örnek 2

```text
Girdi:  matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Çıktı:  [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
```

### Kısıtlar

- `n == matrix.length == matrix[i].length`
- `1 <= n <= 20`
- `-1000 <= matrix[i][j] <= 1000`

## İpuçları

- Bir matrisi saat yönünde 90° döndürdüğümüzde `(r, c)` konumundaki eleman `(c, n - 1 - r)` konumuna gider.
- Dörtlü döngülerle indeks takibi yapmak hataya açıktır. Bunun yerine dönüşümü iki basit simetri işlemine ayırabilir miyiz?
- Önce matrisin **transpozunu** alın (`matrix[r][c]` ile `matrix[c][r]` yer değiştirsin): bu işlem `(r, c)` elemanını `(c, r)` konumuna taşır.
- Ardından her satırı kendi içinde **ters çevirin**: `(c, r)` konumu `(c, n - 1 - r)` olur ve 90° sağa döndürme tamamlanır!

## Çözüm

Bir kare matrisi yerinde 90° saat yönünde döndürmenin en temiz ve hatasız yolu, işlemi iki temel matris işlemine bölmektir:

1. **Transpoz Alma (Ana Köşegene Göre Simetri):** Üst üçgendeki (`j > i`) her `matrix[i][j]` elemanını alt üçgendeki `matrix[j][i]` elemanıyla yer değiştiririz. Böylece satırlar sütun, sütunlar satır olur (`(i, j) -> (j, i)`).
2. **Satırları Ters Çevirme (Yatay Yansıtma):** Her satırı sol ve sağ uçtan ortaya doğru iki işaretçiyle (veya `Array.Reverse` ile) ters çeviririz. Böylece `(j, i)` konumundaki eleman `(j, n - 1 - i)` konumuna gelir; bu da tam olarak 90° saat yönünde dönmüş konumdur.

Her iki adımda da yalnızca iki hücre arasında `swap` yapıldığı için ek matris belleği kullanılmaz.

```csharp solution
public class Solution
{
    public int[][] Rotate(int[][] matrix)
    {
        int n = matrix.Length;

        // 1. Adım: Matrisin transpozunu al (satırları sütun yap).
        for (int i = 0; i < n; i++)
        {
            for (int j = i + 1; j < n; j++)
            {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }

        // 2. Adım: Her satırı kendi içinde ters çevir.
        for (int i = 0; i < n; i++)
        {
            Array.Reverse(matrix[i]);
        }

        return matrix;
    }
}
```

```typescript solution
function rotate(matrix: number[][]): number[][] {
  const n = matrix.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const temp = matrix[i][j];
      matrix[i][j] = matrix[j][i];
      matrix[j][i] = temp;
    }
  }

  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }

  return matrix;
}
```

### Karmaşıklık

- **Zaman:** O(n²). Matristeki `n x n` hücrenin her birine sabit sayıda erişilir.
- **Alan:** O(1). Tüm yer değiştirmeler matrisin kendi üzerinde yerinde yapılır.

## Testler

```json
[
  { "args": [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], "expected": [[7, 4, 1], [8, 5, 2], [9, 6, 3]], "sample": true },
  { "args": [[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], "expected": [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]], "sample": true },
  { "args": [[[1]]], "expected": [[1]] },
  { "args": [[[1, 2], [3, 4]]], "expected": [[3, 1], [4, 2]] },
  { "args": [[[-1, -2], [-3, -4]]], "expected": [[-3, -1], [-4, -2]] },
  { "args": [[[0, 1, 0], [1, 1, 1], [0, 1, 0]]], "expected": [[0, 1, 0], [1, 1, 1], [0, 1, 0]] }
]
```
