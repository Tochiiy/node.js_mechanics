// a Buffer is raw binary data. strings are human-readable text, buffers are
// bytes - and almost every binary format (images, video, pdf, crypto output)
// arrives as one

const textBuffer = Buffer.from("Node");

console.log(textBuffer);

// N - 4e
// o - 6f
// d - 64

console.log(textBuffer.toString("utf-8"));

const engBuffer = Buffer.from("Hello");
console.log(engBuffer.length);

// .alloc

const fixedBuffer = Buffer.alloc(5);

console.log("empty fixed buffer", fixedBuffer);

fixedBuffer.write("API");

console.log("fixed buffer after write", fixedBuffer);
console.log("fixed buffer as text", fixedBuffer.toString("utf-8"));

// chunks

const chunks = [Buffer.from("Hello "), Buffer.from("Node "), Buffer.from("JS")];

const combineBuffer = Buffer.concat(chunks);

console.log(combineBuffer, combineBuffer.toString("utf-8"));
