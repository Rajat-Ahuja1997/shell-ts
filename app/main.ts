import { createInterface } from 'readline';
import * as fs from 'fs';

const shellCommands = ['exit', 'echo', 'type'];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = '$ ';
rl.setPrompt(prompt);

const path = process.env.PATH;

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
    case 'type':
      if (shellCommands.includes(args[0])) {
        console.log(`${args[0]} is a shell builtin`);
      } else {
        const paths = path?.split(':') ?? [];

        const found = paths.find((path) => {
          try {
            const contents = fs.readdirSync(path);
            return contents.includes(args[0]);
          } catch (e) {
            return false;
          }
        });

        if (found) {
          console.log(`${args[0]} is ${found}/${args[0]}`);
        } else {
          console.log(`${args[0]} not found`);
        }
      }
      rl.prompt();
      break;
    default:
      console.log(`${resp}: command not found`);
      rl.prompt();
  }
});

rl.prompt();
