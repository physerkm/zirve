---
title: Agile ve Scrum
summary: Agile manifestonun özü, Scrum rolleri, etkinlikleri ve çıktıları, iyi bir kullanıcı hikâyesi ve kabul kriterleri, tahminleme ve story point, Kanban ve akış metrikleri, Jira iş akışı, teknik borcun sprint'e girmesi ve mülakatta Agile soruları.
minutes: 18
level: beginner
---

İngiltere'deki ".NET Software Developer" ilanlarının yaklaşık yarısında "Agile" geçer. Türkiye'deki ilanlar "Agile metodolojisine uyum", "sprint planlama, retrospektif ve günlük toplantı deneyimi", "Jira" ister. Bu konu genellikle davranışsal mülakatta karşına çıkar: "Ekibiniz nasıl çalışıyordu?", "Sprint'in ortasında öncelik değişirse ne yaparsın?"

## Agile'ın özü

2001 tarihli Agile Manifesto dört değer önerir. Sağdakiler de değerlidir, ama soldakiler daha değerlidir:

- **Bireyler ve etkileşimler**, süreçler ve araçlardan.
- **Çalışan yazılım**, kapsamlı dokümantasyondan.
- **Müşteriyle iş birliği**, sözleşme pazarlığından.
- **Değişime yanıt vermek**, bir planı takip etmekten.

Pratikteki anlamı: işi küçük parçalar halinde teslim et, sık geri bildirim al, öğrendikçe yönünü değiştir. Altı ay sonra büyük bir teslimat yerine her iki haftada bir çalışan bir artış (increment).

Agile bir metodoloji değil, bir değerler kümesidir. Scrum ve Kanban bu değerleri uygulayan çerçevelerdir.

## Scrum

### Roller (sorumluluklar)

| Rol | Sorumluluk |
| --- | --- |
| **Product Owner** | Ürünün değerini en üst düzeye çıkarmak. Product backlog'un sahibi ve önceliklendireni. "Ne" ve "neden" sorularını cevaplar |
| **Scrum Master** | Ekibin Scrum'ı etkili uygulamasını sağlar. Engelleri kaldırır, toplantıları kolaylaştırır. Proje yöneticisi değildir |
| **Geliştiriciler** | Artışı üreten herkes: backend, frontend, test, tasarım. "Nasıl" sorusunun sahibi |

### Etkinlikler

| Etkinlik | Süre (2 haftalık sprint) | Amaç |
| --- | --- | --- |
| **Sprint** | 1–4 hafta, genellikle 2 | Sabit uzunlukta, sonunda kullanılabilir bir artış |
| **Sprint Planning** | ~4 saat | Sprint hedefi, hangi işlerin alınacağı ve nasıl yapılacağı |
| **Daily Scrum** | 15 dakika | Sprint hedefine göre ilerlemeyi gözden geçirmek ve günü planlamak |
| **Sprint Review** | ~2 saat | Yapılanı paydaşlara göstermek, geri bildirim almak, backlog'u güncellemek |
| **Sprint Retrospective** | ~1,5 saat | Ekibin **nasıl çalıştığını** iyileştirmek |

Daily Scrum bir durum raporu toplantısı değildir. Klasik "dün ne yaptım, bugün ne yapacağım, engelim ne" formatı yaygındır ama asıl soru "sprint hedefine ulaşacak mıyız ve bugün buna nasıl katkı veririz?" sorusudur. Teknik tartışmalar toplantıdan sonra ilgili kişilerle yapılır.

### Çıktılar

- **Product Backlog:** ürün için yapılabilecek her şeyin öncelik sıralı listesi.
- **Sprint Backlog:** sprint hedefi ve bu sprint için seçilen işler.
- **Increment:** sprint sonunda **Definition of Done**'ı karşılayan, kullanılabilir çıktı.

**Definition of Done (DoD):** bir işin "bitti" sayılması için gerekenler. Örnek: kod review edildi, testler yazıldı ve geçiyor, staging'e dağıtıldı, dokümantasyon güncellendi, ürün sahibi kabul etti. DoD olmadan "bitti" kelimesi her kişide farklı anlama gelir.

**Definition of Ready:** bir işin sprint'e alınabilmesi için gerekenler: kabul kriterleri net, bağımlılıklar belli, tahmin edilmiş.

## Kullanıcı hikâyesi ve kabul kriterleri

```text
Bir müşteri olarak,
siparişimi kargoya verilmeden önce iptal edebilmek istiyorum,
böylece yanlışlıkla verdiğim siparişin parasını geri alabilirim.

Kabul kriterleri:
- "Ödendi" ya da "Hazırlanıyor" durumundaki siparişte "İptal et" butonu görünür.
- "Kargoya verildi" ve sonrasında buton görünmez.
- İptal edilen ödenmiş siparişte iade başlatılır ve müşteriye e-posta gider.
- İptal, sipariş geçmişinde tarih ve sebeple görünür.
```

İyi bir hikâye **INVEST** kriterlerine uyar: **I**ndependent (bağımsız), **N**egotiable (konuşulabilir), **V**aluable (değerli), **E**stimable (tahmin edilebilir), **S**mall (küçük), **T**estable (test edilebilir).

Kabul kriterleri bazen **Given/When/Then** biçiminde yazılır ve doğrudan otomatik testlere dönüşür:

```text
Given "Ödendi" durumunda bir sipariş
When müşteri siparişi iptal ederse
Then sipariş "İptal edildi" durumuna geçer
And tutar kadar iade başlatılır
```

Büyük işler **epic** olarak tanımlanır ve hikâyelere bölünür. Bölerken **dikey dilimleme** tercih edilir: "veritabanı tablosu", "API" ve "arayüz" diye yatay katmanlara değil, her biri uçtan uca küçük bir değer veren dilimlere bölünür ("yalnızca ödenmiş siparişin iptali", "sonra iade e-postası").

## Tahminleme

**Story point**, bir işin büyüklüğünü (karmaşıklık, belirsizlik, iş miktarı) **göreli** olarak ifade eder. Saat değildir. Genellikle Fibonacci benzeri bir ölçek kullanılır (1, 2, 3, 5, 8, 13): büyüdükçe belirsizlik arttığı için aralıklar açılır.

**Planning poker:** herkes tahminini aynı anda açar. En düşük ve en yüksek tahmini veren gerekçesini anlatır. Asıl değer sayıda değil, bu konuşmadadır: biri "bu iş için mevcut bir servis var" diyor, diğeri "o servisin bu durumu desteklemediğini biliyorum" diyor. Gizli varsayımlar ortaya çıkar.

**Velocity:** ekibin sprint başına tamamladığı ortalama puan. Yalnızca ekibin kendi planlaması için anlamlıdır. Ekipler arasında karşılaştırmak ya da performans ölçütü yapmak puan enflasyonuna yol açar.

13'ten büyük tahmin genellikle "bu iş bölünmeli" ya da "önce araştırma gerekli" demektir. Belirsizliği azaltmak için zaman sınırlı bir araştırma işi (**spike**) açılır.

Bazı ekipler tahminden tamamen vazgeçer (#NoEstimates) ve işleri benzer küçüklüğe bölüp **sayar**. Bu da geçerli bir yaklaşımdır.

## Kanban

Kanban, sprint'ler yerine **sürekli akışa** dayanır:

```text
| Yapılacak | Analiz (2) | Geliştirme (3) | Review (2) | Test (2) | Bitti |
```

- **Panoda akışı görselleştir.**
- **Devam eden işi sınırla (WIP limit):** "Geliştirme" sütununda en fazla 3 iş. Sınır dolunca yeni iş başlatılmaz, takılan işler bitirilir. Bu, darboğazları görünür yapar ve "her şeye başlanmış, hiçbir şey bitmemiş" durumunu önler.
- **Akışı ölç:** **cycle time** (işin başlamasından bitmesine), **lead time** (talepten teslime), **throughput** (birim zamanda biten iş).

Destek ve operasyon ekipleri ve öngörülemeyen iş akışı olan ekipler için Kanban daha uygundur. Birçok ekip ikisini birleştirir (Scrumban).

## Jira'da iş akışı

Tipik bir hikâye akışı: `To Do → In Progress → Code Review → QA → Done`. Bir geliştiriciden beklenenler:

- İş başladığında karta atanmak ve durumu güncel tutmak.
- Dal ve commit'lerde iş anahtarını kullanmak (`feature/ORD-412-cursor-sayfalama`, commit'te `ORD-412`). Jira bunları karta bağlar.
- Takıldığında beklemek yerine kartı işaretlemek ve günlük toplantıda söylemek.
- Hata kaydında: tekrar üretme adımları, beklenen ve gerçek davranış, ortam, log ya da iz kimliği.

## Teknik borç ve sprint

Teknik borç, bugün hızlı gitmek için alınan ve ileride faiziyle ödenen kısayollardır. Görünmez kalırsa birikir ve ekip yavaşlar.

- Borcu backlog'da görünür kılın: etkisini iş diliyle yazın ("Bu modüle her özellik eklemek iki gün fazla sürüyor").
- Sprint kapasitesinin belirli bir kısmını (ör. %15–20) sürekli borç ödemeye ayırın.
- "İzci kuralı": dokunduğun kodu bulduğundan biraz daha temiz bırak.

## Mülakatta sorulur

- **"Scrum Master ile proje yöneticisi aynı şey mi?"** Hayır. Scrum Master ekibe hizmet eder ve süreci kolaylaştırır. İşi atamaz, ekip kendini organize eder.
- **"Story point neden saat değil?"** Göreli büyüklüktür. Belirsizliği içerir ve kişiden bağımsızdır. Saat tahminleri kişiye göre değişir ve sistematik olarak iyimserdir.
- **"Sprint ortasında acil bir iş gelirse?"** Ürün sahibiyle sprint hedefine etkisini konuşurum. Gerçekten acilse eşdeğer büyüklükte bir iş sprint'ten çıkarılır. Sık oluyorsa bunu retrospektifte konuşur, belki Kanban'a ya da tampon kapasiteye geçeriz.
- **"Velocity'niz neden düştü?"** Sebebi anlamaya çalışırım: teknik borç, kesintiler, belirsiz işler, ekip değişikliği. Velocity bir teşhis aracıdır, hedef değil.
- **"İyi bir retrospektif nasıl olur?"** Güvenli bir ortam, somut gözlemler ve sonunda sahibi ve tarihi belli bir ya da iki iyileştirme eylemi. Bir sonraki retrospektifte bu eylemlerin takibi.

## Özet

- Agile bir değerler kümesidir: küçük artışlar, sık geri bildirim, değişime uyum.
- Scrum: üç rol, sabit uzunlukta sprint, dört etkinlik, üç çıktı. Definition of Done "bitti"yi tanımlar.
- İyi hikâye INVEST'e uyar, test edilebilir kabul kriterleri vardır ve dikey dilimlenir.
- Story point göreli büyüklüktür. Değeri tahmin konuşmasındadır. Velocity yalnızca ekibin kendi planlaması içindir.
- Kanban akışı görselleştirir, devam eden işi sınırlar ve cycle time ile ölçer.
- Teknik borç görünür kılınır ve sürekli ödenir.
