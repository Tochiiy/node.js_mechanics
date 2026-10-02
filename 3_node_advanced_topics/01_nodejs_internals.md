# Node.js Internals

Node.js is not just V8. It is four layers stacked on top of each other, and
knowing which layer a problem lives in is most of the diagnosis.

```text
your application code
        |
   node: core APIs        fs · http · path · stream · buffer · process · timers
        |
    C++ bindings          the bridge between JS and native code
        |
   +----+----------------+
   |                     |
 V8 engine             libuv
 parse · compile      event loop
 call stack            thread pool
 heap · GC             timers · async I/O
   |                     |
   +----------+----------+
              |
        operating system
```

## The JavaScript thread

Application JavaScript runs on **one** thread. Not one per request, not one per
connection. One. This single fact explains most Node.js performance work.

## V8 engine

- parses JavaScript and produces bytecode
- executes the bytecode, manages the call stack
- owns the heap and runs garbage collection

V8 is fast, but it knows nothing about your filesystem, sockets or timers.

## Core APIs

`fs`, `http`, `path`, `stream`, `buffer`, `process`, `timers`.

Some of these are written in JavaScript on top of other primitives. `http` and
`stream` mostly are — which is why they behave the way they do.

## C++ bindings

Connect the JavaScript-facing APIs to native functionality. This is where JS
reaches libuv, the OS, and native addons.

## libuv

A C library that gives Node a consistent event loop across every operating
system. libuv provides what V8 does not:

- the event loop
- the shared worker thread pool
- timers
- asynchronous I/O

## The operating system

The real work: reading files, writing files, moving packets, tracking time.

## Why the split matters

The JS thread never blocks on I/O. When a request needs the filesystem, the
call is handed to libuv, which hands it to the OS, and control returns to the
event loop immediately. The JavaScript resumes only when there is a result to
process.

That is the whole design. Every performance problem in Node.js is some version
of *something made the JS thread wait anyway*.