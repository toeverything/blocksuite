import type { Field, FieldValue } from './field.js';

export class Document {
  constructor(public readonly id: string) {}

  fields = new Map<string, unknown[]>();

  public set<T extends Field>(field: T, value: FieldValue<T>) {
    if (!this.fields.has(field.key)) {
      this.fields.set(field.key, []);
    }
    this.fields.get(field.key)!.push(value);
  }
}
