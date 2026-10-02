const { spawn } = require("node:child_process");
const path = require("node:path");
// exec -> waits and collects the complete output
// spawn -> gives us output while the process is still running

const childPath = path.join(__dirname, "spawn-child.js");

// node spawn-child.js
const child = spawn(process.execPath, [childPath]);

console.log("Child process started");

child.stdout.on("data", (data) => {
  console.log(`Received:`, data.toString().trim());
});

child.stderr.on("data", (data) => {
  console.error(`Child error:`, data.toString().trim());
});

// an unhandled 'error' event on a ChildProcess throws.
// without this a failed spawn takes the parent down.
child.on("error", (error) => {
  console.error(`Failed to start child: ${error.message}`);
});

child.on("close", (code) => {
  console.log(`Child exited with code: ${code}`);
});
