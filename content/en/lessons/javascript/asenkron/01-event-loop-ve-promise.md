---
title: The Event Loop, Promises, and async/await
summary: How single-threaded JavaScript runs asynchronous work. The call stack, macrotasks and microtasks, Promise chains, async/await, and error handling.
---

JavaScript is **single-threaded**: it does only one thing at a time. Even so, network requests, timers, and user events don't block each other. The mechanism that makes this possible is the **event loop**, and every "what does this code print?" question depends on it.

## The pieces

- **Call stack:** the functions currently running. JavaScript doesn't move on to another task until it finishes the current one.
- **Environment APIs:** timers, the network, the file system. These are provided by the browser or Node.js, and they run **outside** the JavaScript thread.
- **Macrotask queue** (task queue): `setTimeout`, `setInterval`, I/O, and event callbacks.
- **Microtask queue:** Promise callbacks (`then`, `catch`, `finally`), code after an `await`, `queueMicrotask`.

The event loop keeps running this cycle:

1. Run synchronous code until the call stack is empty.
2. Run **all** microtasks (including the ones added while they run).
3. Paint the screen if needed (in the browser).
4. Take **one** macrotask from the queue and go back to step 1.

The result: **microtasks run before macrotasks.**

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Output: 1 4 3 2
```

`setTimeout(fn, 0)` doesn't mean "right now". It means "at the first opportunity, after the synchronous code and all microtasks have finished".

A harder example:

```javascript
setTimeout(() => console.log('A'), 0);

Promise.resolve()
  .then(() => {
    console.log('B');
    setTimeout(() => console.log('C'), 0);
  })
  .then(() => console.log('D'));

console.log('E');

// Output: E B D A C
```

`E` is synchronous. Then come the microtasks: `B`, followed by the rest of the chain, `D`. Then the macrotasks **in the order they were added**: `A`, then `C`, which was added inside `B`.

### Blocking the thread

Because there is a single thread, a long synchronous computation stops **everything**: in the browser, clicks and painting wait; in Node.js, every other request waits. The solutions: split the work into chunks, use a Web Worker / worker thread, or move the work to the server.

Microtasks that keep re-queuing themselves also starve macrotasks and painting.

## Promise

A Promise represents the result of an operation that will complete in the future. It has three states: **pending**, **fulfilled**, and **rejected**. The state changes once and never changes again.

```javascript
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

fetchUser(1)
  .then((user) => fetchOrders(user.id))     // returning a Promise flattens the chain
  .then((orders) => console.log(orders))
  .catch((error) => console.error(error))   // catches an error anywhere in the chain
  .finally(() => hideSpinner());
```

What you need to know:

- `then` always returns a **new** Promise; that's what makes chaining work.
- If you return a value inside `then`, the next `then` receives it; if you return a Promise, the next `then` waits for its result.
- An error thrown inside `then` moves the chain into the rejected state and skips ahead to the first `catch`.
- `then` callbacks **always run asynchronously** (as microtasks), even if the Promise has already settled.

### Combinators

| Method | When it fulfills | When it rejects |
| --- | --- | --- |
| `Promise.all` | When all succeed (an array of results) | Immediately, on the **first** rejection |
| `Promise.allSettled` | When all have settled (the status of each one) | Never |
| `Promise.race` | The first to **settle** (success or rejection) | If the first to settle is a rejection |
| `Promise.any` | The first to **succeed** | If all of them reject |

"I need all of them; give up if one fails" → `all`. "Some may fail; I want every result" → `allSettled`. Timeout → `race`.

## async / await

`async`/`await` is syntax on top of Promises; it isn't a new mechanism.

- An `async` function **always** returns a Promise.
- `await` pauses **that function** until the Promise settles; it doesn't block the thread. The rest of the function continues as a microtask.

```javascript
async function loadDashboard(userId) {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchOrders(user.id);
    return { user, orders };
  } catch (error) {
    console.error('Failed to load:', error);
    throw error;                       // let the caller know too
  }
}
```

```javascript
async function demo() {
  console.log('1');
  await null;                // pauses here; the rest becomes a microtask
  console.log('3');
}

demo();
console.log('2');
// Output: 1 2 3
```

### Common mistakes

**Awaiting independent work sequentially.** The durations add up.

```javascript
// Slow: the requests run one after another
const user = await fetchUser(id);
const settings = await fetchSettings(id);

// Fast: the requests start together
const [user2, settings2] = await Promise.all([fetchUser(id), fetchSettings(id)]);
```

**`await` inside `forEach`.** `forEach` doesn't wait for the returned Promises; the code moves on before the loop finishes.

```javascript
items.forEach(async (item) => { await save(item); });   // DOES NOT WAIT

for (const item of items) { await save(item); }          // sequential
await Promise.all(items.map((item) => save(item)));      // concurrent
```

**Unhandled rejections.** If a Promise that isn't `await`ed and has no `catch` rejects, the error is silently lost (or, in Node.js, it can terminate the process). Either `await` every Promise or attach a `catch`.

**`return` vs. `return await`.** If you return a Promise inside `try/catch` without `await`ing it, the rejection happens **outside** your `catch` block and isn't caught. Write `return await` inside `try`.

## Asked in interviews

- **"What's the output?" questions.** Method: first write out the synchronous lines in order; then the microtasks (in the order they were added, following the chains); finally the macrotasks.
- **"Implement `Promise.all` yourself."** Store results by index, track how many have completed, and reject on the first rejection.

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let remaining = promises.length;
    if (remaining === 0) return resolve(results);

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then((value) => {
        results[index] = value;                 // input order is preserved, not completion order
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}
```

- **"If Node.js is single-threaded, how does it scale?"** I/O is handed off to the operating system and a thread pool; the JavaScript thread doesn't wait, it only runs the callbacks. CPU-heavy work, on the other hand, blocks it.

## Summary

- One thread, one call stack; the environment runs asynchronous work, and the results come back through the queues.
- Order: synchronous code → all microtasks → one macrotask → repeat.
- A Promise settles once; `then` returns a new Promise and always runs asynchronously.
- `async`/`await` is Promise syntax; `await` pauses the function, not the thread.
- Await independent work together with `Promise.all`; don't use `await` inside `forEach`.
