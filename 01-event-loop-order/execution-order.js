const { readFile } = require("node:fs");

console.log("[1] sync: script starts");

setTimeout(() => {
  console.log("[timer] top level settimeout(0)");
}, 0);

setImmediate(() => {
  console.log("[immediate] top level setImmediate");
});

// process.nextTick runs on the main thread but ahead of the event loop.
// nextTick queue -> microtask queue -> timers / immediates / io callbacks

process.nextTick(() => {
  console.log("[2] process.nextTick");
});

Promise.resolve().then(() => {
  console.log("[4] Promise.then");
});

process.nextTick(() => {
  console.log("[3] second process.nextTick");

  Promise.resolve().then(() => {
    console.log("[5] Promise queued inside nextTick");
  });
});

console.log("[6] sync: rest of the script");

readFile(__filename, () => {
  console.log("[I/O] fs.readFile callback");

  setTimeout(() => {
    console.log("[I/O timer] setTimeout(0)");
  }, 0);

  setImmediate(() => {
    console.log("[immediate inside I/O] setImmediate");
  });
});

// note the output: nextTick [2] and [3] both run before Promise.then [4],
// even though the promise was queued first. the nextTick queue is drained
// completely before the microtask queue is touched.