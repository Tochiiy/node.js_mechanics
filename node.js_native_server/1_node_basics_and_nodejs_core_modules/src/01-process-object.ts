// process.env holds environment variables (ports, secrets, feature flags)
// process.argv holds the CLI arguments after the script name

import process from "node:process";

// process.env values are always string or undefined, so convert before use:
//   Number(process.env.PORT ?? 3000)
// process.argv holds [execPath, scriptPath, ...args]

const command = process.argv[2] ?? "start";
const shouldFail = process.argv.includes("--fail");
const shouldCrash = process.argv.includes("--crash");

// synchronous only. node is already shutting down, so anything async here
// would never finish
process.on("exit", (code) => {
  console.log(`Process finished with exit code ${code}`);
});

// a signal that skipped cleanup handlers ran, unlike a normal exit.
// use it when you need to dump a core file.
process.on("SIGTERM", () => {
  console.log("Process finished with exit code: 143");
  process.exit(143);
});

function runApp(): void {
  console.log({ command });

  // a controlled failure: the exit handler still runs
  if (shouldFail) {
    console.error("Manual failure triggered with --fail flag");
    process.exit(1);
  }

  // an uncaught throw: node prints the stack and exits with code 1
  if (shouldCrash) {
    throw new Error("Manual crash triggered with --crash flag");
  }
}

runApp();
