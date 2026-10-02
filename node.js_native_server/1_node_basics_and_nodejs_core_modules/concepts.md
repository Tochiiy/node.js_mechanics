# Concepts

## What Node.js is

JavaScript running outside the browser, on top of V8, with an event loop and
asynchronous I/O provided by libuv.

```bash
node file.js
```

There is no build step and no bundler. You run the file.

## npm

```bash
npm install
```

| | needed |
| --- | --- |
| `dependencies` | while the app is running |
| `devDependencies` | while developing or building |

These two are kept apart on purpose. A production install should not ship
TypeScript.

## Project structure

A folder or file holds **one** responsibility.

```text
routers/   HTTP layer only — parse the request, call a service, send a response
services/  business logic
repos/     database access
```

The mistake to avoid is a router that queries the database directly. The moment
it does, the business logic can only be reached over HTTP, and it cannot be
tested without starting a server.

## Entry points

**One root file.** It should be the only thing that knows how the pieces connect,
and it should contain no logic itself — just wiring.

```text
index.js   → imports modules, starts the server
modules/   → the actual behaviour
```

## Suggested learning order

```text
process · path · fs            core modules you use every day
event loop basics             understanding why order is what it is
callbacks · promises · async   three ways to handle the same async work
EventEmitter · Buffer          built-in abstractions you will reinvent otherwise
crypto · error handling       doing it correctly rather than quickly
streams                       the abstraction behind all Node.js I/O
─────────────────────────────────────────────────────────────────────────
worker threads                 escaping the single thread
child processes                isolation and native code
```

That last line is where the advanced material starts, and where
`node.js_native_server/` ends.