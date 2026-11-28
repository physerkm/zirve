---
title: Domain-Driven Design
summary: Ubiquitous language, bounded contexts and context maps, entities and value objects, aggregates and consistency boundaries, domain events, the anemic model problem, and implementing DDD with EF Core.
---

DDD shows up often in logistics and e-commerce job postings in Turkey (Sürat Kargo, Logvance) and in fintech and SaaS postings in Europe. The approach, which originated with Eric Evans's 2003 book, is not a library or a folder structure. It is a method for carrying a complex business domain into software correctly.

DDD has two sides:

- **Strategic design:** where do you split the system, and how do teams and models relate to each other? (bounded contexts, context maps)
- **Tactical design:** how do you write the code inside a model? (entities, value objects, aggregates, domain events)

Most teams only apply the tactical patterns and miss the real value, which is strategic design.

## Ubiquitous language

Developers and domain experts use **the same words** for the same concepts. Those words also become class and method names in the code.

If the domain expert says "When the shipment leaves the warehouse, the customer gets a notification", the code has `shipment.Dispatch()` and a `ShipmentDispatched` event. It does not have `ShipmentManager.UpdateStatus(2)`. A domain expert reading the code should be able to understand what is going on.

## Bounded context

The same word means different things in different parts of the business. At an e-commerce company, **"Product"** means:

- In **Catalog**: name, description, images, category.
- In **Inventory**: warehouse location, quantity, reservations.
- In **Pricing**: list price, promotions, tax.
- In **Shipping**: weight, dimensions, hazardous materials information.

Putting all of this into one giant `Product` class leads to a model that everyone changes and no one fully understands. DDD's solution: each subdomain has **its own model** and **an explicit boundary**. That boundary is called a *bounded context*. Inside the boundary, each term has exactly one meaning.

Bounded contexts usually line up with team boundaries and often (though not necessarily) with service or module boundaries. This is the most reliable way to determine microservice boundaries.

### Context map

The relationships between contexts are given names:

| Relationship | Meaning |
| --- | --- |
| **Customer–Supplier** | The downstream (customer) depends on the upstream (supplier) API and communicates its needs |
| **Conformist** | The downstream accepts the upstream model as is (e.g. an external payment provider) |
| **Anti-Corruption Layer (ACL)** | The downstream writes a layer that translates the foreign model into its own language. Critical when integrating with legacy systems and external services |
| **Shared Kernel** | Two contexts share a small common model. Use with care |
| **Open Host Service / Published Language** | The upstream publishes a well-documented API and schema for everyone to use |

## Tactical building blocks

### Entity

An object that has an **identity** and changes over its lifetime. Two orders with the same amount and the same date are still different if their identities differ.

### Value object

An object with no identity, defined by its **values**, and immutable. `Money`, `Address`, `EmailAddress`, `DateRange`.

```csharp
public sealed record Money
{
    public decimal Amount { get; private init; }   // EF Core doesn't map properties without a setter
    public string Currency { get; private init; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentOutOfRangeException(nameof(amount));
        if (currency.Length != 3) throw new ArgumentException("An ISO 4217 code is expected", nameof(currency));
        (Amount, Currency) = (amount, currency.ToUpperInvariant());
    }

    public static Money Zero(string currency) => new(0, currency);

    public Money Add(Money other) => other.Currency == Currency
        ? new Money(Amount + other.Amount, Currency)
        : throw new InvalidOperationException("Different currencies cannot be added");
}
```

Value objects prevent **primitive obsession**: `Money price` instead of `decimal price, string currency`. Rule validation happens in one place, and an invalid `Money` can never be created. C# `record` types provide value equality out of the box, which makes them a natural choice for value objects.

### Aggregate

A cluster of objects that must be kept consistent together. From the outside, it is accessed only through its **aggregate root**.

```csharp
public sealed class Order   // aggregate root
{
    private readonly List<OrderLine> _lines = [];
    private readonly List<IDomainEvent> _events = [];

    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }     // reference another aggregate only by identity
    public OrderStatus Status { get; private set; }
    public IReadOnlyList<OrderLine> Lines => _lines;
    public IReadOnlyList<IDomainEvent> DomainEvents => _events;

    public Money Total => _lines.Aggregate(Money.Zero("TRY"), (sum, l) => sum.Add(l.Subtotal));

    public void AddLine(Guid productId, Money unitPrice, int quantity)
    {
        if (Status != OrderStatus.Draft)
            throw new DomainException("Products can only be added to a draft order");
        if (_lines.Count >= 50)
            throw new DomainException("An order can contain at most 50 lines");

        _lines.Add(new OrderLine(productId, unitPrice, quantity));
    }

    public void Submit()
    {
        if (_lines.Count == 0) throw new DomainException("An empty order cannot be submitted");
        Status = OrderStatus.Submitted;
        _events.Add(new OrderSubmitted(Id, CustomerId, Total));
    }
}
```

Aggregate rules:

1. **Invariants are protected inside the aggregate.** `Order` protects the rule "an order can contain at most 50 lines". Nobody can bypass the rule with `order.Lines.Add(...)`, because the collection is exposed as read-only.
2. **One transaction changes one aggregate.** If several aggregates have to change at once, this is usually done with domain events and eventual consistency.
3. **Aggregates reference each other by identity**, not by object reference. `Order` holds `CustomerId`, not the `Customer` object.
4. **Keep them small.** Large aggregates lead to lock contention and performance problems. "A customer and all their orders" should not be a single aggregate.

### Domain event

An immutable message in the past tense that says something important **has happened** in the business domain: `OrderSubmitted`, `PaymentFailed`, `ShipmentDelivered`.

Uses:

- **Separating side effects within the same service:** when an order is submitted, stock reservation should start. `Order` doesn't know about the inventory service; it only raises an event.
- **Integration between services:** the event is published to a message queue through an outbox (*integration event*). Keeping domain events and integration events separate is good practice. A domain event carries the language of the internal model; an integration event carries the published contract.

Events are usually collected by an EF Core interceptor during `SaveChanges` and dispatched after the transaction succeeds.

### Repository and domain service

- There is one **repository** per aggregate, and it loads and saves the aggregate as a whole. There is no separate repository for `OrderLine`.
- A **domain service** holds a business rule that doesn't naturally belong to a single entity (e.g. the rules for a transfer between two accounts). It is stateless.

## The anemic model

```csharp
// Anemic: a bag of data
public class Order { public OrderStatus Status { get; set; } public List<OrderLine> Lines { get; set; } = []; }

// Business rules scattered across services
if (order.Status == OrderStatus.Draft && order.Lines.Count < 50) order.Lines.Add(line);
```

Entities whose properties all have `public set` and that contain no business rules are called an **anemic model**. The rules get scattered across services, duplicated and bypassed. Martin Fowler describes this as an anti-pattern. But to be honest: in CRUD-heavy applications with few business rules, an anemic model plus services is perfectly acceptable. A rich domain model pays off where the rules are genuinely complex.

## DDD with EF Core

EF Core supports rich models well:

```csharp
public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.OwnsMany(o => o.Lines, line =>
        {
            line.WithOwner().HasForeignKey("OrderId");
            line.OwnsOne(l => l.UnitPrice);                             // Money: Amount and Currency columns in the same table
        });
        builder.Navigation(o => o.Lines).UsePropertyAccessMode(PropertyAccessMode.Field);   // write through the _lines field
        builder.Ignore(o => o.Total);
        builder.Ignore(o => o.DomainEvents);
    }
}
```

- **Private fields and setters:** EF Core can write to `private set` properties and to fields. A private parameterless constructor is enough.
- **Owned types / complex types:** map value objects to columns in the same row, without a separate table. Complex types, introduced in EF Core 8, are closer to value semantics.
- **Strongly typed IDs:** with types like `OrderId(Guid Value)`, accidentally passing an order's ID where a customer ID is expected is caught at compile time. In EF Core they are mapped with a value converter.

## When is DDD not worth it?

- Applications with few business rules that mostly do data entry and reporting.
- Teams with no access to domain experts (no ubiquitous language can be built).
- Short-lived prototypes.

DDD is expensive. It pays for itself where the complexity lies in the business domain itself (insurance, logistics, payments, reservations).

## Asked in interviews

- **"What is the difference between an entity and a value object?"** An entity is defined by its identity, a value object by its values. A value object is immutable.
- **"What is an aggregate, and how do you draw its boundary?"** Objects that must stay consistent together. The invariants determine the boundary. I keep it as small as possible.
- **"I need to update two aggregates in the same transaction."** First I ask whether they really need to be consistent at the same moment. Usually eventual consistency through a domain event is enough.
- **"Is a bounded context the same as a microservice?"** No. A bounded context is a model boundary. A microservice is a unit of deployment. Good microservice boundaries often follow bounded contexts, but a modular monolith has bounded contexts too.
- **"Is the anemic model always bad?"** No. In applications with few rules it is simple and sufficient.

## Summary

- Most of DDD's value lies in strategic design: the ubiquitous language and bounded contexts.
- Relationships between contexts are given names. An anti-corruption layer is used against external and legacy systems.
- An entity is defined by identity, a value object by value. Value objects prevent primitive obsession.
- An aggregate is a consistency boundary: accessed through its root, kept small, and referencing others by identity.
- Domain events separate side effects and are the foundation of integration between services.
- DDD pays for itself in complex business domains. It is overkill for simple CRUD.
