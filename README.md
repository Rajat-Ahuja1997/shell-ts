# TypeScript Shell Implementation

A lightweight shell implementation written in TypeScript that supports basic Unix-like commands and file operations.

## Prerequisites

- [Bun](https://bun.sh/) runtime environment
- Node.js development environment

## Features

- Basic shell commands (`cd`, `pwd`, `ls`, etc.)
- File operations (`touch`, `rm`, `cp`, `mkdir`, `rmdir`)
- Input/Output redirection (`>`, `>>`, `1>`, `1>>`, `2>`, `2>>`)
- Command history
- Support for quoted arguments (both single and double quotes)
- Path resolution for external commands

### Supported Commands

- `echo` - Display messages or file contents
- `type` - Display information about command type
- `pwd` - Print working directory
- `cd` - Change directory
- `ls` - List directory contents
- `cat` - Concatenate and display file contents
- `touch` - Create empty files
- `rm` - Remove files
- `cp` - Copy files
- `mkdir` - Create directories
- `rmdir` - Remove directories
- `history` - Show command history
- `exit` - Exit the shell

## Installation

1. Clone the repository:

```
git clone https://github.com/your-username/your-shell-repo.git
```

2. Install dependencies:

```
bun install
```

3. Run the shell:

```
bun run dev
```
