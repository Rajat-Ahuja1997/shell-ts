import { createInterface } from 'readline';
import * as fs from 'fs';
import { exec, execFileSync } from 'child_process';
import * as path from 'path';

const shellCommands = ['exit', 'echo', 'type'];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = '$ ';
rl.setPrompt(prompt);

const pathEnv = process.env.PATH;

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
      break;
    case 'type':
      if (shellCommands.includes(args[0])) {
        console.log(`${args[0]} is a shell builtin`);
      } else {
        const paths = pathEnv?.split(path.delimiter) ?? [];

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
      break;
    default:
      const paths = pathEnv?.split(path.delimiter) ?? [];

      for (const path of paths) {
        try {
          const contents = fs.readdirSync(path);

          if (contents.includes(command)) {
            const filePath = `${path}/${command}`;
            const output = execFileSync(filePath, args);
            console.log(output.toString());
            break;
          }
        } catch (e) {
          console.log(`${command}: command not found`);
        }
      }
  }
  rl.prompt();
});

rl.prompt();
