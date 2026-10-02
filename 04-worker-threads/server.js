const { createServer } = require("node:http");
const { Worker } = require("node:worker_threads");
const path = require("node:path");

// worker threads run js in parallel on the same process.
// each worker gets its own v8 isolate and its own event loop,
// but they share the process heap and the libuv thread pool.
//
// use them to keep cpu work off the main thread so the event loop stays free
// to accept requests and run timers.

const ITERATIONS = 100000000;

function doSomeCpuHeavyWork(iterationsAsInput) {
  let result = 0;

  for (let i = 0; i < iterationsAsInput; i += 1) {
    result += Math.sqrt(i) * Math.sin(i);
  }

  return result;
}

function sendJson(res, statusCode, body) {
  if (res.writableEnded) {
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = req.url;

  if (url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  // baseline: the main thread is blocked for the whole calculation,
  // so /health will not answer until this returns.
  if (url === "/block") {
    console.log("Starting CPU work on MAIN thread...");

    const startedAt = Date.now();
    const result = doSomeCpuHeavyWork(ITERATIONS);

    sendJson(res, 200, {
      result,
      duration: Date.now() - startedAt,
      ranOn: "main thread",
    });
    return;
  }

  if (url === "/worker") {
    console.log("Started CPU work on WORKER THREAD...");

    const startedAt = Date.now();
    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: { iterations: ITERATIONS },
    });

    const cleanup = () => {
      void worker.terminate();
    };

    worker.on("message", (result) => {
      sendJson(res, 200, {
        result,
        duration: Date.now() - startedAt,
        ranOn: "worker thread",
      });
      cleanup();
    });

    worker.on("error", (error) => {
      console.error("Worker error:", error.message);
      sendJson(res, 500, { error: error.message });
      cleanup();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with code ${code}`);
      }
    });

    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(3070, () => {
  console.log("Server is running on port 3070");
  console.log("GET /health  - liveness check");
  console.log("GET /block   - cpu work on the main thread");
  console.log("GET /worker  - same work on a worker thread");
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
  process.exit(1);
});