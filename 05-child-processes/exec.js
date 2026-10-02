const { exec } = require("node:child_process");

// node js application is actually a process
// can start another os system process

// command -> shell runs it -> outout is collected -> callback receives output

console.log("Starting child process");

exec("node --version", (error, stdout, stderr) => {
  if (error) {
    console.error("Command failed", error.message);
    return;
  }

  console.log("Child output", stdout.trim());

  if (stderr) {
    console.error("Child error", stderr.trim());
  }
});

console.log("Main javascript continues");
