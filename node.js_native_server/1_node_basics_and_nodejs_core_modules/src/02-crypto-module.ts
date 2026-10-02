import crypto from "node:crypto";

// crypto is the built-in module for anything security related:
// random ids, secure tokens, hashing, HMAC and encryption.

const requestId = crypto.randomUUID();

console.log(requestId);

// crypto.randomBytes

// password reset token
// email verification
// session secret, api keys

// 32 char string
const resetToken = crypto.randomBytes(16).toString("hex");
console.log(resetToken);

// crypto.createHash

// hello -> hash

// hash -> hello

const text = "hello node";

const hash = crypto.createHash("sha256").update(text).digest("hex");
console.log(hash);

// crypto.createHmac

// normal hash : data -> hash

// HMAC: data + secret -> signed hash

// webhook
// signed tokens

const secret = "my-super-secret-key";
const message = "user_id=1";

const signature = crypto
  .createHmac("sha256", secret)
  .update(message)
  .digest("hex");

console.log(signature);

const signatureVerify = crypto
  .createHmac("sha256", secret)
  .update(message)
  .digest("hex");

// comparing secrets with === leaks timing information.
// timingSafeEqual compares in constant time regardless of where the first
// difference is. it throws on a length mismatch, so guard that first.
const isValid =
  signature.length === signatureVerify.length &&
  crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(signatureVerify, "hex"),
  );

console.log("signature is valid and matching", isValid);
