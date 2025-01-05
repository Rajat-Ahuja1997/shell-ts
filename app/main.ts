import { createInterface } from 'readline';
import * as fs from 'fs';
import { execFileSync } from 'child_process';
import * as path from 'path';

const shellCommands = [
  'exit',
  'echo',
  'type',
  'pwd',
  'cd',
  'touch',
  'ls',
  'rm',
  'history',
];

const redirectOutputs = ['>', '1>', '>>', '1>>'];

const history: string[] = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = '$ ';
rl.setPrompt(prompt);

const pathEnv = process.env.PATH;

rl.on('line', (resp) => {
  const command = resp.split(' ')[0];
  let remainingInput = resp.slice(command.length).trim();

  let args: string[] = [];
  if (remainingInput.startsWith("'")) {
    args = _getArgsInQuotes(remainingInput, 'single');
  } else if (remainingInput.startsWith('"')) {
    args = _getArgsInQuotes(remainingInput, 'double');
  } else {
    // Split on any whitespace that is unescaped
    args = remainingInput
      .split(/(?<!\\)\s+/)
      .filter(Boolean)
      .map((arg) => arg.replace(/\\(.)/g, '$1')); // Replace any backslash with the char after it
  }

  switch (command) {
    case 'echo': {
      const { files, redirect, destination } = _parseRedirect(args);
      // output is the files joined by spaces with newlines between each file
      const output = files.join(' ');
      if (redirect === '2>') {
        try {
          console.log(output);
          fs.appendFileSync(destination, '');
        } catch (e) {
          fs.appendFileSync(destination, output);
        }
      } else if (redirect && redirectOutputs.includes(redirect)) {
        fs.appendFileSync(destination, output + '\n');
      } else {
        console.log(output);
      }
      break;
    }
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
    case 'ls': {
      const dir = args[0] ? args[0] : process.cwd();
      const redirect = args[1];
      const destination = args[2];

      const error = `ls: ${dir}: No such file or directory`;
      try {
        const contents = fs.readdirSync(dir).sort();

        if (redirect && redirectOutputs.includes(redirect)) {
          fs.appendFileSync(destination, contents.join('\n'));
        } else {
          console.log(contents.join('\n'));
        }
      } catch (e) {
        if (redirect === '2>') {
          fs.appendFileSync(destination, error);
        } else {
          console.log(error);
        }
      }
      break;
    }
    case 'cat':
      const { files, redirect, destination } = _parseRedirect(args);
      const { res, errors } = _readFiles(files);

      if (redirect === '2>') {
        if (errors.length > 0) {
          fs.writeFileSync(destination, errors.join('\n'));
        }
        if (res) {
          console.log(res.trim());
        }
      } else if (redirect === '1>' || redirect === '>') {
        fs.writeFileSync(destination, res);
        if (errors.length > 0) {
          console.log(errors.join('\n'));
        }
      } else {
        if (res) {
          console.log(res.trim());
        }
        if (errors.length > 0) {
          console.log(errors.join('\n'));
        }
      }
      break;
    case 'touch':
      fs.writeFileSync(args[0], '');
      break;
    case 'rm':
      if (!args[0]) {
        console.log('rm: missing file to remove');
      } else {
        try {
          fs.unlinkSync(args[0]);
        } catch (e) {
          console.log(`rm: ${args[0]}: No such file or directory`);
        }
      }
      break;
    case 'history':
      console.log(history.join('\n'));
      break;
    case 'exit':
      if (args.length === 1 && args[0] === '0') {
        rl.close();
        process.exit(0);
      }
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
  history.push(resp);
  rl.prompt();
});

rl.prompt();

/**
 * Parse the arguments to read, redirect, and destination
 * of redirection.
 * @param args list of arguments
 * @returns object with files, redirect, and destination
 */
const _parseRedirect = (args: string[]) => {
  const redirectionIndex = args.findIndex(
    (arg) =>
      arg === '>' ||
      arg === '1>' ||
      arg === '>>' ||
      arg === '1>>' ||
      arg === '2>'
  );

  if (redirectionIndex === -1) {
    return {
      files: args,
      redirect: null,
      destination: null,
    };
  }

  return {
    files: args.slice(0, redirectionIndex),
    redirect: args[redirectionIndex],
    destination: args[redirectionIndex + 1],
  };
};

/**
 * Read a list of files and return the file output and any
 * errors that occur while reading.
 * @param files list of files to read
 * @returns object with res and errors
 */
const _readFiles = (files: string[]) => {
  let res = '';
  const errors: string[] = [];
  for (const file of files) {
    try {
      res += fs.readFileSync(file, 'utf8');
    } catch (e) {
      const err = `cat: ${file}: No such file or directory`;
      errors.push(err);
    }
  }
  return { res, errors };
};

const _getArgsInQuotes = (input: string, type: 'single' | 'double') => {
  // replace instance of two single or double quotes next to each other with empty space
  input = input.replace(/('{2}|"{2})/g, '');
  // replace double backslash with single backslash
  input = input.replace(/\\{2}/g, '\\');
  const quotedArgs: string[] = [];
  let insideQuotes = false;
  let currentArg = '';

  let nonQuotedPart = '';

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
    } else {
      nonQuotedPart += char;
    }
  }

  if (nonQuotedPart.trim()) {
    const additionalArgs = nonQuotedPart.trim().split(/\s+/).filter(Boolean);
    quotedArgs.push(...additionalArgs);
  }

  return quotedArgs;
};
