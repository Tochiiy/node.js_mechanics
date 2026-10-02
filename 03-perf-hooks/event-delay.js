const { performance, monitorEventLoopDelay } = require("node:perf_hooks");

// the histogram must exist before the work it is meant to measure,
// otherwise the first block is invisible to it.
const eventLoopDelay = monitorEventLoopDelay({
  resolution: 20,
});

eventLoopDelay.enable();

function blockEventLoop(msAsInput) {
  const end = performance.now() + msAsInput;

  while (performance.now() < end) {
    // busy work on the main thread: no timer, no io callback and no
    // incoming request can run until this returns.
  }
}

const start = performance.now();
blockEventLoop(300);
const workDuration = performance.now() - start;

console.log(`Work took: ${workDuration.toFixed(2)} ms`);

setTimeout(() => {
  blockEventLoop(300);

  setTimeout(() => {
    // values are nanoseconds
    const maxDelayInMs = eventLoopDelay.max / 1e6;

    console.log(`Max event loop delay: ${maxDelayInMs.toFixed(2)} ms`);

    eventLoopDelay.disable();
  }, 50);
}, 50);