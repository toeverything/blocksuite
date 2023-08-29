import type { tTag } from '../../../logical/data-type.js';
import type { TypeOfData } from '../../../logical/typesystem.js';
import { LiteralElement } from './literal-element.js';

export class TagLiteral extends LiteralElement<
  string,
  TypeOfData<typeof tTag>
> {
  tags() {
    const tags = this.type.data?.tags;
    if (!tags) {
      return [];
    }
    return tags;
  }
}
