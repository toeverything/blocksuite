import { ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { TType } from '../../../logical/typesystem.js';
import type { LiteralViewProps } from '../types.js';

export abstract class LiteralElement<T = unknown, Type extends TType = TType>
  extends WithDisposable(ShadowlessElement)
  implements LiteralViewProps<T, Type>
{
  @property({ attribute: false })
  accessor onChange!: (value?: T) => void;

  @property({ attribute: false })
  accessor type!: Type;

  @property({ attribute: false })
  accessor value: T | undefined = undefined;
}

export class BooleanLiteral extends LiteralElement<boolean> {
  override render() {
    return this.value ? 'True' : 'False';
  }
}

export class NumberLiteral extends LiteralElement<number> {
  static override styles = css`
    data-view-literal-number-view {
      display: block;
      max-width: 100px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  `;

  override render() {
    return (
      this.value?.toString() ?? html`<span class="dv-color-2">Value</span>`
    );
  }
}

export class StringLiteral extends LiteralElement<string> {
  static override styles = css`
    data-view-literal-string-view {
      display: block;
      max-width: 100px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  `;

  override render() {
    return (
      this.value?.toString() ?? html`<span class="dv-color-2">Value</span>`
    );
  }
}
