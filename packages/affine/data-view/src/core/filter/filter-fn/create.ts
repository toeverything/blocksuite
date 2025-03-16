import type { ArrayTypeInstance } from '../../logical/composite-type.js';
import type { DTInstance } from '../../logical/data-type.js';
import type { TypeInstance, ValueTypeOf } from '../../logical/type.js';
import type {
  TypeVarDefinitionInstance,
  TypeVarReferenceInstance,
} from '../../logical/type-variable.js';

export type FilterConfig<
  Self extends TypeInstance = TypeInstance,
  Args extends TypeInstance[] = TypeInstance[],
  Vars extends TypeVarDefinitionInstance[] = TypeVarDefinitionInstance[],
> = {
  name: string;
  label: string;
  shortString: (
    ...args: {
      [K in keyof Args]:
        | {
            value: ValueTypeOf<ReplaceVar<Args[K], Vars>>;
            type: ReplaceVar<Args[K], Vars>;
          }
        | undefined;
    }
  ) => string | undefined;
  self: Self;
  vars?: Vars;
  args: Args;
  impl: (
    self: ValueTypeOf<ReplaceVar<Self, Vars>> | undefined,
    ...args: { [K in keyof Args]: ValueTypeOf<ReplaceVar<Args[K], Vars>> }
  ) => boolean;
  defaultValue?: (args: {
    [K in keyof Args]: ValueTypeOf<ReplaceVar<Args[K], Vars>>;
  }) => ValueTypeOf<ReplaceVar<Self, Vars>> | undefined;
};
type FindVar<
  Vars extends TypeVarDefinitionInstance[],
  Name extends string,
> = Vars[number] extends infer Var
  ? Var extends TypeVarDefinitionInstance<Name, infer R>
    ? R
    : never
  : never;
type ReplaceVar<
  Arg,
  Vars extends TypeVarDefinitionInstance[],
> = Arg extends TypeVarReferenceInstance
  ? FindVar<Vars, Arg['varName']>
  : Arg extends ArrayTypeInstance<infer Ele>
    ? ArrayTypeInstance<ReplaceVar<Ele, Vars>>
    : Arg extends DTInstance
      ? Arg
      : Arg;

export const createFilter = <
  Self extends TypeInstance,
  Args extends TypeInstance[],
  Vars extends TypeVarDefinitionInstance[],
>(
  config: FilterConfig<Self, Args, Vars>
) => {
  return config;
};
