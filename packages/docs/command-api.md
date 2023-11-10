# Command API

Commands are the actions that can be triggered by the user.
With the command API, you can define chainable commands and execute them.

## Command Chain

Commands are executed in a chain, and each command can decide whether to continue the chain or not.

```ts
std.command.pipe().command1().command2().command3().run();
```

You will need to call `pipe()` to start a new chain.
Then, you can call any command defined in the `Commands` interface.
And finally, call `run()` to execute the chain.

### Try

If a command fails, the chain will be interrupted.
However, you can use `try()` to call a list of commands until one of them succeeds.

```ts
std.command
  .pipe()
  .try(cmd => [cmd.command1(), cmd.command2()])
  .command3()
  .run();
```

In this chain, `command3` will be executed only if `command1` or `command2` succeeds.

## Writing Commands

Commands are defined as pure functions.

```ts
import type { Command } from '@blocksuite/block-std';
export const myCommand: Command = (ctx, next) => {
  if (fail) {
    return;
  }

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      my: typeof myCommand;
    }
  }
}

// Add the command to the std command list
std.command.add('my', myCommand);

// You can call it with
std.command.pipe().my().run();
```

Only when the command calls `next()`, the next command in the chain will be executed.

## Command Context

When a list of commands are executed, they share a context object.
This object is standalone for each command execution, and you can use it to store temporary data.

```ts
import type { Command } from '@blocksuite/block-std';
export const myCommand: Command<never, 'myCommandData'> = (ctx, next) => {
  if (fail) {
    return;
  }

  return next({ myCommandData: 'hello' });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      myCommandData: string;
    }

    interface Commands {
      myCommand: typeof myCommand;
    }
  }
}
```

Then, commands executed after `myCommand` can access the data:

```ts
export const myCommand: Command<'myCommandData'> = (ctx, next) => {
  const data = ctx.myCommandData;
  console.log(data);
};
```

## Command Options

You can pass options to a command when calling it:

```ts
import type { Command } from '@blocksuite/block-std';

type MyCommandOptions = {
  configA: number;
  configB: string;
};
export const myCommand: Command<never, never, MyCommandOptions> = (
  ctx,
  next
) => {
  const { configA, configB } = ctx;

  if (fail) {
    return;
  }

  return next();
};

// You can call it with
std.command.pipe().my({ configA: 0, configB: 'hello' }).run();
```

Please notice that commands take only one argument,
so you need to wrap the options in an object if you want to pass multiple options.

## Inline Command

You can also use inline command for some temporary commands.

```ts
std.command
  .pipe()
  .inline((ctx, next) => {
    // ...
    return next();
  })
  .run();
```
