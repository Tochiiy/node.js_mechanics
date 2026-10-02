# libuv

libuv is the C library Node.js uses to handle asynchronous operations across
differing operating systems.

It provides the three things V8 deliberately does not:

- **the event loop** — the loop that decides what JavaScript runs next
- **a shared worker thread pool** — for work that is CPU-bound or blocking
- **timers and async I/O** — readiness notification for files and sockets

Node.js needs this extra layer because V8 has no concept of any of it.

## Event loop phases

```text
timers           → is any timer ready?
pending callbacks→ deferred I/O callbacks
idle / prepare   → internal housekeeping
poll             → incoming socket or file activity
check            → setImmediate callbacks
close callbacks  → resources being closed
```

Then the loop repeats. `01-event-loop-order/execution-order.js` demonstrates
the order in which these actually fire relative to `process.nextTick` and
promise microtasks.

## Timers

libuv tracks the timers and tells Node when one becomes eligible to run.

A 5 second delay does **not** mean JavaScript sleeps for 5 seconds. The runtime
records the timer, keeps processing other work, and calls back later if the
thread is free. If the event loop is blocked, the callback runs late — this is
what `03-perf-hooks/event-delay.js` measures.

## Thread pool

libuv keeps one shared worker thread pool. It is used only by operations that
cannot be handled efficiently by the event loop:

- most filesystem operations
- cryptographic operations
- compression (`zlib`)

**The default width is 4**, and libuv reads `UV_THREADPOOL_SIZE` exactly once —
when the pool is first created. Set it after the first `fs` or `crypto` call and
your assignment is silently ignored.

```bash
npm run 02:pool1   # 8 pbkdf2 tasks through 1 thread
npm run 02:pool8   # 8 pbkdf2 tasks through 8 threads
```

Same total work. Wall clock scales inversely with the pool width, which is why
four simultaneous slow requests can look like a server that only handles one.

## What libuv does not help with

libuv can keep the event loop free while I/O waits. It cannot make JavaScript
itself run in parallel. That is a different problem, and it needs a worker
thread or a child process.