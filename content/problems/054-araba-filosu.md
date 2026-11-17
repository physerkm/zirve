---
title: Araba Filosu
difficulty: medium
tags: [yigin, dizi, siralama]
function: carFleet
params:
  - { name: target, type: "int" }
  - { name: position, type: "int[]" }
  - { name: speed, type: "int[]" }
returns: "int"
---
Tek şeritli bir yolda, başlangıçtan `target` mil uzaklıktaki aynı hedefe doğru ilerleyen `n` adet araba vardır.

Uzunluğu `n` olan iki tam sayı dizisi `position` ve `speed` veriliyor: `position[i]`, `i`. arabanın başlangıç konumu (mil); `speed[i]`, `i`. arabanın hızıdır (mil/saat).

Bir araba önündeki arabayı **sollayamaz**, ancak ona yetişip onunla aynı hızda tampon tampona ilerleyebilir. Yan yana (aynı konumda ve aynı hızda) giden bir ya da daha fazla araba kümesine **araba filosu** denir.

Bir araba, önündeki bir filoya tam `target` noktasında yetişirse bile o filonun parçası sayılır.

Hedefe ulaşacak **araba filosu sayısını** döndürün.

### Örnek 1

```text
Girdi:  target = 12, position = [10, 8, 0, 5, 3], speed = [2, 4, 1, 1, 3]
Çıktı:  3
Açıklama:
  10 (hız 2) ve 8 (hız 4) konumundaki arabalar 12. milde buluşup tek filo olur.
  0 (hız 1) konumundaki araba hiçbir arabaya yetişemez; tek başına bir filodur.
  5 (hız 1) ve 3 (hız 3) konumundaki arabalar 6. milde buluşup hızlarını 1'e düşürür ve hedefe birlikte varır.
```

### Örnek 2

```text
Girdi:  target = 10, position = [3], speed = [3]
Çıktı:  1
Açıklama: Yalnızca bir araba olduğundan tek filo vardır.
```

### Örnek 3

```text
Girdi:  target = 100, position = [0, 2, 4], speed = [4, 2, 1]
Çıktı:  1
Açıklama: 0 ve 2 konumundaki arabalar 4. milde buluşur ve 4 konumundaki arabaya da yetişerek hedefe tek filo halinde ulaşır.
```

### Kısıtlar

- `n == position.length == speed.length`
- `1 <= n <= 10^5`
- `0 < target <= 10^6`
- `0 <= position[i] < target`
- `position` içindeki tüm değerler birbirinden farklıdır.
- `0 < speed[i] <= 10^6`

## İpuçları

- Arabaların tam olarak hangi milde buluştuklarını hesaplamaya gerek yoktur; önemli olan arkadaki arabanın öndeki arabadan **önce ya da aynı anda** hedefe varıp varamayacağıdır.
- Arabaları hedefe en yakın olandan en uzak olana doğru (konuma göre azalan sırada) sıralayın: en öndeki arabanın hızını hiçbir şey kesemez.
- Her araba için engellenmeseydi hedefe kaç saatte varacağını `(double)(target - position[i]) / speed[i]` olarak hesaplayın.
- Sağdan sola ilerlerken bir arabanın varış süresi öndeki filonun varış süresinden **büyükse** yetişemez ve yeni bir filo başlatır; küçük veya eşitse öndeki filoya katılır.

## Çözüm

Tek şeritli yolda öndeki araba arkadaki arabayı yavaşlatabilir ama arkadaki araba öndekini hızlandıramaz. Bu yüzden arabaları hedefe **en yakın olandan en uzak olana** (konuma göre sağdan sola) doğru incelemek sorunu çok basitleştirir: en öndeki arabanın önünde kimse yoktur, varış süresi kesindir.

Her araba için `(target - pos) / speed` formülüyle, önünde engel olmasaydı hedefe kaç saatte ulaşacağını ondalıklı sayı (`double`) olarak hesaplarız. Arabaları konumlarına göre büyükten küçüğe sıraladıktan sonra sırayla bakarız:

- Sıradaki arabanın varış süresi, önündeki filonun varış süresinden (`leadTime`) **küçük veya eşitse**, bu araba hedefe varmadan (ya da tam hedefte) öndeki filoya yetişir ve onunla birleşir; filonun hızı öndeki yavaş arabaya göre belirlendiği için `leadTime` değişmez.
- Varış süresi `leadTime` değerinden **büyükse**, bu araba öndeki filoya asla yetişemez; kendi başına yeni bir filonun lideri olur (`fleets++`) ve arkadan gelenler artık bu yeni `leadTime` ile karşılaştırılır.

Tam sayı bölmesi yuvarlama hatasına yol açacağı için süreyi mutlaka `double` ile hesaplamalıyız.

```csharp solution
public class Solution
{
    public int CarFleet(int target, int[] position, int[] speed)
    {
        int n = position.Length;
        var cars = new (int Pos, double Time)[n];

        for (int i = 0; i < n; i++)
        {
            cars[i] = (position[i], (double)(target - position[i]) / speed[i]);
        }

        // Hedefe en yakın arabadan en uzağa doğru sırala.
        Array.Sort(cars, (a, b) => b.Pos.CompareTo(a.Pos));

        int fleets = 0;
        double leadTime = 0;

        foreach (var car in cars)
        {
            // Öndeki filodan daha geç varıyorsa yetişemez; yeni filo başlatır.
            if (car.Time > leadTime)
            {
                fleets++;
                leadTime = car.Time;
            }
        }

        return fleets;
    }
}
```

```typescript solution
function carFleet(target: number, position: number[], speed: number[]): number {
  const cars = position
    .map((pos, i) => ({ pos, time: (target - pos) / speed[i] }))
    .sort((a, b) => b.pos - a.pos);

  let fleets = 0;
  let leadTime = 0;

  for (const car of cars) {
    if (car.time > leadTime) {
      fleets++;
      leadTime = car.time;
    }
  }

  return fleets;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). Arabaları konumlarına göre sıralamak O(n log n), ardından tek geçişle filoları saymak O(n) sürer.
- **Alan:** O(n), arabaların konum ve varış süresi çiftlerini tutan dizi için.

## Testler

```json
[
  { "args": [12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]], "expected": 3, "sample": true },
  { "args": [10, [3], [3]], "expected": 1, "sample": true },
  { "args": [100, [0, 2, 4], [4, 2, 1]], "expected": 1, "sample": true },
  { "args": [10, [6, 8], [3, 2]], "expected": 2 },
  { "args": [10, [0, 4, 2], [2, 1, 3]], "expected": 1 },
  { "args": [20, [5, 10, 15], [1, 1, 1]], "expected": 3 },
  { "args": [15, [2, 5, 9, 12], [5, 2, 3, 1]], "expected": 2 }
]
```
