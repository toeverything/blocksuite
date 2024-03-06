import type { FieldType, FieldTypeSchema } from './field-type.js';

export interface Field<T extends FieldType = FieldType> {
  key: string;
  type: T;
}

export type FieldValue<T extends Field> =
  T extends Field<infer U> ? FieldTypeSchema[U] : never;
