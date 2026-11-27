---
title: NoSQL and Search (MongoDB and Elasticsearch)
summary: Types of NoSQL and when to choose them, document modeling in MongoDB, embedding vs. referencing, indexes and the aggregation pipeline, the .NET driver, the inverted index in Elasticsearch, mappings, text vs. keyword, analyzers, query types, relevance scoring and syncing from SQL.
---

Job postings in Turkey frequently mention Elasticsearch (İhlas, Sürat Kargo, Trendyol) and MongoDB (İhlas, Trendyol, a plus at Sürat Kargo). Microsoft postings say Cosmos DB. In the System Design track we covered choosing a database and the idea of an inverted index as concepts. This lesson covers how to model these two products, how to query them, and how to use them from .NET.

## Types of NoSQL

| Type | Example | Where it shines |
| --- | --- | --- |
| **Document** | MongoDB, Cosmos DB, Couchbase | Flexible schema, nested data, natural mapping to objects |
| **Key–value** | Redis, DynamoDB | Very fast reads and writes by key |
| **Wide-column** | Cassandra, ScyllaDB | Very high write volume, time series |
| **Graph** | Neo4j | Very deep relationships (social networks, recommendations) |
| **Search engine** | Elasticsearch, OpenSearch | Full-text search, filtering and aggregations (facets), log analysis |

The answer to "NoSQL or SQL?" lies in the access pattern. A relational database offers flexible queries, strong consistency and transactions. It is still the right default for most business applications. NoSQL gives up **some of that flexibility** to scale a particular access pattern better (reads by key, very high write volume, full-text search). PostgreSQL's `jsonb` support covers many cases that need document flexibility without a separate database.

## MongoDB

Data is stored as **documents** (BSON, binary JSON) in **collections**. The documents in a collection don't have to share the same schema, but in practice the application enforces one (and MongoDB supports schema validation).

```json
{
  "_id": "ord_8412",
  "customerId": "cus_7",
  "status": "Paid",
  "createdAt": { "$date": "2026-11-24T10:00:00Z" },
  "shippingAddress": { "city": "Istanbul", "district": "Kadikoy" },
  "lines": [
    { "sku": "SKU-1", "name": "Keyboard", "qty": 1, "price": 1499.90 },
    { "sku": "SKU-9", "name": "Mouse", "qty": 2, "price": 349.90 }
  ]
}
```

### Modeling: embed or reference?

In relational modeling you normalize the data first and write the queries afterward. In document modeling you think about **the access pattern first** and store the data in the shape in which it will be read.

| Embed | Reference |
| --- | --- |
| Data that is read together and changes together | Data that is read independently or shared by many documents |
| "One-to-few" relationships: an order and its lines, a user and their addresses | "One-to-many" or "many-to-many": a customer and all their orders, a product and its reviews |
| All data in a single read, atomic updates | Document size stays under control |

Rules:

- **Don't embed arrays that grow without bound.** Embedding all of a product's reviews in the product document pushes the document toward the 16 MB limit and into performance problems.
- **Deliberate duplication (denormalization) is normal.** The product name in an order line is the name at the time of the order. When the product name changes, the old order must not change. Here duplication is not a mistake; it is the correct model.
- **Operations on a single document are atomic.** Transactions spanning multiple documents are supported, but if you need them often, the model may be a better fit for a relational database.

### Queries and indexes

```csharp
var client = new MongoClient(connectionString);   // singleton: manages the connection pool
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

The indexing rules are the same as in relational databases: column order matters in a compound index (equality, sort, range: the **ESR rule**), and a query without an index does a collection scan (`COLLSCAN`). You inspect the plan with `explain()`.

### Aggregation pipeline

Documents are transformed by passing through stages. The equivalents of SQL's `WHERE`, `GROUP BY` and `JOIN`:

```js
db.orders.aggregate([
  { $match: { status: "Paid", createdAt: { $gte: ISODate("2026-11-01") } } },  // WHERE
  { $unwind: "$lines" },                                                         // expand the array into rows
  { $group: { _id: "$lines.sku", revenue: { $sum: { $multiply: ["$lines.qty", "$lines.price"] } } } },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
])
```

Put `$match` as early as possible; that is the only place it can use an index. `$lookup` (a join) exists, but if you use it often, revisit the model.

### Scaling

- **Replica set:** one primary and several secondary nodes. If the primary goes down, a new one is chosen by election. The write concern (`writeConcern: majority`) and read preference (`readPreference`) tune the balance between consistency and latency.
- **Sharding:** data is split across nodes by the **shard key**. Choosing the shard key is the most critical decision: it must spread the load evenly and appear in frequent queries. A monotonically increasing key (a timestamp) piles all writes onto a single shard. It is the same problem as the partition key in Cosmos DB.

## Elasticsearch

Elasticsearch is a distributed **search and analytics engine** built on Apache Lucene. It is used not as the primary database but as a searchable **copy**. The real data stays in SQL Server, PostgreSQL or MongoDB. (OpenSearch is the open-source fork, led by AWS, that split off after Elasticsearch's license change. The concepts are the same.)

### Inverted index

```text
Document 1: "Wireless mechanical keyboard"
Document 2: "Wired gaming mouse"
Document 3: "Mechanical gaming keyboards"

Term        → Documents
wireless    → [1]
mechanical  → [1, 3]
keyboard    → [1, 3]   (if the analyzer reduced "keyboards" to its stem)
gaming      → [2, 3]
```

A search for "mechanical keyboard" merges the lists of the two terms and ranks the documents by **relevance score** (BM25: how often the term appears in the document, how rare it is across all documents, how short the document is). SQL's `LIKE '%keyboard%'` has to scan every row and can't rank by relevance.

### Mapping: text and keyword

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
| Processing | Goes through an analyzer: lowercased, split into terms, stemmed | Stored as-is, as a single term |
| Use | Full-text search | Exact match, filters, sorting, aggregations (facets) |
| Example | Product name, description | Brand, category, status, SKU |

The same field can be indexed as both (`name` and `name.raw`). Define the mapping explicitly instead of relying on dynamic mapping. For Turkish text, the `turkish` analyzer (used above) or the ICU plugin solves the "İ/ı" and stemming problems.

### Queries

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must":   [ { "multi_match": { "query": "mechanical keyboard", "fields": ["name^3", "description"] } } ],
      "filter": [ { "term": { "category": "keyboard" } },
                  { "range": { "price": { "lte": 2000 } } } ]
    }
  },
  "aggs": { "brands": { "terms": { "field": "brand" } } },
  "sort": [ "_score", { "createdAt": "desc" } ]
}
```

- **`match`** performs an analyzed full-text search. **`term`** performs an exact match without analysis. Using `term` on a `text` field is a common mistake (the term "Keyboard" is stored in the index as "keyboard" and isn't found).
- **`must`** contributes to the score. **`filter`** only filters, doesn't compute a score, and is cached. Put yes/no conditions in `filter`.
- **`aggs`** produces facet counts: "Brand: Logitech (42), Razer (17)".
- `name^3` weights the field three times as much in scoring.

In .NET, the official client is `Elastic.Clients.Elasticsearch` (it replaced the old NEST client).

### Architectural characteristics

- **Shards and replicas:** an index is split into primary shards, and each shard has replicas. The number of primary shards can't be changed later (that requires reindexing).
- **Near real-time:** by default, a written document becomes visible in search after about 1 second (refresh). This is the cause of the "I saved it but it didn't show up in search" complaint.
- **Deep pagination is expensive:** `from: 10000` requires collecting ten thousand results from every shard. Use `search_after` for deep paging.
- **Reindexing:** a mapping change often requires a new index. With an **alias** (the application reads and writes through the `products` alias, which points to `products_v2` behind the scenes), you can switch over without downtime.

## Syncing from SQL to a search engine

How do you keep the Elasticsearch copy up to date?

| Method | Pros | Cons |
| --- | --- | --- |
| The application writes to both places (dual write) | Simple | Inconsistency if one fails. **Avoid it** |
| Outbox + message queue + indexer | Reliable, retryable | Extra components |
| CDC (Debezium, SQL Server CDC) | Doesn't touch application code | Infrastructure complexity |
| Periodic bulk reindexing | Very simple | Delay |

A common setup: a product is updated, a `ProductChanged` record is written to the outbox in the same transaction, it is forwarded to the queue, and an indexer service reads the product from the database and writes it to Elasticsearch. To guard against ordering problems, the document carries a **version number**, and an older version doesn't overwrite a newer one (`version_type: external`).

## Asked in interviews

- **"When MongoDB, when PostgreSQL?"** I look at the access pattern. PostgreSQL for related data, flexible queries and transactions. MongoDB for data that is read as documents, has a variable schema and needs to scale horizontally. Often PostgreSQL with `jsonb` is enough.
- **"Embed or reference?"** I embed data that is read together and grows within limits. I keep data that is read independently or grows without bound as a reference.
- **"Why is Elasticsearch faster than `LIKE`?"** The inverted index goes directly from term to documents. `LIKE '%x%'` scans every row. Elasticsearch also ranks by relevance.
- **"What's the difference between `text` and `keyword`?"** `text` is analyzed and used in full-text search. `keyword` is stored as-is and used for filtering, sorting and aggregations.
- **"Would you use Elasticsearch as your primary database?"** No. It has no transactions and has a refresh delay. I use it as a copy synced from the source database.
- **"How do you keep the database and Elasticsearch consistent?"** With an outbox and a queue, or with CDC. I don't do dual writes. I reject stale updates with a version number.

## Summary

- NoSQL gives up flexibility to scale a specific access pattern. For most business data, a relational database is still the right default.
- In MongoDB, data is modeled in the shape in which it is read. Data that is read together and grows within limits is embedded. Deliberate duplication is normal.
- Shard and partition keys must spread the load and match the queries.
- Elasticsearch searches with an inverted index and relevance scores. `text` is searched, `keyword` is filtered. Yes/no conditions go in `filter`.
- The search index is a copy. It is kept up to date with an outbox or CDC, and reindexed with aliases.
