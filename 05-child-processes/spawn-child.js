let count = 1;

const timer = setInterval(() => {
  console.log(`Child message ${count}`);

  count++;

  if (count > 3) {
    clearInterval(timer);
  }
}, 500);
