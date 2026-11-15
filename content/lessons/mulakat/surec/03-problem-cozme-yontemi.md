---
title: Kodlama Mülakatında Problem Çözme Yöntemi
summary: 45 dakikayı yönetmek için altı adım. Soruyu netleştirmek, örnekle düşünmek, yaklaşımı anlatmak, kodlamak, test etmek ve analiz etmek.
minutes: 12
level: beginner
---

Kodlama mülakatında iki aday aynı çözüme ulaşıp çok farklı puan alabilir. Fark, **süreçtedir**: görüşmeci yalnızca kodu değil, oraya nasıl vardığınızı değerlendirir. Aşağıdaki altı adım, her soruda uygulayabileceğiniz bir iskelettir.

## 1. Soruyu netleştirin (2–3 dk)

Soruyu kendi sözlerinizle tekrar edin ve belirsizlikleri sorun. Sorular kasıtlı olarak eksik bırakılır.

- **Girdi:** boş olabilir mi? Ne kadar büyük? Sıralı mı? Negatif sayı, tekrar eden eleman var mı?
- **Çıktı:** tam olarak ne dönmeli? Birden fazla geçerli yanıt varsa hangisi? Yanıt yoksa ne dönmeli?
- **Kısıtlar:** girdiyi değiştirebilir miyim? Bellek sınırı var mı?

Girdinin boyutu, beklenen karmaşıklığı ele verir: `n` yüz bin civarındaysa O(n²) çözüm kabul edilmeyecektir.

## 2. Örnek üzerinden düşünün (2–3 dk)

Verilen örneği elle çözün; sonra **kendi** örneklerinizi yazın: küçük bir genel durum ve birkaç uç durum (boş girdi, tek eleman, hepsi aynı, zaten sıralı).

Örneği elle çözerken zihninizin attığı adımlar çoğu zaman algoritmanın kendisidir. Bu örnekleri bir kenara yazın; kodunuzu bunlarla test edeceksiniz.

## 3. Yaklaşımı anlatın ve onay alın (5–8 dk)

**Kod yazmaya başlamadan önce** planınızı anlatın.

1. **Kaba kuvvet çözümü söyleyin**, karmaşıklığıyla birlikte: "Bütün çiftleri deneyebilirim, O(n²)." Bu, problemi anladığınızı gösterir ve bir taban oluşturur. Çoğu zaman kodlamanıza gerek yoktur.
2. **Darboğazı bulun:** tekrarlanan iş nerede? "İç döngüde aynı aramayı tekrar tekrar yapıyorum."
3. **İyileştirin.** Kendinize şu soruları sorun:
   - Sıralamak işe yarar mı?
   - Bir hash tablosu aramayı O(1)'e indirir mi?
   - İki işaretçi ya da kayan pencere uygulanabilir mi?
   - Bu bir graf ya da ağaç problemi olarak görülebilir mi?
   - Alt problemler örtüşüyor mu (dinamik programlama)?
4. **Onay alın:** "Tek geçişte hash tablosuyla O(n) zaman, O(n) alan. Bununla ilerleyeyim mi?"

Bu adımı atlamak en pahalı hatadır: yanlış yaklaşımı 20 dakika kodlayıp baştan başlamak, görüşmeyi kurtarılamaz hale getirir. Görüşmecinin tepkisine dikkat edin; "başka bir yol düşünebilir misin?" bir ipucudur.

## 4. Kodu yazın (15–20 dk)

- **Yazarken konuşun.** Her satırı değil, kararları anlatın: "Burada indeksi değil değeri anahtar yapıyorum, çünkü…"
- **Anlamlı adlar kullanın.** `i`, `j` döngü sayaçları için uygundur; `x`, `tmp`, `arr2` değildir. `seen`, `left`, `maxProfit` kendini açıklar.
- **Yardımcı fonksiyonlara bölün.** Ayrıntıyı sonraya bırakmak sorun değildir: "Burada `isValid` adında bir yardımcı çağıracağım, birazdan yazarım."
- **Önce ana akışı tamamlayın**, uç durumları sonra ekleyin; ama eklemeyi unutmayın.
- **Takıldığınızda susmayın.** Nerede takıldığınızı söyleyin; örneğinize geri dönün.

Dil seçimi: en akıcı olduğunuz dili kullanın. Koleksiyonların ve dizgi işlemlerinin adını hatırlamak için durmanız, problem çözme sürenizden yer.

## 5. Test edin (5 dk)

"Bitti" demeden önce kodunuzu **kendiniz** sınayın. Çoğu aday bu adımı atlar ve hatasını görüşmeci bulur.

1. Kodu baştan sona okuyun: yazım hatası, yanlış değişken, unutulmuş `return`.
2. Küçük bir örneği **satır satır elle** izleyin; değişkenlerin değerlerini yazın. Kodun ne yapması gerektiğini değil, **ne yaptığını** izleyin.
3. Uç durumları deneyin: boş girdi, tek eleman, sınır değerleri.
4. Hata bulursanız paniklemeyin; sakin biçimde düzeltin. Kendi hatasını bulup düzelten aday olumlu izlenim bırakır.

## 6. Analiz edin ve iyileştirmeleri tartışın (2–3 dk)

Zaman ve alan karmaşıklığını **gerekçesiyle** söyleyin. Sonra ödünleşimlerden söz edin: "Sıralayarak O(1) ek alanla çözebilirdim ama zaman O(n log n)'e çıkardı."

Görüşmeci genellikle bir devam sorusu sorar: girdi belleğe sığmasaydı? Akış halinde gelseydi? Çok kez sorgulansaydı? Bunlar tuzak değil, sizi bir üst seviyede görmek için fırsattır.

## Takıldığınızda

- **Daha küçük bir örnek** deneyin ya da problemi basitleştirin: "dizi sıralı olsaydı?", "tek boyutlu olsaydı?"
- **Çıktıdan geriye** doğru düşünün.
- Bildiğiniz **kalıpları** sırayla sınayın.
- Görüşmecinin ipuçlarını **kullanın**. İpucu almak başarısızlık değildir; ipucunu değerlendirememek öyledir.

## Zaman çizelgesi

| Dakika | Ne yapıyorsunuz |
| --- | --- |
| 0–5 | Netleştirme ve örnekler |
| 5–12 | Yaklaşım, karmaşıklık, onay |
| 12–32 | Kodlama |
| 32–40 | Test ve hata düzeltme |
| 40–45 | Analiz, devam soruları, sizin sorularınız |

15. dakikada hâlâ kod yazmaya başlamadıysanız, en iyi çözümü aramayı bırakıp **çalışan** bir çözümle ilerleyin. Çalışan ve yavaş bir çözüm, yarım kalmış en iyi çözümden daha çok puan alır.

## Özet

1. Netleştir → 2. örnekle → 3. anlat ve onay al → 4. kodla → 5. test et → 6. analiz et.
2. Kod yazmadan önce yaklaşım üzerinde anlaşın.
3. Sürekli sesli düşünün; görüşmeci yalnızca duyduğunu değerlendirebilir.
4. Kodunuzu kendiniz test edin; hatayı siz bulun.
