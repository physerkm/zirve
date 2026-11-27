---
title: SOLID Principles
summary: A violation and a fix for each of the five principles, the problem each principle solves, composition over inheritance, and when the principles go too far. The common language of object-oriented design interviews.
---

SOLID is made up of the initials of five principles for making object-oriented code **resilient to change**. In an interview, listing the principles isn't enough; what's expected is that you can spot the problem in a piece of code and explain which principle is violated and what the fix makes easier. The examples are written in C#.

## S: Single responsibility principle

> A class should have **only one reason** to change.

It's often misread as "it should do only one thing." The correct reading: a class should change at the request of **a single stakeholder** (a business unit, a source of rules).

```csharp
// Three different reasons to change in a single class
public class InvoiceService
{
    public decimal CalculateTotal(Invoice invoice) { /* tax and discount rules */ }
    public void Save(Invoice invoice) { /* SQL */ }
    public void SendByEmail(Invoice invoice) { /* template and SMTP */ }
}
```

When the tax rate changes, when the database schema changes, or when the email provider changes, you always touch the same class. Every change risks breaking the other two responsibilities, and testing the class in isolation becomes harder.

```csharp
public class InvoiceCalculator { public decimal CalculateTotal(Invoice invoice) { /* ... */ } }
public interface IInvoiceRepository { Task SaveAsync(Invoice invoice); }
public interface IInvoiceSender { Task SendAsync(Invoice invoice); }
```

Now the tax rules can be tested without a database, and changing the email provider doesn't touch the calculation code.

## O: Open-closed principle

> Software entities should be **open for extension, closed for modification**.

Adding a new behavior shouldn't require changing code that already works and has been tested.

```csharp
public decimal Discount(Customer customer, decimal amount) => customer.Tier switch
{
    Tier.Regular  => 0m,
    Tier.Gold     => amount * 0.10m,
    Tier.Employee => amount * 0.30m,
    _             => 0m,
};
```

A new customer type requires changing this method (and most likely the other places in the codebase where the same `switch` is repeated). Moving the behavior behind an abstraction:

```csharp
public interface IDiscountPolicy
{
    decimal Apply(decimal amount);
}

public sealed class GoldDiscount : IDiscountPolicy
{
    public decimal Apply(decimal amount) => amount * 0.10m;
}

// New type = new class; existing code doesn't change
public sealed class StudentDiscount : IDiscountPolicy
{
    public decimal Apply(decimal amount) => Math.Min(amount * 0.15m, 200m);
}
```

Be measured: a `switch` that lives in a single place and changes once a year is perfectly fine. Add the abstraction when the **second or third** change of the same kind arrives, once you can see along which axis things change. Trying to make everything extensible from the start produces needless complexity.

## L: Liskov substitution principle

> Subtypes must be usable in place of their base types **without breaking the correctness of the program**.

Inheritance establishes an "is-a" relationship; but that relationship must hold in **behavior**, not in the real world. The classic example:

```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area => Width * Height;
}

// In mathematics, a square is a rectangle...
public class Square : Rectangle
{
    public override int Width  { get => base.Width;  set { base.Width = value; base.Height = value; } }
    public override int Height { get => base.Height; set { base.Width = value; base.Height = value; } }
}

void Resize(Rectangle shape)
{
    shape.Width = 5;
    shape.Height = 4;
    Debug.Assert(shape.Area == 20);   // if given a Square, the area is 16: the assumption is broken
}
```

Code that uses `Rectangle` relies on the assumption that "changing the width doesn't change the height"; `Square` breaks this contract. The solution is to remove the inheritance: the two can be independent, preferably immutable, types that implement a common `IShape` interface.

Signs of a violation:

- Methods in a subclass that throw `NotSupportedException` or `NotImplementedException`.
- Type checks in the calling code, such as `if (shape is Square)`.
- A subclass demanding stricter preconditions (the base class accepts any number while the subclass accepts only positive ones) or giving weaker guarantees about its results.

There's an example in .NET itself: arrays implement the `IList<T>` interface but throw `NotSupportedException` when `Add` is called. Interfaces added later, such as `IReadOnlyList<T>`, mitigate this problem by expressing the "read-only list" capability separately.

## I: Interface segregation principle

> Clients should not be forced to depend on **methods they don't use**.

```csharp
public interface IOfficeMachine
{
    void Print(Document document);
    void Scan(Document document);
    void Fax(Document document);
}

public sealed class BasicPrinter : IOfficeMachine
{
    public void Print(Document document) { /* ... */ }
    public void Scan(Document document) => throw new NotSupportedException();
    public void Fax(Document document) => throw new NotSupportedException();
}
```

A bloated interface forces implementers to write empty or throwing methods (which is also a Liskov violation), and it ties a client that only wants to print to changes in the fax method.

```csharp
public interface IPrinter { void Print(Document document); }
public interface IScanner { void Scan(Document document); }

public sealed class BasicPrinter : IPrinter { /* ... */ }
public sealed class MultiFunctionPrinter : IPrinter, IScanner { /* ... */ }
```

Interfaces should be cut to fit the needs of whoever **uses** them, not to fit what the implementer can do.

## D: Dependency inversion principle

> High-level modules should not depend on low-level modules; both should depend on **abstractions**.

```csharp
public class OrderService
{
    private readonly SqlOrderRepository _orders = new();      // concrete database class
    private readonly StripePaymentClient _payments = new();   // concrete payment provider
}
```

The business rules (placing an order) are locked to infrastructure details (which database, which payment provider). When the payment provider changes, the business code changes, and the class can't be tested without a real database and payment account.

```csharp
// The abstractions are defined in the business layer...
public interface IOrderRepository { Task AddAsync(Order order); }
public interface IPaymentGateway  { Task<PaymentResult> ChargeAsync(Money amount, string token); }

public sealed class OrderService(IOrderRepository orders, IPaymentGateway payments)
{
    public async Task PlaceAsync(Order order, string paymentToken)
    {
        var result = await payments.ChargeAsync(order.Total, paymentToken);
        if (!result.Succeeded) throw new PaymentFailedException(result.Error);
        await orders.AddAsync(order);
    }
}

// ...and the infrastructure layer implements them: PostgresOrderRepository, StripePaymentGateway
```

This is where the "inversion" lies: the dependency arrow now points from the infrastructure to the business layer, because the **owner** of the interface is the business layer that uses it.

Two concepts are often confused:

- **Dependency inversion (DIP)** is a design principle: it says what should depend on what.
- **Dependency injection (DI)** is a technique: supplying dependencies from outside (usually through the constructor) instead of creating them with `new` inside the class. The DI container in ASP.NET Core automates this.

## Composition over inheritance

Another principle often mentioned alongside SOLID: **prefer composition over inheritance for sharing behavior.**

Inheritance ties the subclass to the base class's **implementation details**. An innocent-looking change in the base class can break subclasses (the fragile base class problem), and in single-inheritance languages a class can benefit from only one base class. With composition, a class gets the behavior it needs from the objects it holds:

```csharp
// Inheritance: is an "order service that sends notifications" an email sender?
public class OrderService : EmailSender { }

// Composition: the order service has a notifier
public sealed class OrderService(INotifier notifier) { }
```

With composition, behavior can be changed at runtime (SMS instead of email) and classes stay small. Inheritance is appropriate when there's a real, lasting "is-a" relationship and the Liskov principle holds.

## Being measured

The principles serve a purpose: making code cheaper to change. Applied without purpose, they do the opposite.

- **YAGNI** (you aren't gonna need it): don't add an extension point that isn't needed today. Every interface and every abstraction is a layer of indirection the reader has to follow.
- **KISS** (keep it simple): writing an interface for a class that has a single implementation, and isn't expected to get another, is often unnecessary. (Needing a fake object for tests can be a reason.)
- **DRY** (don't repeat yourself) is about duplicated knowledge, not visual similarity. Merging two pieces of code into a shared abstraction just because they look alike today locks them together when they later need to change in different directions. The wrong abstraction is more expensive than duplication.

## The object-oriented design interview

For questions like "design a parking lot system" or "model an elevator system," here's the path to follow:

1. **Clarify the requirements:** which vehicle types, how many levels, how pricing works, which operations (entry, exit, payment)?
2. **Identify the core entities:** the nouns in the sentences are candidate classes (`ParkingLot`, `Level`, `Spot`, `Vehicle`, `Ticket`).
3. **Establish the relationships:** a parking lot **has** levels (composition); a motorcycle **is a** vehicle (inheritance or an interface).
4. **Place the behaviors:** verbs are methods. Each behavior goes to the class that has the information it needs (`Spot.CanFit(vehicle)`).
5. **Point out the points of change:** saying "Pricing rules may change, so they sit behind `IPricingStrategy`" shows that you use SOLID with reasoning, not by rote.

## Summary

- **S:** a class should have only one reason to change.
- **O:** new behavior should be addable without changing existing code; but add the abstraction when the need arises.
- **L:** a subtype must not break the base type's contract; `NotSupportedException` and type checks are warning signs.
- **I:** keep interfaces small, fitted to the needs of whoever uses them.
- **D:** business code should depend on abstractions; the owner of the abstraction is the layer that uses it. DI is the technique for applying this principle.
- Prefer composition for sharing behavior; don't apply the principles without purpose.
