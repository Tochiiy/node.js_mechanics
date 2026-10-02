// EventEmitter is Node's built-in publish/subscribe. an emitter emits a named
// event, any number of listeners react to it

import EventEmitter from "node:events";

// .on()   register a listener that runs every time
// .once() register a listener that runs only the first time
// .emit() trigger the event and call every listener

const appEvents = new EventEmitter();

type UserRegisterPayload = {
  id: number;
  email: string;
};

appEvents.on("user:registered", (user: UserRegisterPayload) => {
  console.log(`email listener: welcome email sent to this user ${user.email}`);
});

appEvents.on("user:registered", (user: UserRegisterPayload) => {
  console.log(`log listener: user ${user.id} and email is ${user.email}`);
});

appEvents.once("app.started", () => {
  console.log("once listener: app started");
});

function registerUser(): void {
  const user = {
    id: 1,
    email: "sangam@gmail.com",
  };

  console.log("user saved");

  appEvents.emit("user:registered", user);

  console.log("register user: event listerns completed");
}

appEvents.emit("app.started");
appEvents.emit("app.started");

registerUser();
