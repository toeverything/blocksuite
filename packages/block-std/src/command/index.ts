import type { BlockStore } from '../store/index.js';

export interface CommandCtx {
  blockStore: BlockStore;
  data: Partial<BlockSuite.CommandData>;
}

export type Command<Options = void> = (
  ctx: CommandCtx,
  options?: Options
) => boolean;

type ToInnerCommand<T> = T extends Command<infer Options>
  ? InnerCommand<Options>
  : never;

type InnerCommands = {
  [Key in BlockSuite.CommandName]: ToInnerCommand<BlockSuite.Commands[Key]>;
};

type InnerCommand<Options = void> = (options?: Options) => Chain;

type InlineCommand = (fn: Command) => Chain;

type RunCommand = () => boolean;

interface Chain extends InnerCommands {
  run: RunCommand;
  inline: InlineCommand;
}

export class CommandManager {
  private _commands = new Map<string, Command>();

  constructor(public blockStore: BlockStore) {}

  private _getCommandCtx = () => {
    return {
      blockStore: this.blockStore,
      data: {},
    };
  };

  add<N extends BlockSuite.CommandName>(
    name: N,
    command: BlockSuite.Commands[N]
  ): CommandManager;
  add(name: string, command: Command) {
    this._commands.set(name, command);
    return this;
  }

  pipe = () => {
    const ctx = this._getCommandCtx();
    const queue: Array<() => boolean> = [];
    // @ts-ignore
    const mapping: Chain = {
      run: () => {
        for (const command of queue) {
          const result = command();
          if (!result) {
            return false;
          }
        }
        return true;
      },
      inline: (fn: Command) => {
        queue.push(() => {
          return fn(ctx);
        });
        return mapping;
      },
    };

    for (const [commandName, command] of this._commands.entries()) {
      const innerCommand: InnerCommand = options => {
        queue.push(() => {
          return command(ctx, options);
        });
        return mapping;
      };
      // @ts-expect-error force inject command
      mapping[commandName] = innerCommand;
    }

    return mapping;
  };
}

declare global {
  namespace BlockSuite {
    interface CommandData {}
    interface Commands {}

    type CommandName = keyof Commands;
  }
}
