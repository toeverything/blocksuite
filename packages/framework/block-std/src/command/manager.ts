import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type {
  Chain,
  Command,
  ExecCommandResult,
  IfAllKeysOptional,
  InDataOfCommand,
  InitCommandCtx,
} from './types.js';

import { LifeCycleWatcher } from '../extension/index.js';
import { CommandIdentifier } from '../identifier.js';
import { cmdSymbol } from './consts.js';

/**
 * Command manager to manage all commands
 *
 * Commands are functions that take a context and a next function as arguments
 *
 * ```ts
 * const myCommand: Command<'count', 'count'> = (ctx, next) => {
 *  const count = ctx.count || 0;
 *
 *  const success = someOperation();
 *  if (success) {
 *    return next({ count: count + 1 });
 *  }
 *  // if the command is not successful, you can return without calling next
 *  return;
 * ```
 *
 * You should always add the command to the global interface `BlockSuite.Commands`
 * ```ts
 * declare global {
 *   namespace BlockSuite {
 *     interface Commands {
 *       'myCommand': typeof myCommand
 *     }
 *   }
 * }
 * ```
 *
 * Command input and output data can be defined in the `Command` type
 *
 * ```ts
 * // input: ctx.firstName, ctx.lastName
 * // output: ctx.fullName
 * const myCommand: Command<'firstName' | 'lastName', 'fullName'> = (ctx, next) => {
 *   const { firstName, lastName } = ctx;
 *   const fullName = `${firstName} ${lastName}`;
 *   return next({ fullName });
 * }
 *
 * declare global {
 *   namespace BlockSuite {
 *     interface CommandContext {
 *       // All command input and output data should be defined here
 *       // The keys should be optional
 *       firstName?: string;
 *       lastName?: string;
 *       fullName?: string;
 *     }
 *   }
 * }
 *
 * ```
 *
 *
 * ---
 *
 * Commands can be run in two ways:
 *
 * 1. Using `exec` method
 * `exec` is used to run a single command
 * ```ts
 * const { success, ...data } = commandManager.exec('myCommand', payload);
 * ```
 *
 * 2. Using `chain` method
 * `chain` is used to run a series of commands
 * ```ts
 * const chain = commandManager.chain();
 * const [result, data] = chain
 *   .myCommand1()
 *   .myCommand2(payload)
 *   .run();
 * ```
 *
 * ---
 *
 * Command chains will stop running if a command is not successful
 *
 * ```ts
 * const chain = commandManager.chain();
 * const [result, data] = chain
 *   .myCommand1() <-- if this fail
 *   .myCommand2(payload) <- this won't run
 *   .run();
 *
 * result <- result will be `false`
 * ```
 *
 * You can use `try` to run a series of commands and if one of them is successful, it will continue to the next command
 * ```ts
 * const chain = commandManager.chain();
 * const [result, data] = chain
 *   .try(chain => [
 *     chain.myCommand1(), <- if this fail
 *     chain.myCommand2(), <- this will run, if this success
 *     chain.myCommand3(), <- this won't run
 *   ])
 *   .run();
 * ```
 *
 * The `tryAll` method is similar to `try`, but it will run all commands even if one of them is successful
 * ```ts
 * const chain = commandManager.chain();
 * const [result, data] = chain
 *   .try(chain => [
 *     chain.myCommand1(), <- if this success
 *     chain.myCommand2(), <- this will also run
 *     chain.myCommand3(), <- so will this
 *   ])
 *   .run();
 * ```
 *
 */
export class CommandManager extends LifeCycleWatcher {
  static override readonly key = 'commandManager';

  private _commands = new Map<string, Command>();

  private _createChain = (
    methods: Record<BlockSuite.CommandName, unknown>,
    _cmds: Command[]
  ): Chain => {
    const getCommandCtx = this._getCommandCtx;
    const createChain = this._createChain;
    const chain = this.chain;

    return {
      [cmdSymbol]: _cmds,
      run: function (this: Chain) {
        let ctx = getCommandCtx();
        let success = false;
        try {
          const cmds = this[cmdSymbol];
          ctx = runCmds(ctx as BlockSuite.CommandContext, [
            ...cmds,
            (_, next) => {
              success = true;
              next();
            },
          ]);
        } catch (err) {
          console.error(err);
        }

        return [success, ctx];
      },
      with: function (this: Chain, value) {
        const cmds = this[cmdSymbol];
        return createChain(methods, [
          ...cmds,
          (_, next) => next(value),
        ]) as never;
      },
      inline: function (this: Chain, command) {
        const cmds = this[cmdSymbol];
        return createChain(methods, [...cmds, command]) as never;
      },
      try: function (this: Chain, fn) {
        const cmds = this[cmdSymbol];
        return createChain(methods, [
          ...cmds,
          (beforeCtx, next) => {
            let ctx = beforeCtx;
            const chains = fn(chain());

            chains.some(chain => {
              // inject ctx in the beginning
              chain[cmdSymbol] = [
                (_, next) => {
                  next(ctx);
                },
                ...chain[cmdSymbol],
              ];

              const [success] = chain
                .inline((branchCtx, next) => {
                  ctx = { ...ctx, ...branchCtx };
                  next();
                })
                .run();
              if (success) {
                next(ctx);
                return true;
              }
              return false;
            });
          },
        ]) as never;
      },
      tryAll: function (this: Chain, fn) {
        const cmds = this[cmdSymbol];
        return createChain(methods, [
          ...cmds,
          (beforeCtx, next) => {
            let ctx = beforeCtx;
            const chains = fn(chain());

            let allFail = true;
            chains.forEach(chain => {
              // inject ctx in the beginning
              chain[cmdSymbol] = [
                (_, next) => {
                  next(ctx);
                },
                ...chain[cmdSymbol],
              ];

              const [success] = chain
                .inline((branchCtx, next) => {
                  ctx = { ...ctx, ...branchCtx };
                  next();
                })
                .run();
              if (success) {
                allFail = false;
              }
            });
            if (!allFail) {
              next(ctx);
            }
          },
        ]) as never;
      },
      ...methods,
    } as Chain;
  };

  private _getCommandCtx = (): InitCommandCtx => {
    return {
      std: this.std,
    };
  };

  /**
   * Create a chain to run a series of commands
   * ```ts
   * const chain = commandManager.chain();
   * const [result, data] = chain
   *   .myCommand1()
   *   .myCommand2(payload)
   *   .run();
   * ```
   * @returns [success, data] - success is a boolean to indicate if the chain is successful,
   *   data is the final context after running the chain
   */
  chain = (): Chain<InitCommandCtx> => {
    const methods = {} as Record<
      string,
      (data: Record<string, unknown>) => Chain
    >;
    const createChain = this._createChain;
    for (const [name, command] of this._commands.entries()) {
      methods[name] = function (
        this: { [cmdSymbol]: Command[] },
        data: Record<string, unknown>
      ) {
        const cmds = this[cmdSymbol];
        return createChain(methods, [
          ...cmds,
          (ctx, next) => command({ ...ctx, ...data }, next),
        ]);
      };
    }

    return createChain(methods, []) as never;
  };

  /**
   * Register a command to the command manager
   * @param name
   * @param command
   * Make sure to also add the command to the global interface `BlockSuite.Commands`
   * ```ts
   * const myCommand: Command = (ctx, next) => {
   *   // do something
   * }
   *
   * declare global {
   *   namespace BlockSuite {
   *     interface Commands {
   *       'myCommand': typeof myCommand
   *     }
   *   }
   * }
   * ```
   */
  add<N extends BlockSuite.CommandName>(
    name: N,
    command: BlockSuite.Commands[N]
  ): CommandManager;

  add(name: string, command: Command) {
    this._commands.set(name, command);
    return this;
  }

  override created() {
    const add = this.add.bind(this);
    this.std.provider.getAll(CommandIdentifier).forEach((command, key) => {
      add(key as keyof BlockSuite.Commands, command);
    });
  }

  /**
   * Execute a registered command by name
   * @param command
   * @param payloads
   * ```ts
   * const { success, ...data } = commandManager.exec('myCommand', { data: 'data' });
   * ```
   * @returns { success, ...data } - success is a boolean to indicate if the command is successful,
   *  data is the final context after running the command
   */
  exec<K extends keyof BlockSuite.Commands>(
    command: K,
    ...payloads: IfAllKeysOptional<
      Omit<InDataOfCommand<BlockSuite.Commands[K]>, keyof InitCommandCtx>,
      [
        inData: void | Omit<
          InDataOfCommand<BlockSuite.Commands[K]>,
          keyof InitCommandCtx
        >,
      ],
      [
        inData: Omit<
          InDataOfCommand<BlockSuite.Commands[K]>,
          keyof InitCommandCtx
        >,
      ]
    >
  ): ExecCommandResult<K> & { success: boolean } {
    const cmdFunc = this._commands.get(command);

    if (!cmdFunc) {
      throw new BlockSuiteError(
        ErrorCode.CommandError,
        `The command "${command}" not found`
      );
    }

    const inData = payloads[0];
    const ctx = {
      ...this._getCommandCtx(),
      ...inData,
    };

    let execResult = {
      success: false,
    } as ExecCommandResult<K> & { success: boolean };

    cmdFunc(ctx, result => {
      // @ts-ignore
      execResult = { ...result, success: true };
    });

    return execResult;
  }
}

function runCmds(ctx: BlockSuite.CommandContext, [cmd, ...rest]: Command[]) {
  let _ctx = ctx;
  if (cmd) {
    cmd(ctx, data => {
      _ctx = runCmds({ ...ctx, ...data }, rest);
    });
  }
  return _ctx;
}
