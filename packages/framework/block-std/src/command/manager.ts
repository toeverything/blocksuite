import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type {
  Chain,
  Command,
  ExecCommandResult,
  IfAllKeysOptional,
  InDataOfCommand,
  InitCommandCtx,
} from './types.js';

import { cmdSymbol } from './consts.js';

export class CommandManager {
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

  constructor(public std: BlockSuite.Std) {}
  add<N extends BlockSuite.CommandName>(
    name: N,
    command: BlockSuite.Commands[N]
  ): CommandManager;

  add(name: string, command: Command) {
    this._commands.set(name, command);
    return this;
  }

  exec<K extends keyof BlockSuite.Commands>(
    command: K,
    ...args: IfAllKeysOptional<
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
  ): ExecCommandResult<K> {
    const cmdFunc = this._commands.get(command);

    if (!cmdFunc) {
      throw new BlockSuiteError(
        ErrorCode.CommandError,
        `The command "${command}" not found`
      );
    }

    const inData = args[0];
    const ctx = {
      ...this._getCommandCtx(),
      ...inData,
    };

    let execResult: ExecCommandResult<K> = {} as ExecCommandResult<K>;

    cmdFunc(ctx, result => {
      // @ts-ignore
      execResult = result ?? {};
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
