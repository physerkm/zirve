---
title: Advanced Types
summary: keyof, typeof and indexed access types, conditional types and infer, distributive conditional types, mapped types and key remapping, template literal types, writing the utility types yourself, satisfies, as const, branded types and exhaustiveness checking.
---

In the `TypeScript Type System` lesson we covered structural typing, unions, narrowing and generics. This lesson is about using the type system like a **programming language**: producing types from types. Frontend interview questions such as "write `Partial` yourself" or "what does this type evaluate to?" come from these topics. In real projects, they keep API client, form and state management code type-safe.

## Deriving types from types

```ts
const config = { apiUrl: 'https://api.example.com', retries: 3, debug: false };

type Config = typeof config;                 // { apiUrl: string; retries: number; debug: boolean }
type ConfigKey = keyof Config;               // "apiUrl" | "retries" | "debug"
type Retries = Config['retries'];            // number   (indexed access)
type Values = Config[keyof Config];          // string | number | boolean

type Order = { id: string; lines: { sku: string; qty: number }[] };
type Line = Order['lines'][number];          // { sku: string; qty: number }
```

- `typeof` (in a type context) takes the type of a **value**.
- `keyof` gives the union of an object type's keys.
- `T[K]` is indexed access. `[number]` gives the element type of an array.

The single source of truth principle: define a type once and derive the others from it. Changes are made in one place.

## as const and satisfies

```ts
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number];          // "admin" | "editor" | "viewer"
```

`as const` pins a value to its narrowest type: the array becomes a readonly tuple, and strings become literal types. The runtime array and the type come from the same source.

```ts
type Route = { path: string; auth: boolean };

const routes = {
  home: { path: '/', auth: false },
  orders: { path: '/orders', auth: true },
} satisfies Record<string, Route>;

routes.orders.path;      // type-checked, and the keys ("home" | "orders") are preserved
```

`satisfies` **checks that** a value conforms to a type, but it **does not change** the value's inferred (narrower) type. If we had written `const routes: Record<string, Route> = ...`, the knowledge of `routes.orders` would be lost and every key would be considered valid.

## Conditional types

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;     // true
type B = IsString<42>;          // false
```

`T extends U ? X : Y`: if `T` is assignable to `U`, then `X`, otherwise `Y`. It is an `if` at the type level.

### infer

To capture part of a type inside a condition:

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type Unwrap<T> = T extends Promise<infer V> ? Unwrap<V> : T;    // recursive
type ReturnOf<F> = F extends (...args: any[]) => infer R ? R : never;

type X = ElementOf<string[]>;               // string
type Y = Unwrap<Promise<Promise<number>>>;  // number
type Z = ReturnOf<() => Promise<Order>>;    // Promise<Order>
```

### Distributive conditional types

If the condition is on a naked type parameter, it is applied to **each member of a union separately**:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type R1 = ToArray<string | number>;         // string[] | number[]   (distributed)

type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never;
type R2 = ToArrayNoDist<string | number>;   // (string | number)[]   (not distributed)
```

`Exclude` and `Extract` rely on this behavior:

```ts
type MyExclude<T, U> = T extends U ? never : T;
type Status = 'draft' | 'paid' | 'shipped' | 'cancelled';
type Active = MyExclude<Status, 'cancelled'>;   // "draft" | "paid" | "shipped"
```

`never` disappears in a union. That's why we return `never` to say "drop this member."

## Mapped types

They iterate over each key of a type and produce a new type:

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };     // "-?" removes optionality
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends PropertyKey, V> = { [P in K]: V };
type MyOmit<T, K extends PropertyKey> = MyPick<T, Exclude<keyof T, K>>;
```

### Key remapping (`as`)

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Mapping a key to never filters it out: only the fields that are functions
type MethodsOf<T> = { [K in keyof T as T[K] extends (...a: any[]) => any ? K : never]: T[K] };
```

## Template literal types

```ts
type HttpMethod = 'GET' | 'POST' | 'DELETE';
type ApiPath = '/orders' | '/users';
type Endpoint = `${HttpMethod} ${ApiPath}`;   // a union of 6 combinations

type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickHandler = EventName<'click'>;        // "onClick"

// Parsing route parameters
type Params<P extends string> =
  P extends `${string}:${infer Name}/${infer Rest}` ? Name | Params<`/${Rest}`>
  : P extends `${string}:${infer Name}` ? Name
  : never;

type OrderParams = Params<'/users/:userId/orders/:orderId'>;   // "userId" | "orderId"
```

Routing libraries (TanStack Router, type-safe API clients) use this technique to guarantee at compile time that `params.orderId` exists.

## Exhaustiveness checking

Having the compiler verify that every case of a discriminated union is handled:

```ts
type Payment =
  | { kind: 'card'; last4: string }
  | { kind: 'transfer'; iban: string }
  | { kind: 'wallet'; provider: 'apple' | 'google' };

function describe(p: Payment): string {
  switch (p.kind) {
    case 'card': return `Card •••• ${p.last4}`;
    case 'transfer': return `Bank transfer ${p.iban}`;
    case 'wallet': return `${p.provider} wallet`;
    default: {
      const unreachable: never = p;   // if a new kind is added, a compile error here
      return unreachable;
    }
  }
}
```

When you add `{ kind: 'crypto' }` to the union, the assignment in the `default` branch fails, and every forgotten `switch` is found at compile time.

## Branded types

With structural typing, two `string`s are always interchangeable. To prevent an order ID from being passed by mistake where a customer ID is expected:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type OrderId = Brand<string, 'OrderId'>;
type CustomerId = Brand<string, 'CustomerId'>;

const toOrderId = (s: string) => s as OrderId;   // validation happens here

function cancel(id: OrderId) { /* ... */ }
cancel(toOrderId('ord_42'));                 // ok
cancel('ord_42');                            // error: string is not OrderId
cancel(customerId);                          // error: CustomerId is not OrderId
```

It is the TypeScript counterpart of strongly typed IDs in C#. It has no runtime cost.

## Function overloads and generic constraints

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const total = get(order, 'total');      // number
get(order, 'totl');                      // error: "totl" is not a valid key
```

The `K extends keyof T` constraint ties the key and the return type together.

## Using them in moderation

These tools are powerful but hard to read. Rules:

- Prefer simple types in application code. Advanced types pay off at library boundaries and in shared helpers.
- Give a complex type a descriptive name and break it into small pieces.
- If the error message becomes unreadable, the type is too clever.
- `any` turns off type safety. Use `unknown` for unknown data and narrow it.

## Asked in interviews

- **"Write `Partial<T>` yourself."** `{ [K in keyof T]?: T[K] }`.
- **"Write `Omit`."** `Pick<T, Exclude<keyof T, K>>`.
- **"What is `infer` for?"** It captures part of a type inside a conditional type: an array element, a Promise value, a return type.
- **"What's the difference between `satisfies` and a type annotation (`: Type`)?"** `satisfies` checks conformance but keeps the inferred narrow type.
- **"How do you find forgotten `switch` statements when a new union member is added?"** Exhaustiveness checking by assigning to `never` in the `default` branch.
- **"What is `T extends unknown ? T[] : never` for `string | number`?"** A distributive conditional: `string[] | number[]`.

## Summary

- Derive types from a single source with `typeof`, `keyof` and indexed access.
- `as const` pins a value to literal types. `satisfies` checks but preserves the narrowing.
- Conditional types are a type-level `if`. `infer` captures parts. On a naked parameter they distribute over unions.
- Mapped types iterate over keys. `as` renames or filters them.
- Template literal types produce and parse string patterns at the type level.
- Exhaustiveness checking with `never`, and semantic distinctions with branded types. Readability comes first.
