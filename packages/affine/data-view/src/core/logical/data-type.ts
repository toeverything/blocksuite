import type Zod from 'zod';

import type { TypeDefinition, TypeInstance, Unify } from './type.js';
import type { TypeVarContext } from './type-variable.js';
import type { AnyTypeInstance } from './typesystem.js';

export class DTInstance<Name extends string = string, Data = unknown, ValueSchema extends Zod.ZodType = Zod.ZodType> implements TypeInstance {
  readonly _valueType = undefined as never as Zod.TypeOf<ValueSchema>;

  constructor(
    readonly name: Name,
    readonly _validate: ValueSchema,
    readonly data?: Data) {
  }

  subst(_ctx: TypeVarContext): void | TypeInstance {
    return this;
  };

  unify(_ctx: TypeVarContext, type: DTInstance, _unify: Unify): boolean {
    if (this.name !== type.name) {
      return false;
    }
    if (type.data == null) {
      return true;
    }
    return this.data != null;
  }

  valueValidate(value: unknown): value is this['_valueType'] {
    return this._validate.safeParse(value).success;
  }
}

export class DataType<Name extends string, DataSchema extends Zod.ZodType, ValueSchema extends Zod.ZodType> implements TypeDefinition {
  constructor(private name: Name, _dataSchema: DataSchema, private valueSchema: ValueSchema) {
  }

  instance(literal?: Zod.TypeOf<DataSchema>) {
    return new DTInstance(this.name, this.valueSchema, literal);
  }

  is(type: AnyTypeInstance): type is DTInstance<Name, DataSchema, ValueSchema> {
    return type.name === this.name;
  }
}

export const defineDataType = <Name extends string, Data extends Zod.ZodType, Value extends Zod.ZodType>(
  name: Name,
  validateData: Data,
  validateValue: Value,
) => {
  return new DataType(name, validateData, validateValue);
};
