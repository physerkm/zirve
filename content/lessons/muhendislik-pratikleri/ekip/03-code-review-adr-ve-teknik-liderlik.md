---
title: Code Review, ADR ve Teknik Liderlik
summary: İyi bir code review'da nelere bakılır, nasıl yorum yazılır ve alınır, review'ı hızlı tutmak, mimari karar kayıtları (ADR) ve tasarım belgeleri, mentorluk, senior ve lead mühendisten beklenenler ve davranışsal mülakatta bunları anlatmak.
minutes: 20
level: intermediate
---

Senior ve lead ilanlarının hepsinde aynı üçlü geçer: **code review, mentorluk ve mimari kararlar**. GlobalPBX "code review kültürü ve kök neden analizi" der, Sürat Kargo "junior'lara mentorluk ve mimari kararlar", lead rol tanımları "ADR yazmak ve tasarım review'larını yönetmek". Bu beceriler kod yazmaktan farklıdır ve mülakatta davranışsal sorularla ölçülür.

## Code review neden yapılır?

Sıralama önemlidir:

1. **Bilgi paylaşımı:** kodun tek bir kişinin kafasında kalmaması. Review eden de kod tabanını öğrenir.
2. **Tasarım ve bakım kolaylığı:** kodun altı ay sonra okunabilir ve değiştirilebilir olması.
3. **Hata yakalamak:** önemlidir ama testlerin ve otomasyonun yerini tutmaz.
4. **Tutarlılık:** ekibin ortak kurallarının korunması.

Biçim, isimlendirme kuralları, kullanılmayan değişkenler ve basit güvenlik kalıpları **araçlara** bırakılır (formatlayıcı, analizörler, CI). İnsan review'ı, makinenin göremediği şeylere odaklanır.

## Neye bakılır?

Önceliğe göre:

| Alan | Sorular |
| --- | --- |
| **Doğruluk** | İstenen davranışı yapıyor mu? Kenar durumlar: boş liste, null, eşzamanlı istek, zaman aşımı, tekrar eden mesaj? |
| **Tasarım** | Doğru yerde mi? Mevcut yapıya uyuyor mu? Gereğinden karmaşık mı? Gereksiz soyutlama var mı? |
| **Güvenlik** | Yetki kontrolü, girdi doğrulama, gizli veri, SQL enjeksiyonu, loglara sızan bilgi |
| **Performans** | N+1 sorgu, döngüde ağ çağrısı, sınırsız liste, eksik indeks, gereksiz tahsis |
| **Test** | Davranışı doğrulayan testler var mı? Hata yolları test edilmiş mi? Testler okunur mu? |
| **Okunabilirlik** | İsimler niyeti anlatıyor mu? Bir sonraki geliştirici bunu anlar mı? |
| **Operasyon** | Loglar, metrikler, hata mesajları yeterli mi? Geri alınabilir mi? Migration geriye uyumlu mu? |

İyi bir alışkanlık: önce PR açıklamasını ve testleri okuyun. Ne yapılmaya çalışıldığını anlamadan satır satır yorum yapmak, büyük tasarım sorununu kaçırıp küçük ayrıntılara takılmaktır.

## Yorum yazmak

Kötü:

> Bu yanlış.

İyi:

> Bu döngü her sipariş için ayrı bir sorgu atıyor (N+1). 500 siparişlik bir müşteride 500 sorgu demek. `Include(o => o.Lines)` ya da bir projeksiyonla tek sorguya indirebiliriz. Ne dersin?

İlkeler:

- **Kodu yorumla, kişiyi değil.** "Sen yanlış yapmışsın" değil, "bu satır şu durumda hata verir".
- **Nedenini söyle.** Gerekçesiz yorum ya körü körüne uygulanır ya da tartışma başlatır.
- **Önem derecesini belirt.** Ekipler ön ekler kullanır: `blocker:` (birleştirmeden önce mutlaka), `suggestion:` (değerlendir), `nit:` (küçük, isteğe bağlı), `question:` (anlamak için soruyorum).
- **Soru sor.** "Burada X'i düşündün mü?" çoğu zaman "X yap"tan daha iyi sonuç verir. Belki yazar düşünmüş ve sebebi vardır.
- **İyi olanı da söyle.** "Bu test çok açıklayıcı olmuş" bir zaman kaybı değildir.
- **Uzun tartışmayı yazıda sürdürmeyin.** Üçüncü tur yorumdan sonra kısa bir görüşme yapın, kararı PR'a yazın.

## Yorum almak

- Yorum kodla ilgilidir, seninle değil. Savunmaya geçme.
- Her yoruma cevap ver: düzelttim, düzeltmeyeceğim (çünkü...), ayrı bir iş açtım.
- Katılmıyorsan gerekçeni anlat. Senior bir review eden de yanılabilir.
- Aynı yorumu sık alıyorsan, bir sonraki PR'dan önce kendi kontrol listene ekle.

## Review'ı hızlı tutmak

Beklemekte olan PR'lar ekibin en büyük gizli maliyetlerinden biridir: yazar başka işe geçer, bağlam kaybolur, çakışmalar büyür.

- **Küçük PR'lar.** 400 satırın üzerinde review kalitesi belirgin şekilde düşer. Büyük işi sıralı küçük PR'lara bölün.
- **Hızlı ilk cevap.** Birçok ekip "bir iş günü içinde ilk review" hedefi koyar.
- **Review'ı iş olarak görün.** Başkasının PR'ını incelemek, kendi yeni işine başlamaktan çoğu zaman daha değerlidir: ekipte bitmiş iş sayısını artırır.
- **Eşli programlama** ya da birlikte review, karmaşık değişikliklerde yazılı yorum turlarından daha hızlıdır.

## Mimari karar kayıtları (ADR)

İki yıl sonra biri "Neden burada Kafka değil de RabbitMQ kullanıyoruz?" diye sorduğunda cevap kimsenin aklında değildir. ADR, önemli bir mimari kararı **bağlamı ve gerekçesiyle** kaydeden kısa bir belgedir. Michael Nygard'ın önerdiği biçim:

```markdown
# ADR-014: Sipariş olayları için RabbitMQ kullanmak

- Durum: Kabul edildi (2026-11-12)
- Karar verenler: Backend ekibi

## Bağlam
Sipariş, fatura ve bildirim servisleri arasında asenkron iletişim gerekiyor.
Günlük ~90 bin mesaj, en yüksek saatte ~50 mesaj/sn bekleniyor. Ekipte RabbitMQ
deneyimi var, Kafka deneyimi yok. Olayların yeniden oynatılması şu an bir ihtiyaç değil.

## Karar
Quorum queue'larla RabbitMQ ve MassTransit 8 kullanılacak. Mesajlar outbox ile yayımlanacak.

## Değerlendirilen seçenekler
- Kafka: yeniden oynatma ve çok yüksek verim sağlar, ama bu hacim için fazla ve operasyon maliyeti yüksek.
- Azure Service Bus: yönetilen servis, ama altyapımız şu an şirket içinde.

## Sonuçlar
+ Ekip hemen üretken olur, işletme bilgisi mevcut.
- İleride olay geçmişini yeniden oynatma gerekirse ayrı bir çözüm gerekecek.
- RabbitMQ kümesinin izlenmesi ve yükseltilmesi ekibin sorumluluğunda.
```

İlkeler:

- **Kısa olsun.** Bir sayfa yeterlidir.
- **Depoda, kodun yanında** (`docs/adr/`) dursun ve PR ile review edilsin.
- **Değiştirilmez.** Karar değişirse yeni bir ADR yazılır ve eskisi "yerine ADR-031 geçti" olarak işaretlenir. Geçmişin kendisi değerlidir.
- **Seçenekleri ve olumsuz sonuçları** da yazın. Yalnızca seçilen yolun güzel yanlarını anlatan ADR bir karar kaydı değil, bir savunmadır.

Daha büyük değişiklikler için **tasarım belgesi** (design doc ya da RFC) yazılır: problem, hedefler ve hedef olmayanlar, önerilen tasarım, alternatifler, riskler, yayılma (rollout) planı. Kod yazılmadan önce paydaşların görüşü alınır. Sistem Tasarımı yolundaki mülakat çerçevesi bu belgelerin yapısıyla neredeyse aynıdır.

## Mentorluk

Junior ve orta seviye geliştiricilere mentorluk, senior ilanlarının sabit maddesidir. İyi mentorluk:

- **Cevabı vermek yerine yol göstermek:** "Hangi logları kontrol ettin? İzde zaman nerede harcanmış görünüyor?" Kişi bir sonraki sefere kendi bulur.
- **Uygun zorlukta iş vermek** ve güvenli bir ortamda hata yapmaya izin vermek.
- **Review'ı öğretme aracı olarak kullanmak:** yalnızca ne değil, neden olduğunu anlatmak. Gerekirse bir sonraki PR'ı birlikte yazmak.
- **Düzenli birebir görüşmeler:** teknik konuların yanında kariyer hedefleri ve engeller.
- **Görünür kılmak:** mentee'nin işini toplantılarda onun adıyla anmak.

## Senior ve lead mühendisten beklenenler

| Alan | Orta seviye | Senior | Lead / Staff |
| --- | --- | --- | --- |
| Kapsam | Tanımlı görevler | Bir özellik ya da servis uçtan uca | Birden fazla servis ya da ekip |
| Belirsizlik | Net tanım bekler | Belirsiz problemi tanımlar ve parçalar | Hangi problemin çözülmesi gerektiğine karar verir |
| Etki | Kendi çıktısı | Ekibin çıktısı (review, mentorluk) | Organizasyonun teknik yönü |
| Kararlar | Uygular | Ödünleşimleri değerlendirir ve yazar (ADR) | Uzun vadeli teknik yol haritası |
| Operasyon | Kendi koduyla ilgili hatalar | Servisin sahipliği, on-call, olay yönetimi | Güvenilirlik standartları ve süreçleri |

Senior olmanın işareti yalnızca daha zor kod yazmak değil, **başkalarını daha etkili kılmaktır**.

## Davranışsal mülakatta anlatmak

Bu konular STAR yöntemiyle anlatılan sorularla ölçülür:

- "Bir code review'da ciddi bir sorun bulduğun bir durumu anlat."
- "Bir teknik karara katılmadığın ve fikrini savunduğun bir zamanı anlat."
- "Bir junior geliştiricinin gelişmesine yardım ettiğin bir örnek ver."
- "Verdiğin bir mimari kararın yanlış çıktığı bir durumu anlat. Ne öğrendin?"

İyi cevabın özellikleri: somut bir durum, **senin** ne yaptığın ("biz" değil), ölçülebilir bir sonuç ve öğrenilen ders. Hata hikâyeleri, sahiplik ve öğrenme gösterdiği için değerlidir.

## Mülakatta sorulur

- **"Code review'da nelere bakarsın?"** Önce doğruluk ve tasarım, sonra güvenlik, performans, test ve okunabilirlik. Biçimi araçlara bırakırım.
- **"Review'da katılmadığın bir yorum gelirse?"** Gerekçemi anlatırım. Uzarsa kısa bir görüşme yapar, kararı PR'a yazarım.
- **"ADR nedir, neden yazılır?"** Önemli bir mimari kararın bağlamını, seçeneklerini ve sonuçlarını kaydeden kısa belge. Kararın nedeni zamanla unutulmasın diye.
- **"PR'lar günlerce bekliyor. Ne yaparsın?"** PR'ları küçültür, ilk cevap için hedef koyar, review'ı ekipte öncelikli iş haline getiririm.
- **"Senior mühendisi orta seviyeden ayıran nedir?"** Belirsiz problemleri tanımlayıp parçalaması, ödünleşimleri yazılı değerlendirmesi ve ekibin geri kalanını daha etkili kılması.

## Özet

- Code review'ın ilk amacı bilgi paylaşımı ve bakım kolaylığıdır. Biçimi araçlar denetler.
- Doğruluk ve tasarıma öncelik verin. Yorumlar kodu hedefler, nedenini söyler ve önem derecesini belirtir.
- Küçük PR'lar ve hızlı ilk cevap ekibin akışını korur.
- ADR'ler kararları bağlamı, seçenekleri ve olumsuz sonuçlarıyla birlikte, kodun yanında kaydeder.
- Mentorluk yol gösterir, cevap vermez. Senior olmak başkalarını daha etkili kılmaktır.
