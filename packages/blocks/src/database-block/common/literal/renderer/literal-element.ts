import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TType } from '../../../logical/typesystem.js';
import type { LiteralViewProps } from '../matcher.js';

export abstract class LiteralElement<T = unknown, Type extends TType = TType>
  extends WithDisposable(ShadowlessElement)
  implements LiteralViewProps<T, Type>
{
  @property({ attribute: false })
  type!: Type;

  @property({ attribute: false })
  value?: T;

  @property({ attribute: false })
  onChange!: (value?: T) => void;
}

@customElement('data-view-literal-boolean-view')
export class BooleanLiteral extends LiteralElement<boolean> {
  override render() {
    return html` ${this.value || 'False'} `;
  }
}
@customElement('data-view-literal-number-view')
export class NumberLiteral extends LiteralElement<number> {
  override render() {
    return html` ${this.value || 'Empty'} `;
  }
}

@customElement('data-view-literal-string-view')
export class StringLiteral extends LiteralElement<string> {
  override render() {
    return html` ${this.value || 'Empty'} `;
  }
}
