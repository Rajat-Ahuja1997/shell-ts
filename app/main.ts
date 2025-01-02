import { createInterface } from 'readline';
import * as fs from 'fs';
import { exec, execFileSync } from 'child_process';
import * as path from 'path';

const shellCommands = [
  'exit',
  'echo',
  'type',
  'pwd',
  'cd',
  'cat',
  'touch',
  'ls',
];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = '$ ';
rl.setPrompt(prompt);

const pathEnv = process.env.PATH;

rl.on('line', (resp) => {
  const command = resp.split(' ')[0];
  const remainingInput = resp.slice(command.length).trim();

  let args: string[] = [];
  if (remainingInput.startsWith("'")) {
    args = _getArgsInQuotes(remainingInput, 'single');
  } else if (remainingInput.startsWith('"')) {
    args = _getArgsInQuotes(remainingInput, 'double');
  } else {
    args = remainingInput.split(/\s+/).filter(Boolean);
  }

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
    case 'pwd':
      const workingDir = process.cwd();
      console.log(workingDir);
      break;
    case 'cd':
      if (args[0] === '~') {
        const homeDir = process.env.HOME;
        if (!homeDir) {
          console.log('cd: HOME not set');
        } else {
          process.chdir(homeDir);
        }
      } else {
        try {
          process.chdir(args[0]);
        } catch (e) {
          console.log(`cd: ${args[0]}: No such file or directory`);
        }
      }
      break;
    case 'ls':
      const contents = fs.readdirSync(process.cwd()).sort();
      console.log(contents.join('\n'));
      break;
    case 'cat':
      let res = '';
      for (const arg of args) {
        try {
          res += fs.readFileSync(arg, 'utf8');
        } catch (e) {}
      }
      console.log(res.trim());
      break;
    case 'touch':
      fs.writeFileSync(args[0], '');
      break;
    default:
      const paths = pathEnv?.split(path.delimiter) ?? [];

      for (const path of paths) {
        try {
          const contents = fs.readdirSync(path);

          if (contents.includes(command)) {
            const filePath = `${path}/${command}`;
            const output = execFileSync(filePath, args).toString().trim();
            console.log(output);
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

const _getArgsInQuotes = (input: string, type: 'single' | 'double') => {
  const quotedArgs: string[] = [];
  let insideQuotes = false;
  let currentArg = '';

  for (const char of input) {
    if (char === (type === 'single' ? "'" : '"')) {
      if (insideQuotes) {
        // we are at the end quotes, save our current arg
        quotedArgs.push(currentArg);
        currentArg = '';
      }
      insideQuotes = !insideQuotes;
    } else if (insideQuotes) {
      // build current arg
      currentArg += char;
    }
  }

  return quotedArgs;
};
