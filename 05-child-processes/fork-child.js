process.on("message", (messageDateReceived) => {
  console.log("Child message", messageDateReceived);

  const result = messageDateReceived.number * 23;

  process.send({
    result,
  });

  process.disconnect();
});
