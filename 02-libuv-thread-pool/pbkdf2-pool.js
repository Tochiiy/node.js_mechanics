const requestedPoolSize = Number(process.argv[2] ?? 4);

// libuv reads UV_THREADPOOL_SIZE once, when the pool is first created,
// so this must be assigned before any fs/crypto/dns/zlib work is scheduled.
const poolSize =
  Number.isInteger(requestedPoolSize) && requestedPoolSize > 0
    ? requestedPoolSize
    : 4;

process.env.UV_THREADPOOL_SIZE = String(poolSize);

const { pbkdf2 } = require("node:crypto");

const taskCount = 8;

const iterations = 400000;

const startedAt = Date.now();

console.log(`thread pool size: ${poolSize}`);
console.log(`Scheduling ${taskCount} PBKDF2 tasks...`);

function elapseMs() {
  return Date.now() - startedAt;
}

// node does not do this:
//   start task 1
//   wait for task 1
//   start task 2
//   wait for task 2
//
// it does this:
//   submit 1, submit 2, ... submit 8
//
// all 8 are queued immediately and drained poolSize at a time, so wall clock
// scales inversely with the pool width

for (let id = 1; id <= taskCount; id += 1) {
  pbkdf2(
    `password-${id}`,
    `salt-${id}`,
    iterations,
    32,
    "sha256",
    (error) => {
      if (error) {
        console.error(`Task ${id} failed`, error.message);
      }

      console.log(`Task ${id} finished at ${elapseMs()} ms`);
    },
  );
}

console.log(`JS finished scheduling everything at ${elapseMs()} ms`);

// pbkdf2Sync blocks the main thread, pbkdf2 offloads to the pool.