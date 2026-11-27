---
title: Yapay Zekâ Destekli Geliştirme
summary: Kodlama asistanları ve ajanlarla verimli ve güvenli çalışmak, bağlam yönetimi, görevleri doğru tarif etmek, üretilen kodu review etmek, testle doğrulamak, güvenlik ve lisans riskleri, mülakatta bu konuyu anlatmak.
minutes: 16
level: beginner
---

Trendyol'un ilanı "AI kodlama araçlarıyla (Cursor, Codex, LLM'ler) deneyim ya da bunları kullanmaya güçlü istek, kalite ve güvenlik standartlarını koruyarak" der. GlobalPBX "prompt engineering, context yönetimi, AI destekli refactoring, debugging ve code review" ister. Microsoft "ajan tabanlı üretkenlik araçları" kullanımını tercih sebebi sayar. Mesaj açıktır: şirketler bu araçları kullanan, ama çıktısına körü körüne güvenmeyen mühendis arıyor.

## Araç türleri

| Tür | Ne yapar | Örnek kullanım |
| --- | --- | --- |
| **Satır içi tamamlama** | Yazdığın kodun devamını önerir | Tekrarlayan kod, test verisi |
| **Sohbet asistanı** | Soru cevaplar, kod açıklar, parça üretir | "Bu LINQ sorgusu hangi SQL'i üretir?" |
| **Kodlama ajanı** | Depoyu okur, birden fazla dosyayı değiştirir, komut çalıştırır, testleri koşar | "Bu uç noktaya sayfalama ekle ve testlerini yaz" |
| **Review asistanı** | PR'daki değişiklikleri inceler, olası hataları işaretler | İkinci göz |

Ajanlar en güçlü ama en dikkat isteyen türdür, çünkü senin yerine **eylem** yaparlar.

## Bağlam her şeydir

Bir asistan yalnızca kendisine verilen bağlamı bilir. Kötü sonuçların çoğu kötü bağlamdan gelir.

**Zayıf istek:** "Sipariş servisine iptal ekle."

**Güçlü istek:**

> `Features/Orders` altına sipariş iptali ekle. Mevcut `PlaceOrder.cs` dikey dilim yapısını örnek al. Kural: yalnızca `Submitted` ve `Paid` durumundaki siparişler iptal edilebilir. `Paid` ise `RefundRequested` domain olayı üretilmeli. Uç nokta `POST /api/orders/{id}/cancellation`, başarıda 204, kural ihlalinde ProblemDetails ile 409 dönmeli. `OrderTests.cs`'deki stille birim testleri ve `OrderApiTests.cs`'deki stille bir entegrasyon testi yaz. Yeni paket ekleme.

İyi bir istekte şunlar vardır: **ne** (hedef), **nerede** (dosyalar, örnek alınacak kod), **kurallar** (iş kuralları, kısıtlar), **bitti tanımı** (testler, durum kodları) ve **yapılmayacaklar**.

Ekip düzeyinde bağlam: Birçok araç depodaki bir talimat dosyasını (ör. `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) her oturumda okur. Bu dosyaya proje yapısı, kodlama kuralları, test komutları ve yasaklar yazılır. Böylece her geliştirici aynı bağlamı tekrar tekrar yazmaz.

## Verimli çalışma alışkanlıkları

- **Önce plan, sonra kod.** Büyük işlerde önce ajandan bir plan iste ve gözden geçir. Yanlış yöne giden bir planı düzeltmek, yanlış yazılmış yirmi dosyayı düzeltmekten ucuzdur.
- **Küçük adımlar.** Bir seferde tek bir anlamlı değişiklik. Her adımdan sonra derle, testleri çalıştır, commit et. Geri dönmek kolaylaşır.
- **Testleri doğrulayıcı olarak kullan.** "Testler geçene kadar düzelt" ajanlara iyi bir hedef verir. Ama testleri de ajan yazdıysa, testlerin doğru davranışı doğruladığını sen kontrol et. Ajan, testi kodu geçecek şekilde değiştirebilir.
- **Keşif için kullan.** Yeni bir kod tabanında "kimlik doğrulama akışı nerede, hangi dosyalardan geçiyor?" sorusu dakikalar kazandırır.
- **Sıkıcı işleri devret:** test verisi, eşleme kodu, migration taslağı, belge, toplu yeniden adlandırma.
- **Düşünmeyi devretme.** Mimari karar, güvenlik modeli ve iş kuralı yorumlaması senin sorumluluğundadır.

## Üretilen kodu review etmek

AI'ın yazdığı kod, bir stajyerin yazdığı kod gibi incelenir: hızlı ve özgüvenli, ama bağlamdan habersiz olabilir. Özellikle bakılacaklar:

| Risk | Örnek |
| --- | --- |
| **Uydurma API** | Var olmayan bir metot ya da paket sürümü. Derleme bunu yakalar, ama yalnızca derlenirse |
| **Eski kalıplar** | Eğitim verisindeki eski sürüm alışkanlıkları: `Startup.cs`, Swashbuckle, `new HttpClient()` |
| **Sessiz davranış değişikliği** | Refactor sırasında bir kenar durumu ya da hata yolu kaybolmuş |
| **Güvenlik** | Dizgi birleştirmeli SQL, eksik yetki kontrolü, loglara yazılan gizli veri, gevşek CORS |
| **Gereksiz karmaşıklık** | İstenmemiş soyutlamalar, kullanılmayan parametreler, fazladan paketler |
| **Kapsam taşması** | İstenmeyen dosyaların da değiştirilmesi |
| **Bağımlılık riski** | Önerilen paketin gerçekten var olduğu, bakımlı ve güvenilir olduğu. Var olmayan paket adlarını kötü niyetli kişilerin kaydetmesi bilinen bir saldırı türüdür (slopsquatting) |

Kural: **anlamadığın kodu birleştirme.** "AI yazdı" bir PR açıklaması değildir. Kodun sorumluluğu commit edene aittir.

## Güvenlik ve gizlilik

- **Gizli bilgileri asistanla paylaşma:** bağlantı dizgisi, müşteri verisi, üretim logları. Şirketin hangi araçlara ve hangi verilere izin verdiğini öğren. Kurumsal sürümlerin veri saklama politikaları farklıdır.
- **Ajan izinlerini sınırla:** komut çalıştıran bir ajanın üretim ortamına, gizli anahtarlara ya da `git push --force` yetkisine erişmesi gerekmez. Mümkünse izole bir ortamda (konteyner, geçici dal) çalıştır.
- **Depodaki talimatlara dikkat:** ajanlar okudukları dosyalardaki ve web sayfalarındaki metinleri talimat gibi yorumlayabilir (prompt injection). Güvenilmeyen içerikle çalışırken ajanın yetkilerini daralt.
- **Lisans:** üretilen kodun açık kaynak bir projeden birebir kopyalanmış olma ihtimaline karşı şirket politikasını bil.

## Ölçmek

Verimlilik iddiası ölçülmelidir: PR süresi, hata oranı, review'da bulunan sorun sayısı. Ekipler AI ile daha çok kod yazıp daha çok hata da üretebilir. Kazancın kaliteyi düşürmeden geldiğini göstermek senior bir mühendisin işidir.

## Mülakatta nasıl anlatılır?

Davranışsal mülakatta "AI araçlarını nasıl kullanıyorsun?" sorusu artık sık geliyor. İyi bir cevap somut, dengeli ve sorumluluk sahibidir:

> "Kodlama ajanını özellikle iki iş için kullanıyorum: yeni bir kod tabanını keşfetmek ve iyi tanımlanmış, test edilebilir değişiklikler. Önce plan istiyor, onaylıyorum, sonra küçük adımlarla ilerliyorum. Her adımda testleri çalıştırıyorum. Geçen ay bir raporlama uç noktasına sayfalama ve filtre eklerken testleri ve eşleme kodunu ajana yazdırdım, işin yaklaşık yarısı kadar zaman kazandım. Ama review'da ajanın sayfa boyutuna üst sınır koymadığını gördüm ve düzelttim. Güvenlik ve yetki kodunu her zaman satır satır kendim okuyorum."

Kaçınılacaklar: "Her şeyi AI'a yazdırıyorum" (sorumsuz görünür) ve "Hiç kullanmıyorum, güvenmiyorum" (2026'da birçok ekip için kırmızı bayrak).

## Özet

- Şirketler AI araçlarını kullanan ama çıktısını sorgulayan mühendis istiyor.
- İyi istek: hedef, yer, kurallar, bitti tanımı ve yapılmayacaklar. Ekip bağlamı depodaki talimat dosyasında durur.
- Önce plan, küçük adımlar, testle doğrulama. Düşünme ve karar senin sorumluluğunda kalır.
- Üretilen kodu uydurma API, eski kalıp, güvenlik açığı, kapsam taşması ve sahte paket için incele.
- Gizli veriyi paylaşma, ajan yetkilerini sınırla, kazancı ölç. Mülakatta somut ve dengeli bir örnek anlat.
