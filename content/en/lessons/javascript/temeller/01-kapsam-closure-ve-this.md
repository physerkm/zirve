---
title: Scope, Closures, and this
summary: The three cornerstones of JavaScript interviews. var/let/const and hoisting, what a closure is and what it's good for, and how this is determined by the way a function is called.
---

## Scope: var, let, const

Scope determines where in the code a variable can be accessed. JavaScript uses **lexical** scope: which variables a function can access is determined by where it is **written**, not where it is **called**.

| | `var` | `let` | `const` |
| --- | --- | --- | --- |
| Scope | Function | Block (`{ }`) | Block |
| Reassignment | Yes | Yes | No |
| Access before declaration | `undefined` | Error (TDZ) | Error (TDZ) |
| Redeclaration in the same scope | Allowed | Error | Error |

```javascript
if (true) {
  var a = 1;
  let b = 2;
}
console.log(a);            // 1: var ignores blocks
console.log(typeof b);     // "undefined": b doesn't exist outside the block
```

`const` prevents **reassignment**; it doesn't provide immutability: `const list = []; list.push(1);` is valid. Use `const` by default and `let` when you need to reassign; don't use `var`.

### Hoisting

Declarations are processed as if they had been "moved" to the top of their scope before execution starts:

- **Function declarations** are hoisted in full: you can call them before their definition.
- **`var`** declarations are hoisted, but their assignments aren't: reading one before the declaration gives `undefined`.
- **`let` / `const`** are hoisted too, but can't be accessed until their declaration line. That stretch is called the **temporal dead zone** (TDZ).

```javascript
console.log(x);     // undefined
var x = 5;

console.log(y);     // ReferenceError: Cannot access 'y' before initialization
let y = 5;
```

## Closures

A closure is a function's ability to access the **variables in the scope where it was defined, even after that scope has ended**. In JavaScript, every function is a closure.

```javascript
function createCounter() {
  let count = 0;                 // lives on after createCounter returns
  return {
    increment: () => ++count,
    get value() { return count; },
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.value);      // 2
console.log(counter.count);      // undefined: not accessible from outside
```

The function captures **the variable itself, not a copy of its value**.

What closures are good for:

- **Data hiding.** The `count` above is truly private.
- **Function factories and partial application:** `const add = (a) => (b) => a + b;`
- **Stateful helpers:** memoize, debounce, throttle.
- **Callbacks and event handlers:** they access the surrounding variables.
- In React, **hooks** are built entirely on closures; "stale closure" bugs come from here too.

```javascript
function memoize(fn) {
  const cache = new Map();                       // kept inside the closure
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
```

### The classic question: a loop and setTimeout

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3
```

`var` is function-scoped; all three callbacks share the **same** `i` variable, and by the time they run, the loop has finished. With `let`, each iteration gets its own `i`, and the output is `0 1 2`.

The cost of closures: captured variables can't be freed by the garbage collector as long as the function that captured them is reachable. Event listeners that are never removed and timers that are never cleared cause memory leaks this way.

## this

`this` is determined by **how the function is called**, not by where it is defined (except for arrow functions). Four rules, in order of precedence:

| How it's called | `this` |
| --- | --- |
| `new Fn()` | The newly created object |
| `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)` | The explicitly passed `obj` |
| `obj.method()` | The object to the left of the dot (`obj`) |
| `fn()` | `undefined` in strict mode; otherwise the global object |

```javascript
const user = {
  name: 'Ada',
  greet() { return `Hello, ${this.name}`; },
};

user.greet();                    // "Hello, Ada"

const greet = user.greet;        // the method is detached from its object
greet();                         // TypeError: this is undefined (modules and classes are in strict mode)
```

Passing a method as a callback (`setTimeout(user.greet, 100)`, `button.onclick = user.greet`) produces the same error: the function has been detached from its object.

### Arrow functions

Arrow functions **don't have their own `this`**; they use the `this` of the scope they were defined in, and it can't be changed with `call`/`bind`.

```javascript
class Timer {
  seconds = 0;

  start() {
    setInterval(() => {
      this.seconds++;            // this is the this inside start(): the Timer instance
    }, 1000);
  }
}
```

The rule that follows: use **arrow functions for callbacks and regular functions for object methods**. If you write an object method as an arrow function, `this` won't point to the object:

```javascript
const broken = {
  name: 'Ada',
  greet: () => this.name,        // here this is not the object but the outer scope's this
};
```

Arrow functions also have no `arguments` object and can't be called with `new`.

### call, apply, bind

```javascript
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}

const ada = { name: 'Ada' };

introduce.call(ada, 'Hello', '!');       // arguments one by one
introduce.apply(ada, ['Hello', '!']);    // arguments as an array
const bound = introduce.bind(ada, 'Hi'); // returns a new function; this is bound permanently
bound('.');
```

## Prototypes

In JavaScript, inheritance works through the **prototype chain**. Every object has a hidden link to a prototype; if a property isn't found on the object, it is looked up along the chain.

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
}

const cat = new Animal('Pamuk');
Object.getPrototypeOf(cat) === Animal.prototype;   // true
Object.hasOwn(cat, 'speak');                        // false: the method lives on the prototype
```

The `class` syntax doesn't introduce a new inheritance model; it's a more readable syntax on top of prototypes. Methods aren't copied into every instance; they live **once** on `Animal.prototype` and are shared by all instances.

## Asked in interviews

- **"What is a closure, and where have you used one?"** Give the definition, then a concrete example: memoize, debounce, private state.
- **"What's the difference between `==` and `===`?"** `==` converts types before comparing (`0 == ''` is true); `===` doesn't. Always use `===`.
- **"Write debounce."** Keep a timer ID in a closure; on every call, cancel the previous one and set a new one.

```javascript
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

## Summary

- Scope is lexical. `let` and `const` are block-scoped and protected by the TDZ; don't use `var`.
- Closure: a function plus the variables of the scope it was defined in. The variable itself is captured.
- `this` is determined by how the function is called: `new`, explicit binding, method call, plain call.
- Arrow functions take `this` from the enclosing scope; they're ideal for callbacks.
- `class` is syntax on top of the prototype chain.
