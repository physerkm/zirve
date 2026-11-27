---
title: The TypeScript Type System
summary: Structural typing, union types and narrowing, discriminated unions, generics, unknown vs. any, and utility types.
---

TypeScript adds a type system to JavaScript that works at **compile time**. Types don't exist at runtime: they are erased during compilation, and plain JavaScript is left behind. This one sentence answers many interview questions: types don't check anything at runtime, so you have to validate external data (API responses, user input) separately.

## Structural typing

C# and Java use **nominal** typing: two types are compatible if their names and declarations match. TypeScript is **structural**: a value is compatible if it has the required **shape**.

```typescript
interface Point {
  x: number;
  y: number;
}

function length(p: Point): number {
  return Math.hypot(p.x, p.y);
}

const pixel = { x: 3, y: 4, color: 'red' };
length(pixel);        // valid: pixel has everything Point requires
```

`pixel` never declared that it is a `Point`; its shape is enough. Extra properties are not a problem. The only exception is the excess property check that happens when you pass an **object literal directly**; it exists to catch typos:

```typescript
length({ x: 3, y: 4, color: 'red' });   // Error: 'color' does not exist in Point
```

## type and interface

Both define object shapes, and in most cases you can use them interchangeably.

| | `interface` | `type` |
| --- | --- | --- |
| Object shape | Yes | Yes |
| Union, tuple, primitive alias | No | Yes |
| Extension | `extends` | `&` (intersection) |
| Redeclaration with the same name (merging) | Yes | No |

Practical rule: be consistent within a team. A common choice is `interface` for object shapes and `type` for unions and type computations.

## Union types and narrowing

A union says that a value can be one of several types. TypeScript **narrows** the type by following control flow.

```typescript
function format(value: string | number | null): string {
  if (value === null) return '-';                // here value: null
  if (typeof value === 'string') return value.trim();   // here value: string
  return value.toFixed(2);                       // what's left: number
}
```

Narrowing tools: `typeof`, `instanceof`, `in`, equality checks, truthiness checks and your own **type guard**:

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

### Discriminated unions

The most powerful way to model state. Every member has a common **literal field**; checking that field narrows the type precisely.

```typescript
type RequestState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function render(state: RequestState<string[]>): string {
  switch (state.status) {
    case 'loading':
      return 'Loading…';
    case 'success':
      return state.data.join(', ');      // data exists only here
    case 'error':
      return state.message;
    default: {
      const unreachable: never = state;  // if a new state is added, this won't compile
      return unreachable;
    }
  }
}
```

This model makes **invalid states unrepresentable in the type**, such as "loading but also failed at the same time." Keeping three independent fields like `isLoading`, `error` and `data` instead allows eight possible combinations, most of which make no sense.

**Exhaustiveness checking** with `never` turns unhandled places into compile errors when a new member is added to the union.

## any, unknown, never

| Type | Meaning | Use |
| --- | --- | --- |
| `any` | **Turns off** type checking | Avoid it; it is contagious |
| `unknown` | "I don't know what this is" | External data; narrowing before use is **mandatory** |
| `never` | "No value can exist" | Functions that never return, exhaustiveness checking |

```typescript
const data: unknown = JSON.parse(text);

data.name;                                     // Error: narrow it first
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log(data.name);                      // safe now
}
```

Calls like `JSON.parse` and `fetch().json()` return `any`. Stamping the result with `as User` silences the compiler but validates nothing; do real validation at system boundaries (by hand or with a schema library such as zod).

## Generics

A generic makes the type itself a parameter: you preserve the relationship between input and output.

```typescript
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const n = first([1, 2, 3]);        // number | undefined
const s = first(['a', 'b']);       // string | undefined
```

If you had used `any`, the return type information would be lost. **Constraints** (`extends`) state the minimum shape a generic parameter must have:

```typescript
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const users = [{ name: 'Ada', age: 36 }];
pluck(users, 'name');      // string[]
pluck(users, 'email');     // Error: 'email' is not a valid key
```

`keyof T` is the union of `T`'s keys; `T[K]` is the value type of that key. These two are the foundation of type-safe helpers.

## Utility types

Common transformations come built in:

| Type | What it does |
| --- | --- |
| `Partial<T>` | Makes all fields optional |
| `Required<T>` | Makes all fields required |
| `Readonly<T>` | Makes all fields read-only |
| `Pick<T, K>` | Takes only the selected fields |
| `Omit<T, K>` | Removes the selected fields |
| `Record<K, V>` | An object with keys `K` and values `V` |
| `ReturnType<F>` | A function's return type |
| `Awaited<T>` | The resolved type of a Promise |

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserUpdate = Partial<Omit<User, 'id'>>;     // { name?: string; email?: string }
type UserById = Record<number, User>;
```

These aren't magic; they are written with **mapped types**: `type Partial<T> = { [K in keyof T]?: T[K] }`.

## Literal types and as const

```typescript
const directions = ['north', 'south'] as const;      // readonly ['north', 'south']
type Direction = (typeof directions)[number];        // 'north' | 'south'
```

`as const` keeps the types of values without widening them (`'north'` instead of `string`). Using string unions and `as const` objects instead of `enum` is the modern choice: they generate no extra code at runtime.

## Strict mode

`"strict": true` in `tsconfig.json` is non-negotiable. Its most important component is `strictNullChecks`: `null` and `undefined` can't be silently assigned to every type, and most "cannot read properties of undefined" errors are caught at compile time.

```typescript
function find(users: User[], id: number): User | undefined {
  return users.find((user) => user.id === id);
}

const user = find(users, 1);
user.name;              // Error: user may be undefined
user?.name ?? 'Anonymous'; // safe
```

Adding `!` at the end (`user!.name`) silences the compiler but doesn't prevent the runtime error; avoid it.

## Summary

- Types exist at compile time and are erased; validate external data at runtime.
- Typing is structural: if the shape fits, the type fits.
- Unions + narrowing + discriminated unions make invalid states impossible in the type.
- `unknown` instead of `any`; `never` for exhaustiveness.
- Generics preserve the input–output type relationship; `keyof` and utility types prevent repetition.
- `strict` should always be on.
