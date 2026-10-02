// a stream moves data piece by piece instead of loading all of it at once.
// that is what makes reading a 2GB video, piping an upload to disk or
// compressing a stream possible at all

import { Readable, Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

// here is a full 500MB file
// here is chunk 1
// here is chunk 2
// here is chunk 3
// here is chunk 4
// here is chunk 5

// memory efficient

// streams types
// readable stream - source of data
// writable stream - destination where the data is written
// transform stream - read the data, change it and pass that forward

const readableStream = Readable.from([
  "hello ",
  "from ",
  "node.js ",
  "streams",
]);

// callback(error, result)

// the transform signature is fixed by node: (chunk, encoding, callback).
// the encoding position cannot be skipped, so the unused one is prefixed
// with _ which is the convention noUnusedParameters is configured to allow.

const uppercaseTransform = new Transform({
  transform(chunk, _encoding, callback) {
    const text = chunk.toString();

    callback(null, text.toUpperCase());
  },
});

const writableStream = new Writable({
  write(chunk, _encoding, callback) {
    console.log("received chunk", chunk.toString());

    callback();
  },
});

async function main(): Promise<void> {
  try {
    await pipeline(readableStream, uppercaseTransform, writableStream);

    console.log("Stream completed");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown error";
    console.error("stream failed", msg);
  }
}

main();
