---
title: SQL Sorguları ve Join'ler
summary: Sorgunun mantıksal yürütme sırası, join türleri, NULL'ın üç değerli mantığı, gruplama ve pencere fonksiyonları. Mülakatlarda sorulan klasik SQL kalıpları.
minutes: 18
level: beginner
---

Backend mülakatlarında SQL çoğu zaman ayrı bir tur değildir; kodlama ya da sistem tasarımı turunun içinde "bunu tek sorguyla nasıl alırsın?" diye gelir. Beklenen şey ezberlenmiş sözdizimi değil, sorgunun **satırlar üzerinde ne yaptığını** adım adım anlatabilmektir.

Bu dersteki örnekler PostgreSQL ile yazılmıştır ve şu tabloları kullanır:

```sql
CREATE TABLE customers (
    id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  text NOT NULL,
    city  text
);

CREATE TABLE orders (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES customers (id),
    total       numeric(12, 2) NOT NULL,
    status      text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
```

## Sorgu hangi sırayla çalışır

SQL'i yazdığımız sıra ile veritabanının onu **mantıksal olarak** değerlendirdiği sıra farklıdır:

| Sıra | Yan tümce | Ne yapar |
| --- | --- | --- |
| 1 | `FROM`, `JOIN` | Kaynak satırları oluşturur |
| 2 | `WHERE` | Tek tek satırları süzer |
| 3 | `GROUP BY` | Satırları gruplara toplar |
| 4 | `HAVING` | Grupları süzer |
| 5 | `SELECT` | Sütunları ve ifadeleri hesaplar |
| 6 | `DISTINCT` | Yinelenenleri atar |
| 7 | `ORDER BY` | Sıralar |
| 8 | `LIMIT` / `OFFSET` | Sonucu keser |

Bu tablo pek çok "neden çalışmıyor?" sorusunu yanıtlar:

- `WHERE` içinde `SELECT`'te verilen takma adı kullanamazsınız; o ad henüz hesaplanmamıştır. `ORDER BY` içinde kullanabilirsiniz.
- `WHERE` içinde `COUNT(*)` gibi bir toplama fonksiyonu kullanamazsınız; gruplar henüz oluşmamıştır. Grup üzerindeki koşul `HAVING`'e yazılır.
- `LIMIT` en sonda uygulanır; sıralama belirtilmezse "ilk 10 satır" tanımsızdır.

Planlayıcı gerçekte işlemleri farklı sırada da yapabilir (ör. bir koşulu join'den önceye taşıyabilir); ama sonuç her zaman bu mantıksal sıraya göre tanımlanır.

## Join türleri

| Join | Sonuç |
| --- | --- |
| `INNER JOIN` | Yalnızca iki tarafta da eşleşen satırlar |
| `LEFT JOIN` | Soldaki bütün satırlar; sağda eşi yoksa sağ sütunlar `NULL` |
| `RIGHT JOIN` | `LEFT JOIN`'in aynası; pratikte tabloların yeri değiştirilip `LEFT` yazılır |
| `FULL JOIN` | İki taraftaki bütün satırlar; eşi olmayan taraf `NULL` |
| `CROSS JOIN` | Kartezyen çarpım: her sol satır × her sağ satır |

Bir tabloyu kendisiyle birleştirmek (**self join**) de sık sorulur: "Yöneticisinden fazla kazanan çalışanlar" gibi.

```sql
SELECT e.name
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;
```

### Hiç siparişi olmayan müşteriler

Klasik "eşi olmayanı bul" sorusu. İki doğru yanıt vardır:

```sql
-- 1) LEFT JOIN + IS NULL (anti-join)
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- 2) NOT EXISTS
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

PostgreSQL bu iki biçimi de genellikle aynı verimli "anti join" planıyla çalıştırır. `NOT EXISTS` niyeti daha açık anlatır.

### En sık yapılan join hatası

`LEFT JOIN` yazıp sağ tabloya ait koşulu `WHERE`'e koymak, join'i sessizce `INNER JOIN`'e çevirir:

```sql
-- Amaç: bütün müşteriler ve (varsa) teslim edilmiş siparişleri
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'delivered';     -- YANLIŞ: siparişi olmayanlar elendi
```

Eşi olmayan müşterilerde `o.status` `NULL`'dır; `NULL = 'delivered'` doğru olmadığı için bu satırlar düşer. Doğrusu koşulu `ON`'a taşımaktır:

```sql
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'delivered'
```

Kural: **sağ tabloyu süzen koşul `ON`'a, sonucu süzen koşul `WHERE`'e.**

### Join satır çoğaltır

Bire-çok ilişkide join, "bir" tarafındaki satırı eşleşme sayısı kadar tekrarlar. İki ayrı çok taraflı tabloyu aynı sorguda birleştirip toplarsanız sonuç şişer:

```sql
-- Her müşterinin sipariş toplamı ve destek talebi sayısı: YANLIŞ
SELECT c.id, SUM(o.total), COUNT(t.id)
FROM customers c
LEFT JOIN orders o  ON o.customer_id = c.id
LEFT JOIN tickets t ON t.customer_id = c.id
GROUP BY c.id;
```

3 siparişi ve 2 talebi olan müşteri 3 × 2 = 6 satır üretir: toplam iki katına, talep sayısı üç katına çıkar. Çözüm, her çok taraflı tabloyu önce **ayrı ayrı** toplayıp sonra birleştirmektir (alt sorgu ya da CTE ile).

## NULL ve üç değerli mantık

`NULL` "bilinmiyor" demektir; bir değer değildir. Karşılaştırmaların sonucu `TRUE`, `FALSE` ya da `UNKNOWN` olabilir ve `WHERE` yalnızca `TRUE` olan satırları geçirir.

| İfade | Sonuç |
| --- | --- |
| `NULL = NULL` | `UNKNOWN` (doğru değil!) |
| `NULL <> 1` | `UNKNOWN` |
| `x IS NULL` | `TRUE` ya da `FALSE` |
| `NULL IS NOT DISTINCT FROM NULL` | `TRUE` |
| `TRUE OR NULL` | `TRUE` |
| `FALSE AND NULL` | `FALSE` |

Mülakatlarda en çok yakalanan tuzak `NOT IN`'dir:

```sql
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM legacy_orders);
```

Alt sorgu tek bir `NULL` bile döndürürse bu sorgu **hiç satır döndürmez**. `id NOT IN (1, NULL)` ifadesi `id <> 1 AND id <> NULL` demektir; ikinci kısım her zaman `UNKNOWN` olduğundan bütün koşul hiçbir zaman `TRUE` olmaz. `NOT EXISTS` bu sorundan etkilenmez; varsayılan olarak onu kullanın.

Toplama fonksiyonları da `NULL`'ları atlar:

- `COUNT(*)` satırları sayar; `COUNT(city)` yalnızca `city` değeri `NULL` olmayan satırları sayar.
- `AVG(score)` `NULL` puanları paydaya katmaz; `NULL`'ı sıfır saymak istiyorsanız `AVG(COALESCE(score, 0))` yazın.
- Boş bir küme üzerinde `SUM` sıfır değil `NULL` döndürür.

## Gruplama

```sql
-- 2025'te 5'ten fazla sipariş veren şehirler, en çoktan aza
SELECT c.city, COUNT(*) AS order_count, SUM(o.total) AS revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at >= '2025-01-01' AND o.created_at < '2026-01-01'
GROUP BY c.city
HAVING COUNT(*) > 5
ORDER BY order_count DESC;
```

- `WHERE` gruplamadan **önce** satırları eler; ucuzdur ve indeks kullanabilir. Bir koşul satır düzeyindeyse `HAVING`'e değil `WHERE`'e yazın.
- `SELECT` listesindeki toplanmamış her sütun `GROUP BY`'da olmalıdır. (PostgreSQL, birincil anahtara göre gruplandığında aynı tablonun diğer sütunlarına izin verir; çünkü onlar anahtar tarafından belirlenir.)
- Tarih aralığını `created_at >= başlangıç AND created_at < bitiş` biçiminde yazın; sütunu `EXTRACT(YEAR FROM created_at) = 2025` gibi bir fonksiyona sokmak indeks kullanımını engeller.

### Yinelenen kayıtları bulma

```sql
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

## Alt sorgular ve CTE

`WITH` ile tanımlanan ortak tablo ifadeleri (CTE) uzun sorguları adım adım okunur hale getirir:

```sql
WITH customer_totals AS (
    SELECT customer_id, SUM(total) AS spent
    FROM orders
    GROUP BY customer_id
)
SELECT c.name, t.spent
FROM customer_totals t
JOIN customers c ON c.id = t.customer_id
WHERE t.spent > 10000;
```

PostgreSQL 12'den bu yana yalnızca bir kez kullanılan CTE'ler ana sorguya katlanır; yani CTE yazmak artık performans bedeli getirmez. `WITH RECURSIVE` ise ağaç ve hiyerarşi sorguları (kategori ağacı, yönetim zinciri) için kullanılır.

## Pencere fonksiyonları

Pencere fonksiyonu, `GROUP BY` gibi satırları tek satıra **indirgemeden** bir satır grubu üzerinde hesap yapar. Her satır yerinde kalır, yanına bir değer eklenir.

```sql
SELECT
    customer_id,
    created_at,
    total,
    SUM(total) OVER (PARTITION BY customer_id ORDER BY created_at) AS running_total,
    LAG(total) OVER (PARTITION BY customer_id ORDER BY created_at)  AS previous_total
FROM orders;
```

- `PARTITION BY`: grupları belirler (her müşteri ayrı hesaplanır).
- `ORDER BY`: grup içindeki sırayı belirler; birikimli toplam, `LAG`/`LEAD` gibi fonksiyonlar buna göre çalışır.

Sıralama fonksiyonlarının farkı eşitliklerde ortaya çıkar. Maaşlar 100, 100, 90 ise:

| Fonksiyon | Sonuç | Kural |
| --- | --- | --- |
| `ROW_NUMBER()` | 1, 2, 3 | Her satıra benzersiz numara; eşitlerde sıra keyfî |
| `RANK()` | 1, 1, 3 | Eşitler aynı sırayı alır, sonrasında boşluk kalır |
| `DENSE_RANK()` | 1, 1, 2 | Eşitler aynı sırayı alır, boşluk kalmaz |

### Grup başına ilk N

"Her departmanda en çok kazanan 3 kişi" pencere fonksiyonlarının en klasik kullanımıdır:

```sql
SELECT department_id, name, salary
FROM (
    SELECT department_id, name, salary,
           DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk <= 3;
```

Pencere fonksiyonları `WHERE`'den sonra hesaplandığı için `WHERE rnk <= 3` aynı seviyede yazılamaz; alt sorgu bu yüzden gerekir.

"İkinci en yüksek maaş" sorusu da aynı kalıptır: `DENSE_RANK` ile sıralayıp `rnk = 2` olanı seçin. Eşit maaşları doğru ele almak için `ROW_NUMBER` değil `DENSE_RANK` kullanılır; ikinci en yüksek maaş yoksa sorgu boş sonuç döndürür ve bunu mülakatta belirtmek iyi bir izlenim bırakır.

## Mülakatta SQL yazarken

1. Tabloları ve ilişkileri yüksek sesle doğrulayın: "Bir müşterinin birden çok siparişi olabilir, değil mi?"
2. Join'lerin satır sayısını nasıl değiştireceğini düşünün; bire-çok ilişkide toplamların şişmesine dikkat edin.
3. `NULL` olabilecek sütunları ve boş grupları ayrıca ele alın.
4. Eşitlik durumunda ne olacağını sorun (aynı maaşa sahip iki kişi, aynı tarihli iki sipariş).

## Özet

- Mantıksal sıra: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`.
- `LEFT JOIN`'de sağ tabloya ait koşul `ON`'a yazılır; aksi halde join `INNER`'a döner.
- `NULL` karşılaştırmaları `UNKNOWN` üretir; `NOT IN` yerine `NOT EXISTS` kullanın.
- Bire-çok join'ler satır çoğaltır; birden fazla çok taraflı tabloyu birleştirmeden önce ayrı ayrı toplayın.
- Pencere fonksiyonları satırları silmeden grup üzerinde hesap yapar; "grup başına ilk N" ve "N. en büyük" sorularının anahtarıdır.
