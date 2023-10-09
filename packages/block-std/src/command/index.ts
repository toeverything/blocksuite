// type A = {};
// type B = { prop?: string };
// type C = { prop: string };
// type TestA = MakeOptionalIfEmpty<A>;  // void | {}
// type TestB = MakeOptionalIfEmpty<B>;  // void | { prop?: string }
// type TestC = MakeOptionalIfEmpty<C>;  // { prop: string }
type IfAllKeysOptional<T, Yes, No> = Partial<T> extends T
  ? T extends Partial<T>
    ? Yes
    : No
  : No;
type MakeOptionalIfEmpty<T> = IfAllKeysOptional<T, void | T, T>;

export interface InitCommandCtx {
  std: BlockSuite.Std;
}

export type CommandKeyToData<K extends BlockSuite.CommandDataName> = Pick<
  BlockSuite.CommandData,
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InDataOfCommand<C> = C extends Command<infer K, any, infer R>
  ? CommandKeyToData<K> & R
  : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutDataOfCommand<C> = C extends Command<any, infer K, any>
  ? CommandKeyToData<K>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
type CommonMethods<In extends object = {}> = {
  run(): boolean;
  with<T extends Partial<BlockSuite.CommandData>>(value: T): Chain<In & T>;
  inline: <InlineOut extends BlockSuite.CommandDataName = never>(
    command: Command<Extract<keyof In, BlockSuite.CommandDataName>, InlineOut>
  ) => Chain<In & CommandKeyToData<InlineOut>>;
  try: <InlineOut extends BlockSuite.CommandDataName = never>(
    fn: (chain: Chain<In>) => Chain<In & CommandKeyToData<InlineOut>>[]
  ) => Chain<In & CommandKeyToData<InlineOut>>;
};
const cmdSymbol = Symbol('cmds');
// eslint-disable-next-line @typescript-eslint/ban-types
type Chain<In extends object = {}> = CommonMethods<In> & {
  [K in keyof BlockSuite.Commands]: (
    data: MakeOptionalIfEmpty<
      Omit1<InDataOfCommand<BlockSuite.Commands[K]>, In>
    >
  ) => Chain<In & OutDataOfCommand<BlockSuite.Commands[K]>>;
};

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
    cmds: Command[]
  ): Chain => {
    return {
      [cmdSymbol]: cmds,
      run: () => {
        const ctx = this._getCommandCtx();
        const runCmds = (
          ctx: BlockSuite.CommandData,
          [cmd, ...rest]: Command[]
        ) => {
          if (cmd) {
            cmd(ctx, data => runCmds({ ...ctx, ...data }, rest));
          }
        };
        let success = false;
        runCmds(ctx as BlockSuite.CommandData, [
          ...cmds,
          (_, next) => {
            success = true;
            next();
          },
        ]);
        return success;
      },
      with: value => {
        return this.createChain(methods, [
          ...cmds,
          (_, next) => next(value),
        ]) as never;
      },
      inline: command => {
        return this.createChain(methods, [...cmds, command]) as never;
      },
      try: fn => {
        const chains = fn(this.createChain(methods, cmds));
        return this.createChain(methods, [
          ...cmds,
          (_, next) => {
            for (const chain of chains) {
              let tmpCtx = {};
              const success = chain
                .inline((ctx, next) => {
                  tmpCtx = ctx;
                  next();
                })
                .run();
              if (success) {
                next(tmpCtx);
                break;
              }
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

    return createChain(methods, []);
  };
}

declare global {
  namespace BlockSuite {
    interface CommandData extends InitCommandCtx {}

    interface Commands {}

    type CommandName = keyof Commands;
    type CommandDataName = keyof CommandData;
  }
}
