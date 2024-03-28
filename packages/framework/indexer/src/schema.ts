import type { Field } from './field.js';
import { indexDateField } from './internal-fields.js';

export class Schema {
  constructor(public readonly fields: Field[]) {
    fields.push(indexDateField);
  }
}
