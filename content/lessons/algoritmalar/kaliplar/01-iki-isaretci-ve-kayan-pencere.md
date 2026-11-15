---
title: İki İşaretçi ve Kayan Pencere
summary: Dizi ve dizgi problemlerinde iç içe döngüleri tek geçişe indiren iki kalıp. Ne zaman kullanılır, nasıl kurulur ve hangi hatalara dikkat edilir.
minutes: 16
level: intermediate
---

Pek çok dizi ve dizgi problemi "bütün çiftleri" ya da "bütün alt dizileri" denemekle çözülebilir; bu O(n²) ya da daha kötüsüdür. İki işaretçi ve kayan pencere kalıpları, aynı problemleri **tek geçişte** çözer. Ortak fikir: bir işaretçiyi ilerlettiğinizde, artık asla işe yaramayacak adayları toplu olarak elersiniz.

## İki işaretçi: karşıdan yaklaşma

**Ne zaman:** Dizi **sıralıysa** ve bir koşulu sağlayan çift arıyorsanız; ya da dizinin iki ucundan içeri doğru simetrik bir işlem yapıyorsanız (palindrom, ters çevirme).

Sıralı bir dizide toplamı `target` olan iki sayıyı bulalım:

```typescript
function pairWithSum(sorted: number[], target: number): [number, number] | null {
  let left = 0;
  let right = sorted.length - 1;

  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;   // toplam küçük: daha büyük bir sayı gerek
    else right--;               // toplam büyük: daha küçük bir sayı gerek
  }

  return null;
}
```

**Neden doğru?** Toplam küçükse, `sorted[left]` mevcut en büyük sayıyla (`sorted[right]`) bile hedefe ulaşamıyordur; o halde hiçbir çiftte işe yaramaz ve güvenle atlanabilir. Her adımda bir aday kesin olarak elenir, bu yüzden döngü en fazla `n` adım atar: O(n) zaman, O(1) alan.

Aynı kalıp şu problemlerde çıkar: palindrom denetimi, en çok su tutan kap, üç sayının toplamı (bir sayıyı sabitleyip kalanında iki işaretçi; toplam O(n²)).

## İki işaretçi: aynı yönde (hızlı ve yavaş)

**Ne zaman:** Diziyi **yerinde** (ek bellek kullanmadan) süzmek ya da sıkıştırmak istediğinizde. `slow` yazma konumunu, `fast` okuma konumunu gösterir.

```csharp
// Sıralı dizideki tekrarları yerinde siler, benzersiz eleman sayısını döndürür.
int RemoveDuplicates(int[] nums)
{
    if (nums.Length == 0) return 0;

    var slow = 0;
    for (var fast = 1; fast < nums.Length; fast++)
    {
        if (nums[fast] != nums[slow])
        {
            slow++;
            nums[slow] = nums[fast];
        }
    }

    return slow + 1;
}
```

Bağlı listelerde aynı fikir, biri bir adım diğeri iki adım ilerleyen işaretçilerle orta düğümü bulmak ve döngü tespit etmek için kullanılır.

## Kayan pencere

**Ne zaman:** "Şu koşulu sağlayan **en uzun / en kısa ardışık** alt dizi ya da alt dizgi" sorulduğunda. Anahtar sözcük **ardışık**tır.

Pencere `[left, right]` aralığıdır. `right` her adımda bir ilerleyerek pencereyi büyütür; pencere koşulu bozduğunda `left` ilerletilerek pencere küçültülür. Her eleman pencereye en fazla bir kez girer ve bir kez çıkar: toplam O(n).

### Değişken boyutlu pencere

Tekrar eden karakter içermeyen en uzun alt dizginin uzunluğu:

```typescript
function longestUnique(s: string): number {
  const inWindow = new Set<string>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    // Pencere geçersizken soldan daralt.
    while (inWindow.has(s[right])) {
      inWindow.delete(s[left]);
      left++;
    }

    inWindow.add(s[right]);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

İç içe `for` ve `while` görünce O(n²) sanmayın: `left` toplamda en fazla `n` kez ilerler. Bu **amortize** analizin tipik örneğidir ve mülakatta açıklamanız beklenir.

Şablon her zaman aynıdır:

1. `right` ile pencereyi genişlet, pencere durumunu güncelle.
2. Pencere **geçersizken** `left` ile daralt, durumu güncelle.
3. Pencere geçerliyken yanıtı güncelle.

"En kısa" sorularında 2. ve 3. adımlar yer değiştirir: pencere **geçerliyken** daraltılır ve her daraltmadan önce yanıt güncellenir.

### Sabit boyutlu pencere

Boyutu `k` olan bütün pencerelerin en büyük toplamı: her pencereyi baştan toplamak O(n·k) olur. Bunun yerine pencere bir sağa kayarken giren elemanı ekleyip çıkan elemanı çıkarın.

```csharp
int MaxWindowSum(int[] nums, int k)
{
    var sum = 0;
    for (var i = 0; i < k; i++) sum += nums[i];

    var best = sum;
    for (var right = k; right < nums.Length; right++)
    {
        sum += nums[right] - nums[right - k];
        best = Math.Max(best, sum);
    }

    return best;
}
```

## Hangi kalıp ne zaman

| İpucu | Kalıp |
| --- | --- |
| Dizi sıralı, çift ya da üçlü aranıyor | Karşıdan yaklaşan iki işaretçi |
| "Yerinde" süzme ya da sıkıştırma | Aynı yönde iki işaretçi |
| "En uzun / en kısa **ardışık**…" | Değişken boyutlu pencere |
| "Boyutu k olan her pencere için…" | Sabit boyutlu pencere |
| Alt dizi toplamı isteniyor ama **negatif** sayılar var | Pencere çalışmaz; ön ek toplamı + hash tablosu |

Son satır önemlidir. Kayan pencere, pencereyi büyütmenin durumu tek yönde değiştirdiği varsayımına dayanır (ör. toplam hep artar). Negatif sayılar bu varsayımı bozar.

## Sık yapılan hatalar

- **Döngü koşulu.** Karşıdan yaklaşmada `left < right` mi `left <= right` mi? Aynı elemanı iki kez kullanmak geçerli değilse `<` kullanın.
- **Pencere uzunluğu.** `right - left + 1`; `+1`'i unutmak klasik sınır hatasıdır.
- **Durumu güncellemeyi unutmak.** `left` ilerlerken pencereden çıkan elemanı sayaçtan ya da kümeden düşmeyi unutmayın.
- **Sıralamanın bedeli.** İki işaretçi için diziyi sıralamanız gerekiyorsa O(n log n) ödersiniz ve özgün indeksler kaybolur. İndeks isteniyorsa hash tablosu daha uygun olabilir.

## Özet

- İki kalıp da "bu adayı bir daha denemeye gerek yok" gözlemine dayanır ve O(n²)'yi O(n)'e indirir.
- Sıralı veri ve çift arama: karşıdan iki işaretçi. Ardışık alt dizi: kayan pencere.
- Kayan pencerede iç `while` döngüsü toplamda `n` adım atar; karmaşıklık O(n)'dir.
