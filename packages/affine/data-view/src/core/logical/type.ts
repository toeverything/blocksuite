import type Zod from 'zod';

import type { TypeVarContext } from './type-variable.js';

export type AnyTypeInstance = {
  readonly name: string;
};

export interface TypeDefinition {
  is(typeInstance: AnyTypeInstance): boolean;
}

export interface TypeInstance extends AnyTypeInstance {
  readonly _valueType: any;
  readonly _validate: Zod.ZodSchema;

  valueValidate(value: unknown): value is this['_valueType'];

  subst(ctx: TypeVarContext): TypeInstance | void;

  unify(ctx: TypeVarContext, type: TypeInstance, unify: Unify): boolean;
}

export type ValueTypeOf<T> = T extends TypeInstance ? T['_valueType'] : never;

export type Unify = (
  ctx: TypeVarContext,
  type: TypeInstance | undefined,
  expect: TypeInstance | undefined
) => boolean;
export type TypeConvertConfig<
  From extends TypeInstance = TypeInstance,
  To extends TypeInstance = TypeInstance,
> = {
  from: From;
  to: To;
  convert: (value: ValueTypeOf<From>) => ValueTypeOf<To>;
};
