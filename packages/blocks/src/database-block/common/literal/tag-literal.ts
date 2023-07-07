import { popFilterableSimpleMenu } from '../../../components/menu/menu.js';
import type { tTag } from '../../logical/data-type.js';
import type { TypeOfData } from '../../logical/typesystem.js';
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

  override showValue(): string {
    return this.tags().find(v => v.id === this.value)?.value ?? '[]';
  }

  override _popEdit(target: HTMLElement = this) {
    popFilterableSimpleMenu(
      target,
      this.tags().map(v => {
        return {
          type: 'action',
          name: v.value,
          select: () => {
            this.onChange(v.id);
          },
        };
      })
    );
  }
}
