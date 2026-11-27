---
title: The Render Model and Hooks
summary: When and how React redraws a component, the role of key, using useState and useEffect correctly, and the stale closure and unnecessary effect bugs.
---

React interviews don't test whether you've memorized the API; they test your **mental model**: when does a component run again, why doesn't state change immediately, and when do you need `useEffect`? In this lesson, we build that model.

## The UI is a function of state

In React, a component is a function that **takes props and state and returns what should be on the screen**. You don't change the DOM by hand; you change the state, and React makes the screen match it.

An update goes through three phases:

1. **Trigger.** The initial render or a state update (`setState`).
2. **Render.** React **calls** your component function and gets a new element tree (the plain objects that JSX produces). The DOM isn't touched in this phase.
3. **Commit.** React compares the new tree with the previous one (**reconciliation**) and applies only the **differences** to the DOM.

The word "render" doesn't mean "update the DOM"; it means "call the component function." Re-rendering a component is usually cheap; what's expensive is DOM changes, and React keeps those to a minimum.

### When a component re-renders

- When its own **state** changes.
- When its **parent** re-renders (even if its props haven't changed).
- When the value of a **context** it uses changes.

The phrase "it re-renders when its props change" is misleading: by default, if the parent renders, its children render too. `React.memo` changes this behavior: if the props are the same (by shallow comparison), the render is skipped.

### Rendering must be pure

The component body is a computation: it should give the same output for the same input and must not change the outside world. Sending a network request, touching the DOM, or modifying external variables during render is a bug. In development mode (`StrictMode`), React deliberately renders components **twice** to expose these bugs.

## key: identity

React uses `key` to match up list items between renders. A `key` is the way of saying "this item is the same as that item from last time."

```tsx
{todos.map((todo) => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

**Don't use the array index as the `key`** (unless the list never changes). When an item is added, removed, or reordered, the indexes shift; React matches the wrong components, and a component's **internal state** (e.g., the text in an input box) stays on the wrong row.

`key` isn't only for lists: changing a component's `key` tells React to **destroy it and build it from scratch**. It's the cleanest way to reset state:

```tsx
<ProfileForm key={userId} userId={userId} />   // the form resets when the user changes
```

## useState

```tsx
const [count, setCount] = useState(0);
```

### State is a snapshot

Calling `setCount` **doesn't change** the `count` variable; it requests the next render. In that render, `count` arrives with the new value. All the code in the current render (including event handlers) sees **that render's** value.

```tsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  console.log(count);       // still the old value
}
// Result: count goes up by 1, not 3.
```

All three calls read the same `count` value (e.g., 0), and all three say "make it 1." For updates that depend on the previous value, use an **updater function**:

```tsx
setCount((previous) => previous + 1);   // called three times, it goes up by 3
```

React **batches** updates within the same event: three `setState` calls produce a single render.

### Don't mutate state directly

React tells whether state has changed by **reference comparison**. If you modify an object or array in place, the reference stays the same and React doesn't re-render.

```tsx
// Wrong: the same array, React doesn't see the change
items.push(newItem);
setItems(items);

// Right: a new array
setItems([...items, newItem]);
setUser({ ...user, name: 'Ada' });
```

### Don't put what can be derived into state

A value that can be **computed** from other state or props shouldn't be state. Compute it during render:

```tsx
// Unnecessary state + effect
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// The right way
const fullName = `${first} ${last}`;
```

Extra state means extra things to keep in sync; that's where most bugs come from.

## useEffect

An effect is for **synchronizing a component with a system outside React**: a network connection, a browser API, a timer, a third-party component.

```tsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();

  return () => connection.disconnect();     // cleanup
}, [roomId]);                                // dependencies
```

- An effect runs **after the render is committed**.
- The **dependency array** must include every value used inside the effect that can change between renders. When one changes, React first runs the **cleanup** (with the old values), then the effect (with the new values).
- If the array is empty (`[]`), the effect runs only when the component mounts; if no array is given at all, it runs after every render.

Don't "lie" about dependencies. Silencing the lint rule (`react-hooks/exhaustive-deps`) almost always hides a bug.

### Stale closures

Each render "captures" its own props and state. An effect with a missing dependency keeps seeing the values from an **old render**:

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);        // count is always the first render's value: the counter gets stuck at 1
  }, 1000);
  return () => clearInterval(id);
}, []);                          // count isn't in the dependencies

// Fix: an updater function; the effect no longer needs count
setCount((previous) => previous + 1);
```

### You might not need an effect

The most common React mistake is writing unnecessary effects.

| What you want to do | Instead of an effect |
| --- | --- |
| Derive a value from props or state | Compute it during render |
| Cache an expensive computation | `useMemo` |
| React to a user interaction (click, submit) | Do it **in the event handler** |
| Reset state when a prop changes | Use `key` |
| Fetch data from the server | A library like TanStack Query or the framework's data layer |

If you fetch data by hand inside an effect, you have to handle the **race condition**: if the user quickly switches from A to B, A's response can arrive after B's, and the wrong data stays on screen.

```tsx
useEffect(() => {
  let ignore = false;

  fetchUser(userId).then((user) => {
    if (!ignore) setUser(user);       // ignore the stale response
  });

  return () => { ignore = true; };
}, [userId]);
```

Add caching, retries, and loading/error states, and this quickly grows; that's why using a data-fetching library is standard in production code.

## The Rules of Hooks

1. Call hooks only at the **top level**: not inside conditions, loops, or nested functions.
2. Call hooks only from React components and custom hooks.

The reason: React matches a component's hooks by **call order**. If the order changes between renders, the states get mixed up.

A **custom hook** is a function that uses hooks and whose name starts with `use`; it's the way to share stateful logic between components. It shares the **logic**, not the state itself: every component that uses the hook gets its own state.

## useRef

`useRef` is a box that persists between renders, and changing it **doesn't trigger a re-render**. It has two uses: accessing a DOM node (focusing, measuring) and storing values that don't affect rendering (like a timer ID). Reading or writing `ref.current` during render breaks purity; use it in effects and event handlers.

## Summary

- Render = calling the component function; the DOM is updated only in the commit phase, and only for the differences.
- A component re-renders when its state, its parent, or its context changes.
- `key` is identity: use stable IDs in lists, and change the `key` to reset state.
- State is a snapshot; if you depend on the previous value, use an updater function, and never mutate state in place.
- Effects are for synchronizing with external systems. Don't write effects for deriving values or for reacting to events.
