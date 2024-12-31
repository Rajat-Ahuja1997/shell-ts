import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = '$ ';
rl.setPrompt(prompt);

rl.on('line', (answer) => {
  if (answer === 'exit 0') {
    rl.close();
    process.exit(0);
  }
  console.log(`${answer}: command not found`);
  rl.prompt();
});

rl.prompt();
