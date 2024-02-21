// type A = {};
// type B = { prop?: string };
// type C = { prop: string };
// type TestA = MakeOptionalIfEmpty<A>;  // void | {}
// type TestB = MakeOptionalIfEmpty<B>;  // void | { prop?: string }
// type TestC = MakeOptionalIfEmpty<C>;  // { prop: string }
type IfAllKeysOptional<T, Yes, No> =
  Partial<T> extends T ? (T extends Partial<T> ? Yes : No) : No;
type MakeOptionalIfEmpty<T> = IfAllKeysOptional<T, void | T, T>;

export interface InitCommandCtx {
  std: BlockSuite.Std;
}

export type CommandKeyToData<K extends BlockSuite.CommandDataName> = Pick<
  BlockSuite.CommandContext,
  K
>;
export type Command<
  In extends BlockSuite.CommandDataName = never,
  Out extends BlockSuite.CommandDataName = never,
  // eslint-disable-next-line @typescript-eslint/ban-types
  InData extends object = {},
> = (
  ctx: CommandKeyToData<In> & InitCommandCtx & InData,
  next: (ctx?: CommandKeyToData<Out>) => void
) => void;
type Omit1<A, B> = [keyof Omit<A, keyof B>] extends [never]
  ? void
  : Omit<A, keyof B>;
type InDataOfCommand<C> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends Command<infer K, any, infer R> ? CommandKeyToData<K> & R : never;
type OutDataOfCommand<C> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends Command<any, infer K, any> ? CommandKeyToData<K> : never;
// eslint-disable-next-line @typescript-eslint/ban-types
type CommonMethods<In extends object = {}> = {
  run(): [
    result: boolean,
    ctx: CommandKeyToData<Extract<keyof In, BlockSuite.CommandDataName>>,
  ];
  with<T extends Partial<BlockSuite.CommandContext>>(value: T): Chain<In & T>;
  inline: <InlineOut extends BlockSuite.CommandDataName = never>(
    command: Command<Extract<keyof In, BlockSuite.CommandDataName>, InlineOut>
  ) => Chain<In & CommandKeyToData<InlineOut>>;
  try: <InlineOut extends BlockSuite.CommandDataName = never>(
    fn: (chain: Chain<In>) => Chain<In & CommandKeyToData<InlineOut>>[]
  ) => Chain<In & CommandKeyToData<InlineOut>>;
  tryAll: <InlineOut extends BlockSuite.CommandDataName = never>(
    fn: (chain: Chain<In>) => Chain<In & CommandKeyToData<InlineOut>>[]
  ) => Chain<In & CommandKeyToData<InlineOut>>;
};
const cmdSymbol = Symbol('cmds');
type Cmds = {
  [cmdSymbol]: Command[];
};
// eslint-disable-next-line @typescript-eslint/ban-types
export type Chain<In extends object = {}> = CommonMethods<In> & {
  [K in keyof BlockSuite.Commands]: (
    data: MakeOptionalIfEmpty<
      Omit1<InDataOfCommand<BlockSuite.Commands[K]>, In>
    >
  ) => Chain<In & OutDataOfCommand<BlockSuite.Commands[K]>>;
} & Cmds;

export class CommandManager {
  private _commands = new Map<string, Command>();

  constructor(public std: BlockSuite.Std) {}

  private _getCommandCtx = (): InitCommandCtx => {
    return {
      std: this.std,
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

  createChain = (
    methods: Record<BlockSuite.CommandName, unknown>,
    _cmds: Command[]
  ): Chain => {
    const getCommandCtx = this._getCommandCtx;
    const createChain = this.createChain;
    const pipe = this.pipe;
    const runCmds = (
      ctx: BlockSuite.CommandContext,
      [cmd, ...rest]: Command[]
    ) => {
      let _ctx = ctx;
      if (cmd) {
        cmd(ctx, data => {
          _ctx = runCmds({ ...ctx, ...data }, rest);
        });
      }
      return _ctx;
    };

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
            const chains = fn(pipe());

            for (const chain of chains) {
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
                break;
              }
            }
          },
        ]) as never;
      },
      tryAll: function (this: Chain, fn) {
        const cmds = this[cmdSymbol];
        return createChain(methods, [
          ...cmds,
          (beforeCtx, next) => {
            let ctx = beforeCtx;
            const chains = fn(pipe());

            let allFail = true;
            for (const chain of chains) {
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
            }
            if (!allFail) {
              next(ctx);
            }
          },
        ]) as never;
      },
      ...methods,
    } as Chain;
  };
  pipe = (): Chain<InitCommandCtx> => {
    const methods = {} as Record<
      string,
      (data: Record<string, unknown>) => Chain
    >;
    const createChain = this.createChain;
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
  getChainCtx = <T extends BlockSuite.CommandContext>(chain: Chain<T>) => {
    const ctx = {} as T;
    chain
      .inline((chainCtx, next) => {
        Object.assign(ctx, chainCtx);
        next();
      })
      .run();
    return ctx;
  };
}

declare global {
  namespace BlockSuite {
    interface CommandContext extends InitCommandCtx {}

    interface Commands {}

    type CommandName = keyof Commands;
    type CommandDataName = keyof CommandContext;

    // eslint-disable-next-line @typescript-eslint/ban-types
    type CommandChain<In extends object = {}> = Chain<In & InitCommandCtx>;
  }
}
