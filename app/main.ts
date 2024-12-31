import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = '$ ';
rl.setPrompt(prompt);

rl.on('line', (resp) => {
  const [command, ...args] = resp.split(' ');
  switch (command) {
    case 'exit':
      if (args.length === 1 && args[0] === '0') {
        rl.close();
        process.exit(0);
      }
      break;
    case 'echo':
      console.log(args.join(' '));
      rl.prompt();
      break;
    default:
      console.log(`${resp}: command not found`);
      rl.prompt();
  }
});

rl.prompt();
