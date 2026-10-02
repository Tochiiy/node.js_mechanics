const { fork } = require("node:child_process");
const path = require("node:path");
// IPC
// parent node process -> message -> child node process -> result -> parent node process

const childPath = path.join(__dirname, "fork-child.js");
const child = fork(childPath);

console.log(`Parent started child`);

child.send({
  number: 10,
});

child.on("message", (messageReceivedFromChildProcess) => {
  console.log("Parent received", messageReceivedFromChildProcess);
});

child.on("error", (error) => {
  console.error(`Failed to start child: ${error.message}`);
});

child.on("exit", (code) => {
  console.log(`Child exited with code: ${code}`);
});
