---
title: İkili Arama
summary: Sıralı veride O(log n) arama. Sınır hatası yapmadan yazmanın şablonu, ilk/son konumu bulma ve "yanıt üzerinde ikili arama" tekniği.
minutes: 13
level: intermediate
---

İkili arama fikir olarak basittir: sıralı bir aralığın ortasına bak, hedef hangi yarıdaysa oraya devam et. Yine de mülakatlarda en çok **sınır hatası** yapılan konudur. Bu derste hatasız yazmanın yolunu ve fikrin yalnızca "dizide eleman aramak"tan ibaret olmadığını göreceksiniz.

## Temel şablon

```csharp
int BinarySearch(int[] nums, int target)
{
    var left = 0;
    var right = nums.Length - 1;          // kapalı aralık: [left, right]

    while (left <= right)
    {
        var mid = left + (right - left) / 2;

        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }

    return -1;
}
```

Her adımda aralık yarıya iner: O(log n) zaman, O(1) alan. Bir milyon elemanda en fazla 20 adım.

Üç ayrıntıyı bilinçli seçin ve **tutarlı** kalın:

1. **Aralık kapalı mı?** Burada `[left, right]` kapalıdır; bu yüzden başlangıç `Length - 1`, koşul `left <= right` olur.
2. **Orta nokta.** `(left + right) / 2` büyük dizilerde tam sayı taşmasına yol açabilir; `left + (right - left) / 2` taşmaz. JavaScript'te sonucu tam sayıya indirmek için `Math.floor` gerekir.
3. **Aralığı daraltma.** `mid` denendi ve elendi; bu yüzden `mid + 1` ve `mid - 1`. Burada `mid`'i aralıkta bırakmak sonsuz döngünün en sık nedenidir.

## Sınır arama: koşulu sağlayan ilk konum

Asıl güçlü biçim budur. Dizi, bir koşul için "önce hep yanlış, sonra hep doğru" biçiminde ikiye ayrılıyorsa, **doğrunun başladığı ilk konum** ikili aramayla bulunur.

```typescript
// nums[i] >= target olan ilk indeksi döndürür (yoksa nums.length).
function lowerBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length;                 // yarı açık aralık: [left, right)

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] >= target) right = mid;  // mid yanıt olabilir, aralıkta kalsın
    else left = mid + 1;                   // mid kesinlikle yanıt değil
  }

  return left;
}
```

Bu tek fonksiyonla pek çok soru çözülür:

- **Eleman var mı?** `i = lowerBound(target)`; `i < n && nums[i] === target`.
- **İlk geçtiği konum:** `lowerBound(target)`.
- **Son geçtiği konum:** `lowerBound(target + 1) - 1`.
- **Kaç kez geçiyor:** `lowerBound(target + 1) - lowerBound(target)`.
- **Eklenmesi gereken konum:** `lowerBound(target)`.

Döngü değişmezini (invariant) aklınızda tutun: `left`'in solundaki her konum için koşul yanlıştır, `right` ve sağındaki her konum için doğrudur. Döngü `left === right` olduğunda biter ve o konum yanıttır.

## Yanıt üzerinde ikili arama

İkili arama için bir dizi şart değildir; **tekdüze (monoton) bir koşul** yeterlidir. Soru "şu koşulu sağlayan **en küçük** (ya da en büyük) değer nedir?" biçimindeyse ve bir değer için koşul sağlanıyorsa ondan büyük bütün değerler için de sağlanıyorsa, olası yanıtların aralığında ikili arama yapabilirsiniz.

Örnek: `piles[i]` muz içeren yığınlar var ve `h` saatiniz var. Saatte `k` muz yiyebiliyorsanız (bir saatte tek yığından), hepsini bitirmenizi sağlayan en küçük `k` nedir?

- `k` çok küçükse yetişemezsiniz, yeterince büyükse yetişirsiniz: koşul monotondur.
- Belirli bir `k` için gereken saat O(n)'de hesaplanır.
- `k`, 1 ile en büyük yığın arasında bir değerdir.

```csharp
int MinEatingSpeed(int[] piles, int h)
{
    var left = 1;
    var right = piles.Max();

    while (left < right)
    {
        var speed = left + (right - left) / 2;
        var hours = piles.Sum(p => (long)(p + speed - 1) / speed);   // yukarı yuvarlanmış bölme

        if (hours <= h) right = speed;      // yetişiyor: daha yavaşını dene
        else left = speed + 1;              // yetişmiyor: hızlanmak zorunlu
    }

    return left;
}
```

Karmaşıklık O(n · log(maks)) olur. Bu kalıbı tanımanın ipuçları: "en az kaç…", "en fazla ne kadar…", "en küçük kapasite", "en büyük en küçük mesafe" gibi ifadeler ve olası yanıtların sıralı bir aralık oluşturması.

## Döndürülmüş sıralı dizi

Sıralı bir dizi bir noktadan döndürülmüşse (`[4, 5, 6, 7, 0, 1, 2]`) dizi bütün olarak sıralı değildir, ama **orta noktanın bir yanı her zaman sıralıdır**. Hangi yanın sıralı olduğuna bakıp hedefin o aralıkta olup olmadığını sınarsınız:

```typescript
function searchRotated(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;

    if (nums[left] <= nums[mid]) {
      // Sol yarı sıralı.
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      // Sağ yarı sıralı.
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }

  return -1;
}
```

## Hata ayıklama listesi

İkili aramanız yanlış çalışıyorsa sırayla şunlara bakın:

1. Aralık tanımınız (kapalı / yarı açık) başlangıç değeri ve döngü koşuluyla tutarlı mı?
2. Her dalda aralık **gerçekten küçülüyor** mu? İki elemanlı bir aralıkta elle izleyin.
3. Boş dizi, tek eleman, hedef en başta, hedef en sonda ve hedef dizide yok durumlarını denediniz mi?

## Özet

- İkili arama sıralı veride ya da monoton bir koşulda çalışır; her adımda aralığı yarılar.
- "Koşulu sağlayan ilk konum" şablonunu ezbere bilin; ilk/son konum, sayma ve ekleme konumu ondan türetilir.
- Soru "en küçük/en büyük uygun değer" ise ve koşul monotonsa, yanıtın kendisi üzerinde ikili arama yapın.
- Sınır hatalarına karşı aralık tanımınızı bir kez seçin ve bütün satırlarda ona uyun.
