---
title: NoSQL ve Arama (MongoDB ve Elasticsearch)
summary: NoSQL türleri ve ne zaman seçileceği, MongoDB'de belge modelleme, gömme ve referans, indeksler ve aggregation pipeline, .NET sürücüsü, Elasticsearch'te ters indeks, mapping, text ve keyword, analyzer, sorgu türleri, alaka skoru ve SQL'den senkronizasyon.
minutes: 24
level: intermediate
---

Türkiye ilanlarında Elasticsearch (İhlas, Sürat Kargo, Trendyol) ve MongoDB (İhlas, Trendyol, Sürat Kargo'da artı) sıkça geçer. Microsoft ilanları Cosmos DB der. Sistem Tasarımı yolunda veritabanı seçimini ve ters indeks fikrini kavram olarak gördük. Bu ders iki ürünün nasıl modelleneceğini, nasıl sorgulanacağını ve .NET'ten nasıl kullanılacağını anlatır.

## NoSQL türleri

| Tür | Örnek | Güçlü olduğu yer |
| --- | --- | --- |
| **Belge** | MongoDB, Cosmos DB, Couchbase | Esnek şema, iç içe veri, nesneye doğal eşleme |
| **Anahtar–değer** | Redis, DynamoDB | Anahtarla çok hızlı okuma ve yazma |
| **Geniş kolon** | Cassandra, ScyllaDB | Çok yüksek yazma hacmi, zaman serisi |
| **Graf** | Neo4j | Çok derin ilişkiler (sosyal ağ, öneri) |
| **Arama motoru** | Elasticsearch, OpenSearch | Tam metin arama, filtreleme ve toplama (facet), log analizi |

"NoSQL mi SQL mi?" sorusunun cevabı erişim desenindedir. İlişkisel veritabanı esnek sorgu, güçlü tutarlılık ve transaction'lar sunar. Çoğu iş uygulaması için hâlâ doğru varsayılandır. NoSQL, belirli bir erişim desenini (anahtarla okuma, çok yüksek yazma, tam metin arama) daha iyi ölçeklemek için **esnekliğin bir kısmından** vazgeçer. PostgreSQL'in `jsonb` desteği, belge esnekliğinin gerektiği birçok durumu ayrı bir veritabanı olmadan karşılar.

## MongoDB

Veri **belgeler** (BSON, ikili JSON) halinde **koleksiyonlarda** saklanır. Bir koleksiyondaki belgelerin aynı şemaya sahip olması zorunlu değildir, ama pratikte uygulama bir şema uygular (ve MongoDB şema doğrulamasını destekler).

```json
{
  "_id": "ord_8412",
  "customerId": "cus_7",
  "status": "Paid",
  "createdAt": { "$date": "2026-11-24T10:00:00Z" },
  "shippingAddress": { "city": "İstanbul", "district": "Kadıköy" },
  "lines": [
    { "sku": "SKU-1", "name": "Klavye", "qty": 1, "price": 1499.90 },
    { "sku": "SKU-9", "name": "Fare", "qty": 2, "price": 349.90 }
  ]
}
```

### Modelleme: gömme mi, referans mı?

İlişkisel modellemede önce veriyi normalleştirir, sonra sorguları yazarsınız. Belge modellemede **önce erişim desenini** düşünür, veriyi okunacağı biçimde saklarsınız.

| Gömme (embed) | Referans |
| --- | --- |
| Birlikte okunan ve birlikte değişen veri | Bağımsız okunan ya da çok sayıda belge tarafından paylaşılan veri |
| "Bir-az" ilişki: sipariş ve kalemleri, kullanıcı ve adresleri | "Bir-çok" ya da "çok-çok": müşteri ve bütün siparişleri, ürün ve yorumları |
| Tek okumada bütün veri, atomik güncelleme | Belge boyutu kontrol altında |

Kurallar:

- **Sınırsız büyüyen dizileri gömmeyin.** Bir ürünün bütün yorumlarını ürün belgesine gömmek, belgeyi 16 MB sınırına ve performans sorunlarına götürür.
- **Bilinçli tekrar (denormalizasyon) normaldir.** Sipariş kalemindeki ürün adı, sipariş anındaki adıdır. Ürün adı değişince eski siparişin değişmemesi gerekir. Burada tekrar bir hata değil, doğru modeldir.
- **Tek belge üzerindeki işlemler atomiktir.** Birden fazla belgeyi kapsayan transaction'lar desteklenir, ama sık ihtiyaç duyuluyorsa model ilişkisel bir veritabanına daha uygun olabilir.

### Sorgu ve indeks

```csharp
var client = new MongoClient(connectionString);   // singleton: bağlantı havuzunu yönetir
var orders = client.GetDatabase("shop").GetCollection<Order>("orders");

var recent = await orders
    .Find(o => o.CustomerId == "cus_7" && o.Status == "Paid")
    .SortByDescending(o => o.CreatedAt)
    .Limit(20)
    .ToListAsync(ct);

await orders.Indexes.CreateOneAsync(new CreateIndexModel<Order>(
    Builders<Order>.IndexKeys.Ascending(o => o.CustomerId).Descending(o => o.CreatedAt)));

await orders.UpdateOneAsync(
    o => o.Id == "ord_8412",
    Builders<Order>.Update.Set(o => o.Status, "Shipped").CurrentDate(o => o.UpdatedAt));
```

İndeks kuralları ilişkisel veritabanlarıyla aynıdır: bileşik indekste sıra önemlidir (eşitlik, sıralama, aralık: **ESR kuralı**), indekssiz sorgu koleksiyon taraması (`COLLSCAN`) yapar. `explain()` ile plan incelenir.

### Aggregation pipeline

Belgeler aşamalardan geçerek dönüştürülür. SQL'deki `WHERE`, `GROUP BY`, `JOIN` karşılıkları:

```js
db.orders.aggregate([
  { $match: { status: "Paid", createdAt: { $gte: ISODate("2026-11-01") } } },  // WHERE
  { $unwind: "$lines" },                                                         // diziyi satırlara aç
  { $group: { _id: "$lines.sku", revenue: { $sum: { $multiply: ["$lines.qty", "$lines.price"] } } } },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
])
```

`$match`'i olabildiğince başa koyun, indeksi ancak orada kullanabilir. `$lookup` (join) vardır ama sık kullanılıyorsa model gözden geçirilmelidir.

### Ölçekleme

- **Replica set:** bir birincil, birden fazla ikincil düğüm. Birincil düşerse seçimle yenisi belirlenir. Yazma onayı (`writeConcern: majority`) ve okuma tercihi (`readPreference`) tutarlılık ile gecikme arasındaki dengeyi ayarlar.
- **Sharding:** veri **shard key**'e göre düğümlere bölünür. Shard key seçimi en kritik karardır: yükü eşit dağıtmalı ve sık sorgularda bulunmalıdır. Monoton artan bir anahtar (zaman damgası) bütün yazmaları tek bir shard'a yığar. Cosmos DB'deki partition key ile aynı problem.

## Elasticsearch

Elasticsearch, Apache Lucene üzerine kurulu dağıtık bir **arama ve analiz motorudur**. Birincil veritabanı olarak değil, aranabilir bir **kopya** olarak kullanılır. Gerçek veri SQL Server, PostgreSQL ya da MongoDB'de kalır. (OpenSearch, Elasticsearch'ün lisans değişikliği sonrası AWS öncülüğünde ayrılan açık kaynak çatalıdır. Kavramlar aynıdır.)

### Ters indeks

```text
Belge 1: "Kablosuz mekanik klavye"
Belge 2: "Kablolu oyuncu faresi"
Belge 3: "Mekanik oyuncu klavyesi"

Terim      → Belgeler
kablosuz   → [1]
mekanik    → [1, 3]
klavye     → [1, 3]   (analyzer "klavyesi"ni köküne indirdiyse)
oyuncu     → [2, 3]
```

"mekanik klavye" araması iki terimin listesini birleştirir ve belgeleri **alaka skoruna** (BM25: terim belgede ne sık geçiyor, bütün belgelerde ne kadar nadir, belge ne kadar kısa) göre sıralar. SQL'deki `LIKE '%klavye%'` her satırı taramak zorundadır ve alaka sıralaması yapamaz.

### Mapping: text ve keyword

```json
PUT /products
{
  "settings": { "analysis": { "analyzer": { "tr": { "type": "turkish" } } } },
  "mappings": {
    "properties": {
      "name":     { "type": "text", "analyzer": "tr",
                    "fields": { "raw": { "type": "keyword" } } },
      "brand":    { "type": "keyword" },
      "price":    { "type": "scaled_float", "scaling_factor": 100 },
      "category": { "type": "keyword" },
      "createdAt":{ "type": "date" }
    }
  }
}
```

| | `text` | `keyword` |
| --- | --- | --- |
| İşlenme | Analyzer'dan geçer: küçük harfe çevrilir, terimlere bölünür, köke indirilir | Olduğu gibi tek bir terim |
| Kullanım | Tam metin arama | Tam eşleşme, filtre, sıralama, toplama (facet) |
| Örnek | Ürün adı, açıklama | Marka, kategori, durum, SKU |

Aynı alan her ikisi olarak da indekslenebilir (`name` ve `name.raw`). Dinamik mapping'e güvenmek yerine mapping'i açıkça tanımlayın. Türkçe için `turkish` analyzer ya da ICU eklentisi "İ/ı" ve kök bulma sorunlarını çözer.

### Sorgular

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must":   [ { "multi_match": { "query": "mekanik klavye", "fields": ["name^3", "description"] } } ],
      "filter": [ { "term": { "category": "klavye" } },
                  { "range": { "price": { "lte": 2000 } } } ]
    }
  },
  "aggs": { "brands": { "terms": { "field": "brand" } } },
  "sort": [ "_score", { "createdAt": "desc" } ]
}
```

- **`match`** analiz edilmiş tam metin araması yapar. **`term`** analiz edilmemiş tam eşleşme yapar. `text` alanda `term` kullanmak sık yapılan bir hatadır ("Klavye" terimi indekste "klavye" olarak durur ve bulunmaz).
- **`must`** skora katkı verir. **`filter`** yalnızca eler, skor hesaplamaz ve önbelleğe alınır. Evet/hayır koşulları `filter`'a koyun.
- **`aggs`** facet sayılarını üretir: "Marka: Logitech (42), Razer (17)".
- `name^3` alanı skorlamada üç kat ağırlıklandırır.

.NET'te resmi istemci `Elastic.Clients.Elasticsearch`'tür (eski NEST istemcisinin yerini aldı).

### Mimari özellikler

- **Shard ve replica:** indeks birincil shard'lara bölünür, her shard'ın kopyaları olur. Birincil shard sayısı sonradan değiştirilemez (yeniden indeksleme gerekir).
- **Neredeyse gerçek zamanlı:** yazılan belge varsayılan olarak yaklaşık 1 saniye sonra (refresh) aramada görünür. "Kaydettim ama aramada çıkmadı" şikâyetinin sebebi budur.
- **Derin sayfalama pahalıdır:** `from: 10000` her shard'dan on bin sonucu toplamayı gerektirir. Derin gezinme için `search_after` kullanılır.
- **Yeniden indeksleme:** mapping değişikliği çoğu zaman yeni indeks gerektirir. **Alias** kullanarak (uygulama `products` alias'ına yazar ve okur, alias arkada `products_v2`'yi gösterir) kesintisiz geçiş yapılır.

## SQL'den arama motoruna senkronizasyon

Elasticsearch kopyası nasıl güncel tutulur?

| Yöntem | Artısı | Eksisi |
| --- | --- | --- |
| Uygulama iki yere yazar (dual write) | Basit | Biri başarısız olursa tutarsızlık. **Kaçının** |
| Outbox + mesaj kuyruğu + indeksleyici | Güvenilir, yeniden denenebilir | Ek bileşenler |
| CDC (Debezium, SQL Server CDC) | Uygulama koduna dokunmaz | Altyapı karmaşıklığı |
| Periyodik toplu yeniden indeksleme | Çok basit | Gecikme |

Yaygın yapı: ürün güncellenir, aynı transaction'da outbox'a `ProductChanged` yazılır, kuyruğa iletilir ve indeksleyici servis ürünü veritabanından okuyup Elasticsearch'e yazar. Sıralama sorunlarına karşı belgeye bir **sürüm numarası** konur ve eski sürüm yenisinin üzerine yazılmaz (`version_type: external`).

## Mülakatta sorulur

- **"Ne zaman MongoDB, ne zaman PostgreSQL?"** Erişim desenine bakarım. İlişkili veri, esnek sorgu ve transaction'lar için PostgreSQL. Belge biçiminde okunan, şeması değişken ve yatay ölçeklenmesi gereken veri için MongoDB. Çoğu zaman `jsonb` ile PostgreSQL yeterlidir.
- **"Gömme mi referans mı?"** Birlikte okunan ve sınırlı büyüyen veriyi gömerim. Bağımsız okunan ya da sınırsız büyüyeni referansla tutarım.
- **"Elasticsearch neden `LIKE`'tan hızlı?"** Ters indeks terimden belgeye doğrudan gider. `LIKE '%x%'` her satırı tarar. Elasticsearch ayrıca alaka sıralaması yapar.
- **"`text` ile `keyword` farkı?"** `text` analiz edilir ve tam metin aramada kullanılır. `keyword` olduğu gibi saklanır ve filtre, sıralama ve toplamada kullanılır.
- **"Elasticsearch'ü birincil veritabanı olarak kullanır mısın?"** Hayır. Transaction'ı yoktur, refresh gecikmesi vardır. Kaynak veritabanından senkronize edilen bir kopya olarak kullanırım.
- **"Veritabanı ve Elasticsearch'ü nasıl tutarlı tutarsın?"** Outbox ve kuyruk ya da CDC ile. Dual write yapmam. Sürüm numarasıyla eski güncellemeleri reddederim.

## Özet

- NoSQL, belirli bir erişim desenini ölçeklemek için esneklikten vazgeçer. Çoğu iş verisi için ilişkisel veritabanı hâlâ doğru varsayılandır.
- MongoDB'de veri okunacağı biçimde modellenir. Birlikte okunan ve sınırlı büyüyen veri gömülür. Bilinçli tekrar normaldir.
- Shard ve partition anahtarı yükü dağıtmalı ve sorgularla uyumlu olmalıdır.
- Elasticsearch ters indeks ve alaka skoruyla arama yapar. `text` aranır, `keyword` filtrelenir. Evet/hayır koşulları `filter`'a gider.
- Arama indeksi bir kopyadır. Outbox ya da CDC ile güncel tutulur, alias'larla yeniden indekslenir.
