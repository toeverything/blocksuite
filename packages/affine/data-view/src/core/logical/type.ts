import type { AnyTypeInstance } from './typesystem.js';
import Zod from 'zod';
import type { TypeVarContext } from './type-variable.js';

export interface TypeDefinition {
  is(typeInstance: AnyTypeInstance): boolean;
}

export interface TypeInstance extends AnyTypeInstance {
  readonly _valueType: unknown;
  readonly _validate: Zod.ZodSchema;

  valueValidate(value: unknown): value is this['_valueType'];

  subst(ctx: TypeVarContext): TypeInstance | void;

  unify(ctx: TypeVarContext, type: TypeInstance, unify: Unify): boolean;
}

export type ValueTypeOf<T> = T extends TypeInstance ? T['_valueType'] : never;

export type Unify = (ctx: TypeVarContext, left: TypeInstance | undefined, right: TypeInstance | undefined, covariance?: boolean) => boolean
