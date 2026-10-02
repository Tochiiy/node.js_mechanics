// receiving a file upload
//
// the request body is a readable stream, so a large file never needs to sit
// in the heap. pipeline(req, limiter, createWriteStream(path)) keeps only one
// chunk in memory at a time and handles backpressure, cleanup and errors.
//
// this is the approach to use for video, audio and large images.
// a browser can send the file three ways:
//
//   raw body         POST the File object directly, streamed straight to disk
//   multipart        what a bare <form> sends, must be buffered to parse
//   base64 in json   ~33% larger and fully buffered, avoid
//
// raw is the default below. the client sends it with:
//   fetch(url, { method: 'POST', headers: { 'X-File-Name': file.name },
//                body: file })

import http, { IncomingMessage, ServerResponse } from "node:http";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const PORT = 5004;

const PROJECT_ROOT = path.join(import.meta.dirname, "..");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "uploads");

// a request body cap is not optional. without one a single upload can
// exhaust the heap and take the process down.
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  if (res.writableEnded) {
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function sendText(res: ServerResponse, statusCode: number, body: string): void {
  if (res.writableEnded) {
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain");
  res.end(body);
}

// the filename is attacker controlled. path.basename removes every directory
// component so a traversal attempt collapses to a bare filename, and the
// containment check is the second line of defence.
function resolveSafeName(rawName: string): string | null {
  let decoded = rawName;

  try {
    decoded = decodeURIComponent(rawName);
  } catch {
    return null;
  }

  const cleaned = path.basename(decoded).replace(/[^\w.\- ]/g, "_");

  if (cleaned === "" || cleaned === "." || cleaned === "..") {
    return null;
  }

  const target = path.resolve(UPLOAD_DIR, cleaned);

  if (!target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return null;
  }

  return target;
}

// a Transform that counts bytes and fails the stream past the limit.
// failing it lets pipeline() tear everything down in one place.
function createSizeLimiter(limitBytes: number): Transform {
  let bytes = 0;

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;

      if (bytes > limitBytes) {
        callback(new Error(`upload exceeds ${limitBytes} bytes`));
        return;
      }

      callback(null, chunk);
    },
  });
}

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
  const declared = Number(req.headers["content-length"] ?? 0);

  // content-length arrives up front, so reject before reading anything.
  // it is only a hint though - the limiter below is the real boundary.
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    sendText(res, 413, `file too large, limit is ${MAX_UPLOAD_BYTES} bytes`);
    return;
  }

  const safeName = resolveSafeName(String(req.headers["x-file-name"] ?? ""));

  if (safeName === null) {
    sendText(res, 400, "invalid or missing X-File-Name");
    return;
  }

  // a uuid keeps two uploads of the same filename from clobbering each other
  const storedName = `${randomUUID()}${path.extname(safeName)}`;
  const target = path.join(UPLOAD_DIR, storedName);

  try {
    await pipeline(req, createSizeLimiter(MAX_UPLOAD_BYTES), createWriteStream(target));

    const { size } = await stat(target);

    sendJson(res, 201, { storedName, bytes: size });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    // the upload was cut short, so remove the partial file
    await unlink(target).catch(() => undefined);

    sendText(res, message.includes("exceeds") ? 413 : 500, message);
  }
}

async function listUploads(res: ServerResponse) {
  const entries = await readdir(UPLOAD_DIR, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => ({
        storedName: entry.name,
        bytes: (await stat(path.join(UPLOAD_DIR, entry.name))).size,
      })),
  );

  sendJson(res, 200, { count: files.length, files });
}

const server = http.createServer((req, res) => {
  void (async () => {
    try {
      const method = req.method ?? "GET";
      const route = new URL(req.url ?? "/", `http://localhost:${PORT}`).pathname;

      if (method === "POST" && route === "/upload") {
        await handleUpload(req, res);
        return;
      }

      if (method === "GET" && route === "/uploads") {
        await listUploads(res);
        return;
      }

      sendText(res, 404, "route not found");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      sendText(res, 500, message);
    }
  })();
});

await mkdir(UPLOAD_DIR, { recursive: true });

server.listen(PORT, () => {
  console.log(`Upload server on http://localhost:${PORT}`);
  console.log(`POST /upload   stream a file to disk`);
  console.log(`GET  /uploads  list stored files`);
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
  process.exit(1);
});