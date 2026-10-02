import http, { IncomingMessage, ServerResponse } from "node:http";

const PORT = 5002;

type CreateUserBody = {
  name?: string;
  email?: string;
};

// a json body should be small. without a ceiling chunks[] grows until the
// process runs out of heap, so one request can take the whole server down.
const MAX_BODY_BYTES = 64 * 1024;

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    const method = req.method ?? "GET";
    const requestUrl = new URL(req.url ?? "/", `http:${req.headers.host}`);
    const pathName = requestUrl.pathname;
    res.setHeader("Content-Type", "text/plain");

    if (method === "POST" && pathName === "/users") {
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      let rejected = false;

// respond once, then keep draining.
// req.destroy() would tear the socket down before the response flushed,
// leaving the client with a reset instead of a readable 413.
const reject = (statusCode: number, message: string): void => {
        if (rejected) {
          return;
        }

        rejected = true;
        chunks.length = 0;

        res.statusCode = statusCode;
        res.end(message);
      };

      // content-length arrives up front so we can refuse without reading a
      // byte, but it is only a hint - the running total is the real limit.
      const declaredLength = Number(req.headers["content-length"] ?? 0);

      if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
        reject(413, `body too large, limit is ${MAX_BODY_BYTES} bytes`);
        return;
      }

      // data event is going to run every time node receives a new body chunk
      req.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;

        if (totalBytes > MAX_BODY_BYTES) {
          reject(413, `body too large, limit is ${MAX_BODY_BYTES} bytes`);
          return;
        }

        // past the cap we still count bytes but never store them
        if (rejected) {
          return;
        }

        chunks.push(chunk);
      });

      req.on("end", () => {
        if (rejected) {
          return;
        }

        try {
          const rawBody = Buffer.concat(chunks).toString("utf-8");

          if (!rawBody) {
            res.statusCode = 400;
            res.end("req body is required");
            return;
          }

          const body = JSON.parse(rawBody) as CreateUserBody;

          if (!body.name || !body.email) {
            res.statusCode = 400;
            res.end("both name and email is required");
            return;
          }

          res.statusCode = 201;
          res.end(`User created ${body.name} and ${body.email}`);
        } catch {
          res.statusCode = 400;
          res.end("invalid json body");
        }
      });

      req.on("error", () => {
        reject(500, "failed to read request body");
      });
      return;
    }

    res.statusCode = 404;
    res.end("route not found");
  },
);

server.listen(PORT, () => {
  console.log(`server is now running on port ${PORT}`);
});
