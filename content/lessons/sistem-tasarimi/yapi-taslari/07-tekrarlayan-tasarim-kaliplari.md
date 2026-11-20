---
title: Tekrarlayan Tasarım Kalıpları
summary: Soruların çoğu birkaç kalıbın birleşimidir. Okumayı ölçeklemek, yazmayı ölçeklemek, gerçek zamanlı güncellemeler, çekişme yönetimi, uzun süren işler, çok adımlı süreçler ve büyük dosyalar; her biri için karar ağacı.
minutes: 18
level: advanced
---

Yüzlerce farklı sistem tasarımı sorusu vardır, ama hepsi aynı birkaç **kalıbın** farklı birleşimleridir. Soruyu duyduğunuzda "bu hangi kalıplara dayanıyor?" diye sorabilirseniz tasarımın iskeleti kendiliğinden çıkar. Bu ders, önceki derslerdeki yapı taşlarını bu kalıplar etrafında toplayan bir başvuru sayfasıdır.

| Kalıp | Belirtisi | Örnek sorular |
| --- | --- | --- |
| Okumayı ölçeklemek | Okuma/yazma oranı yüksek | URL kısaltıcı, haber akışı, ürün kataloğu |
| Yazmayı ölçeklemek | Saniyede on binlerce yazma | Metrik toplama, sohbet, konum güncellemesi, beğeniler |
| Gerçek zamanlı güncellemeler | Kullanıcı yenilemeden görmeli | Sohbet, canlı skor, sürücü takibi, ortak düzenleme |
| Çekişme | Aynı kaynağa çok sayıda eşzamanlı istek | Bilet satışı, flaş indirim, açık artırma |
| Uzun süren işler | İş saniyelerden uzun sürer | Video dönüştürme, rapor üretme, toplu e-posta |
| Çok adımlı süreçler | Birden çok servis, hata ve telafi | Sipariş, ödeme, yolculuk eşleştirme |
| Büyük dosyalar | MB–GB boyutunda veri | Video platformu, dosya senkronizasyonu |

## 1. Okumayı ölçeklemek

Sıra önemlidir; her adım bir öncekinden daha pahalıdır:

1. **Sorgu ve indeks:** yavaş sorguyu düzelt, doğru bileşik indeksi ekle.
2. **Önbellek:** cache-aside, yazınca sil + TTL. Sıcak anahtarlar için uygulama içi bellek ve kopyalanmış anahtarlar.
3. **Okuma kopyaları:** kopyalama gecikmesini ve kendi yazdığını okuma sorununu söyle.
4. **CDN ve kenar önbelleği:** statik ve herkese aynı içerik.
5. **Önceden hesaplama (denormalizasyon):** okumada join yapmak yerine yazmada sonucu hazırla. Haber akışında yazma anında dağıtım (fan-out) bunun örneğidir.

## 2. Yazmayı ölçeklemek

1. **Dikey ölçek ve toplu yazma:** tek tek yazmak yerine birleştirip toplu yaz.
2. **Kuyrukla tamponlama:** ani yükü kuyruk emer, işçiler sabit hızda yazar.
3. **Yazma ağırlıklı depo:** LSM tabanlı (Cassandra, ScyllaDB) ya da yalnızca ekleme yapılan günlük (Kafka).
4. **Parçalama:** iyi bir bölüm anahtarı; sıcak anahtarları tuzla.
5. **Bellekte biriktirme:** sayaçlar ve konumlar gibi sık değişen değerleri bellekte tutup seyrek kalıcılaştır; birkaç saniyelik kayıp kabul edilebiliyorsa.

## 3. Gerçek zamanlı güncellemeler

İki ayrı soru vardır:

- **İstemciye nasıl iletirim?** Yoklama → SSE → WebSocket (bkz. [Ağ, İletişim ve API Tasarımı](/tracks/sistem-tasarimi/ag-ve-api-tasarimi)).
- **Olayı doğru bağlantı sunucusuna nasıl ulaştırırım?** Bağlantılar birçok sunucuya dağılmıştır:
  - **Pub/Sub** (Redis Pub/Sub, NATS): her bağlantı sunucusu ilgili kanallara abone olur. Basit ve hızlı; mesaj kalıcı değildir.
  - **Kalıcı günlük** (Kafka): kaçırılan mesajlar yeniden okunabilir; gecikmesi biraz daha yüksektir.
  - **Bağlantı kayıt defteri:** "kullanıcı X hangi sunucuda?" eşlemesi (Redis) ve sunucuya doğrudan gönderim.

Çevrimdışı istemciler için kalıcı depo şarttır: istemci yeniden bağlandığında "son gördüğüm mesaj kimliği şu, sonrasını ver" der.

## 4. Çekişme

Aynı kayda çok sayıda eşzamanlı yazma (son koltuk, son stok):

| Yöntem | Ne zaman |
| --- | --- |
| **Koşullu atomik güncelleme** (`UPDATE ... WHERE durum = 'bos'`) | Tek kayıt, tek veritabanı; çoğu durumda ilk tercih |
| İyimser kilit (sürüm sütunu) | Çakışma seyrek |
| Kötümser kilit (`SELECT ... FOR UPDATE`) | Çakışma sık, transaction kısa |
| Süreli rezervasyon | Kullanıcının işlemi dakikalar sürer (ödeme ekranı) |
| Dağıtık kilit (+ fencing token) | Kaynak birden çok sistemde |
| **Sanal bekleme odası / kuyruk** | Talep kapasiteden kat kat fazla (konser bileti) |
| Tek yazıcıya yönlendirme | Kaynağın bütün yazmaları aynı bölüme/işçiye gider, sıra ile işlenir |

Ayrıntılı örnek: [Bilet Satış Sistemi](/tracks/sistem-tasarimi/bilet-satis-sistemi).

## 5. Uzun süren işler

Kullanıcıyı saniyelerce bekletmeyin:

1. API isteği kabul eder, işi kuyruğa koyar ve hemen `202 Accepted` + iş kimliği döndürür.
2. İşçiler kuyruktan alır, ilerlemeyi bir durum tablosuna yazar.
3. İstemci durumu yoklar ya da tamamlanınca bildirim (WebSocket, push, e-posta) alır.

Dikkat edilecekler: idempotent işçiler, sınırlı yeniden deneme, ölü mektup kuyruğu, işin zaman aşımı (işçi ölürse iş başka işçiye geçsin: kuyruktaki **görünmezlik süresi** ya da kiralama), öncelik kuyrukları.

## 6. Çok adımlı süreçler

Sipariş → ödeme → stok → kargo gibi adımlar farklı servislerdeyse:

- **Saga** (koreografi ya da orkestrasyon) ve telafi işlemleri.
- **Outbox** ile olay yayınlama; **idempotent** tüketiciler.
- Uzun ve karmaşık akışlar için **dayanıklı iş akışı motorları** (Temporal, AWS Step Functions): adımların durumu motor tarafından saklanır; süreç çökse bile kaldığı adımdan devam eder, zamanlayıcılar ("30 dakika içinde ödeme gelmezse iptal et") yerleşik gelir.

Ayrıntılar: [Tutarlılık, Uzlaşma ve Dağıtık İşlemler](/tracks/sistem-tasarimi/tutarlilik-uzlasma-ve-dagitik-islemler).

## 7. Büyük dosyalar

- Dosya nesne deposuna, meta veri veritabanına.
- Ön imzalı URL ile **doğrudan** yükleme ve indirme; uygulama sunucusundan geçirme.
- Parçalı, sürdürülebilir yükleme; senkronizasyon için blok bazında fark.
- Yükleme sonrası işleme (tarama, dönüştürme) olayla tetiklenen işçilerde.
- Dağıtım CDN'den.

Ayrıntılar: [Arama, Konum ve Büyük Dosyalar](/tracks/sistem-tasarimi/arama-konum-ve-buyuk-dosyalar).

## Kalıpları tanımak: örnek eşleştirmeler

| Soru | Baskın kalıplar |
| --- | --- |
| Instagram | Büyük dosyalar + okumayı ölçeklemek (akış) |
| WhatsApp | Gerçek zamanlı + yazmayı ölçeklemek |
| Uber | Yazmayı ölçeklemek (konum) + gerçek zamanlı + çekişme (eşleştirme) + çok adımlı süreç |
| Ticketmaster | Çekişme + okumayı ölçeklemek (etkinlik sayfası) |
| YouTube | Büyük dosyalar + uzun süren işler (dönüştürme) + okumayı ölçeklemek (CDN) |
| Google Docs | Gerçek zamanlı + çekişme (eşzamanlı düzenleme: OT/CRDT) |
| Ödeme sistemi | Çok adımlı süreç + idempotency + mutabakat |
| Metrik/izleme sistemi | Yazmayı ölçeklemek + akış işleme |

## Özet

Soruyu duyunca:

1. Okuma/yazma oranını ve hacmini tahmin et → hangi ölçekleme kalıbı?
2. Kullanıcı neyi **anında** görmeli → gerçek zamanlı kalıbı gerekiyor mu?
3. Aynı kaynak için yarış var mı → çekişme kalıbı.
4. Saniyelerden uzun süren ya da birden çok servise yayılan iş var mı → kuyruk, saga, iş akışı.
5. Büyük ikili veri var mı → nesne deposu + CDN.

Bu kalıpları tanıdığınızda tasarım ezber olmaktan çıkar ve yeni bir soruyu da aynı araçlarla çözebilirsiniz.

**Daha fazlası:** Hello Interview, [System Design in a Hurry: Patterns](https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns) (kalıp yaklaşımının ücretsiz ve çok iyi bir anlatımı).
