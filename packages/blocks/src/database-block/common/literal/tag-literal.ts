import type { tTag, TypeOfData } from '../../logical/typesystem.js';
import { popMenu } from '../menu.js';
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
    popMenu(target, {
      options: this.tags().map(v => {
        return {
          type: 'action',
          label: v.value,
          click: () => {
            this.onChange(v.id);
          },
        };
      }),
    });
  }
}
