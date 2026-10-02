# The cluster module

A normal Node.js process has one main JavaScript thread. The `cluster` module
lets you run several Node.js processes and share one listening port.

```text
              port 3000
                   |
         +---------+---------+
         |         |         |
      worker 0  worker 1  worker 2
         |         |         |
      own V8    own V8    own V8
      own loop  own loop  own loop
      own heap  own heap  own heap
```

Every worker is a full, independent Node.js runtime:

- its own V8 engine
- its own event loop
- its own main JavaScript thread
- its own memory

The primary process owns the port. Incoming connections are distributed across
the workers, and any worker can die without taking the others down.

## When it is worth it

`cluster` helps when your process is CPU-bound and you have multiple cores
available. If you are waiting on I/O, a single Node.js process already handles
thousands of concurrent connections — adding workers buys you nothing and costs
you shared-state complexity.

## Why it is usually not the answer

Because workers do not share memory. Session state, caches and in-process
databases all have to move to Redis or a database, which adds a network hop to
what used to be a variable lookup.

If the goal is "do not block the event loop", the cheaper fix is usually a
worker thread — same process, shared heap, no clustering. See
`04-worker-threads/server.js` for the measurable difference.

`cluster` also behaves differently on Windows, which is worth knowing before
you deploy it.