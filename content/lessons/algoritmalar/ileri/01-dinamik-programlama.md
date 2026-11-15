---
title: Dinamik Programlama
summary: Örtüşen alt problemleri bir kez çözüp saklama tekniği. Bir problemi DP olarak tanımak, durumu ve geçişi tanımlamak, yukarıdan aşağı ve aşağıdan yukarı yazmak.
minutes: 20
level: advanced
---

Dinamik programlama (DP) gözü korkutur, çünkü çözümler ilk bakışta sihir gibi görünür. Oysa yöntem mekaniktir: kaba kuvvet özyinelemeyi yazın, **aynı alt problemin tekrar tekrar çözüldüğünü** fark edin ve sonuçları saklayın.

## DP ne zaman işe yarar

İki koşul birlikte sağlanmalıdır:

1. **En iyi alt yapı.** Problemin yanıtı, daha küçük alt problemlerin yanıtlarından kurulabilir.
2. **Örtüşen alt problemler.** Aynı alt problem birden çok kez karşınıza çıkar.

İkinci koşul yoksa (ör. merge sort) bu böl ve yönettir; saklamanın yararı olmaz.

Soru metnindeki ipuçları: "kaç **farklı yol** var", "**en az / en çok** kaç…", "mümkün **mü**" ve her adımda bir **seçim** yapmanız gerekmesi. Girdi boyutu da ipucu verir: `n` birkaç bin ise O(n²) bir DP beklenebilir.

## Beş adımlı yöntem

Merdiven örneğiyle: `n` basamaklı bir merdiveni her adımda 1 ya da 2 basamak çıkarak kaç farklı biçimde çıkabilirsiniz?

**1. Durumu tanımlayın.** `ways(i)`: `i`. basamağa ulaşmanın yol sayısı. Durumu **sözle, tek cümleyle** tanımlayabilmek işin yarısıdır.

**2. Geçişi yazın.** `i`. basamağa ya `i-1`'den ya `i-2`'den gelinir:
`ways(i) = ways(i-1) + ways(i-2)`

**3. Temel durumları belirleyin.** `ways(0) = 1` (hiç çıkmamak tek yoldur), `ways(1) = 1`.

**4. Hesaplama sırasını seçin.** Küçükten büyüğe.

**5. Yanıtın nerede olduğunu söyleyin.** `ways(n)`.

### Yukarıdan aşağı: özyineleme + saklama (memoization)

Kaba kuvvet özyinelemeyi yazın, sonra sonuçları bir tabloda saklayın. Düşünmesi en kolay biçim budur.

```typescript
function climbStairs(n: number, memo = new Map<number, number>()): number {
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n)!;

  const result = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, result);
  return result;
}
```

Saklama olmadan O(2ⁿ) olan çözüm, her alt problem bir kez çözüldüğü için O(n)'e iner.

### Aşağıdan yukarı: tablo doldurma

Aynı geçiş, döngüyle ve temel durumlardan başlayarak yazılır. Özyineleme yığını kullanmaz.

```csharp
int ClimbStairs(int n)
{
    var ways = new int[n + 1];
    ways[0] = 1;
    if (n >= 1) ways[1] = 1;

    for (var i = 2; i <= n; i++)
    {
        ways[i] = ways[i - 1] + ways[i - 2];
    }

    return ways[n];
}
```

**Alan iyileştirmesi:** Geçiş yalnızca son iki değere bakıyorsa bütün tabloyu tutmak gerekmez; iki değişken yeter ve alan O(1)'e iner. Mülakatta önce tabloyla çözün, sonra bu iyileştirmeyi **söyleyin**.

## Karmaşıklık nasıl hesaplanır

**Zaman = durum sayısı × durum başına geçiş maliyeti.** Merdivende `n` durum ve sabit geçiş: O(n). Alan, saklanan durum sayısıdır.

## Tipik kalıplar

### Tek boyutlu: seç ya da geçme

**Ev soyguncusu:** Yan yana evlerden komşu iki evi soymadan en çok ne kadar para toplanır?

- Durum: `best(i)` = ilk `i` evden elde edilebilecek en büyük tutar.
- Geçiş: `i`. evi ya soymazsınız (`best(i-1)`) ya da soyar ve bir öncekini atlarsınız (`best(i-2) + para[i]`).

```typescript
function rob(nums: number[]): number {
  let previous = 0;   // best(i-2)
  let current = 0;    // best(i-1)

  for (const money of nums) {
    [previous, current] = [current, Math.max(current, previous + money)];
  }

  return current;
}
```

### Sınırsız seçim: bozuk para

Verilen madeni paralarla `amount` tutarını oluşturmak için **en az** kaç para gerekir?

- Durum: `fewest(a)` = `a` tutarı için gereken en az para sayısı.
- Geçiş: son kullanılan para `c` ise `fewest(a) = 1 + fewest(a - c)`; bütün `c`'lerin en küçüğü.
- Temel durum: `fewest(0) = 0`. Ulaşılamayan tutarlar için "sonsuz" değeri.

```csharp
int CoinChange(int[] coins, int amount)
{
    var fewest = new int[amount + 1];
    Array.Fill(fewest, int.MaxValue);
    fewest[0] = 0;

    for (var a = 1; a <= amount; a++)
    {
        foreach (var coin in coins)
        {
            if (coin <= a && fewest[a - coin] != int.MaxValue)
            {
                fewest[a] = Math.Min(fewest[a], fewest[a - coin] + 1);
            }
        }
    }

    return fewest[amount] == int.MaxValue ? -1 : fewest[amount];
}
```

Karmaşıklık: O(tutar × para çeşidi). **Açgözlü** yaklaşım (hep en büyük parayı al) burada yanlıştır: paralar `[1, 3, 4]`, tutar `6` iken açgözlü `4+1+1` (3 para) bulur, doğru yanıt `3+3`'tür (2 para). Açgözlü bir çözüm öneriyorsanız neden doğru olduğunu savunabilmelisiniz; emin değilseniz DP güvenli yoldur.

### İki dizi üzerinde: ızgara DP

İki dizgi ya da iki boyutlu ızgara içeren sorularda durum iki indekslidir. **En uzun ortak alt dizi** (LCS):

- Durum: `lcs(i, j)` = `a`'nın ilk `i`, `b`'nin ilk `j` karakterinin en uzun ortak alt dizisinin uzunluğu.
- Geçiş: son karakterler eşitse `lcs(i-1, j-1) + 1`; değilse `max(lcs(i-1, j), lcs(i, j-1))`.

Tablo `(n+1) × (m+1)` boyutundadır; zaman ve alan O(n·m). Düzenleme mesafesi, ızgarada yol sayısı, en uzun palindrom alt dizi aynı ailedendir.

### En uzun artan alt dizi (LIS)

- Durum: `lis(i)` = `i`. elemanla **biten** en uzun artan alt dizinin uzunluğu.
- Geçiş: `lis(i) = 1 + max(lis(j))`, `j < i` ve `nums[j] < nums[i]` olan bütün `j`'ler için.

Bu O(n²)'dir. Durumun "`i` ile **biten**" diye tanımlandığına dikkat edin: yanıt `lis(n-1)` değil, bütün `lis(i)`'lerin en büyüğüdür. Durumu doğru tanımlamak çoğu zaman bu tür bir "sonu sabitleme" hilesi gerektirir.

## Takıldığınızda

1. **Önce kaba kuvvet özyinelemeyi yazın.** Parametreleri durumunuzdur.
2. Özyinelemenin parametreleri neler? Aynı parametrelerle tekrar çağrılıyor mu? Evetse saklayın.
3. Durumu sözle tanımlayamıyorsanız geçişi de yazamazsınız. Tanımı değiştirin: "ilk `i` eleman", "`i` ile biten", "`i`'den başlayan", "kalan kapasite `c` iken".
4. Küçük bir örnek için tabloyu **elle** doldurun. Kalıp genellikle orada görünür.

## Özet

- DP = özyineleme + örtüşen alt problemlerin sonuçlarını saklama.
- Yöntem: durum, geçiş, temel durumlar, sıra, yanıtın yeri.
- Zaman = durum sayısı × geçiş maliyeti.
- Yukarıdan aşağı düşünmesi kolaydır; aşağıdan yukarı yığın kullanmaz ve alanı iyileştirmeye elverişlidir.
- Açgözlü çözümden emin değilseniz DP ile doğrulayın.
