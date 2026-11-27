---
title: Value and Reference Types
summary: The foundation of the C# type system. The difference between struct and class, the stack and the heap, copy behavior, boxing, ref/out/in, and record types.
---

"What's the difference between a `struct` and a `class`?" is the most classic C# interview question. A good answer doesn't stop at "one lives on the stack, the other on the heap"; it explains **how assignment and parameter passing behave**.

## The core difference: copying

- **Value type:** the variable holds **the data itself**. Assignment copies the data.
- **Reference type:** the variable holds a **reference** to an object on the heap. Assignment copies the reference; both variables point to the same object.

```csharp
struct PointStruct { public int X; }
class PointClass { public int X; }

var a = new PointStruct { X = 1 };
var b = a;          // the data was copied
b.X = 99;
Console.WriteLine(a.X);   // 1

var c = new PointClass { X = 1 };
var d = c;          // the reference was copied; c and d are the same object
d.X = 99;
Console.WriteLine(c.X);   // 99
```

| | Value types | Reference types |
| --- | --- | --- |
| Examples | `int`, `double`, `bool`, `char`, `decimal`, `DateTime`, `Guid`, `enum`, `struct`, tuples | `class`, `string`, arrays, `delegate`, `interface`, `record` (by default) |
| Assignment | Copies the value | Copies the reference |
| Default value | All fields zero | `null` |
| Equality (default) | Field-by-field comparison | Reference (identity) comparison |
| Inheritance | None (can implement interfaces) | Yes |

`string` is a reference type, but it is **immutable** and its equality is based on content; that's why it gives the impression of behaving like a value type.

## Stack and heap: a common misconception

The statement "value types live on the stack, reference types live on the heap" is **incomplete**. The accurate version:

- The **object** of a reference type is always on the heap.
- A value type lives **wherever it was declared**: if it's a local variable, usually on the stack; if it's a field of a class, **on the heap** together with that object; if it's an element of an array, inside the array, which means on the heap.

```csharp
class Order
{
    public int Quantity;      // a value type, but inside the Order object: on the heap
}
```

Where it lives is an implementation detail; what the language guarantees is the **copy semantics**. Making this distinction in an interview makes you stand out.

## Parameter passing

In C#, parameters are passed **by value** by default. For reference types, that means **a copy of the reference**: the method can change the object's contents, but it can't rebind the caller's variable to a different object.

```csharp
void Mutate(List<int> list) => list.Add(1);            // the caller sees this
void Reassign(List<int> list) => list = new List<int>(); // the caller does NOT see this

var numbers = new List<int>();
Mutate(numbers);     // Count == 1
Reassign(numbers);   // Count is still 1
```

There are three keywords for passing the variable itself:

| Keyword | Meaning | Typical use |
| --- | --- | --- |
| `ref` | Read and written; the caller must have assigned it beforehand | In-place modification, `Swap` |
| `out` | The method **must** assign it; the caller doesn't have to | `int.TryParse(text, out var value)` |
| `in` | Read-only reference | Passing large `struct`s without copying |

## Boxing and unboxing

When a value type is assigned to `object` or to an interface type, the value is **copied** into a new object on the heap: this is called boxing. Getting it back out is unboxing.

```csharp
int n = 42;
object boxed = n;          // boxing: heap allocation + copy
int back = (int)boxed;     // unboxing: type check + copy
```

Every boxing operation is a memory allocation and creates work for the garbage collector. It becomes noticeable in hot loops. Hidden sources of boxing:

- Non-generic collections (`ArrayList`, `Hashtable`). Generic collections (`List<int>`) exist to solve this problem.
- `string.Format("{0}", 42)` or any method that takes an `object` parameter.
- Assigning a `struct` to a variable of an interface type.

A subtlety: the boxed value is a **copy**. Changing the box doesn't affect the original variable.

## When to use a struct

Make `class` your default choice. Consider a `struct` only if **all** of the following hold:

- It logically represents **a single value** (a coordinate, a money amount, a date range).
- It's small (roughly up to 16–24 bytes); copying large `struct`s is expensive.
- It's **immutable**. Mutable `struct`s lead to surprising bugs, such as a change made to a copy getting lost.

```csharp
public readonly record struct Money(decimal Amount, string Currency);
```

`readonly struct` has the compiler enforce immutability and prevents unnecessary defensive copies.

## record: a reference type with value semantics

`record` is designed for types that are defined by their data. The compiler generates value-based `Equals`/`GetHashCode`, a readable `ToString`, and copying with the `with` expression for you.

```csharp
public record Person(string Name, int Age);

var ada = new Person("Ada", 36);
var same = new Person("Ada", 36);
Console.WriteLine(ada == same);          // True: contents are compared

var older = ada with { Age = 37 };       // a new object; ada is unchanged
```

| | `class` | `record` (class) | `record struct` |
| --- | --- | --- | --- |
| Kind of type | Reference | Reference | Value |
| Default `==` | Identity | Content | Content |
| Typical use | Entities with behavior and identity | DTOs, value objects | Small, frequently copied values |

## Nullability

- `int?` (`Nullable<int>`) is a `struct` that adds a "no value" state to a value type.
- `string?` uses the nullable reference types feature to tell the compiler "this may be null." It makes no difference at runtime; it produces warnings at compile time and catches most `NullReferenceException` bugs while you're writing the code.

```csharp
string? name = FindName();
var length = name?.Length ?? 0;      // 0 if null
```

## Summary

- Value types are copied; reference types are shared. That's the real difference, not the memory location.
- Parameters are passed by value; for reference types, what gets copied is the reference. `ref`, `out`, and `in` pass the variable itself.
- Boxing is a hidden memory allocation; generic collections prevent it.
- `struct`: small, immutable, a single value. If you're not sure, use `class`.
- `record`: immutable data models with content equality and `with`.
