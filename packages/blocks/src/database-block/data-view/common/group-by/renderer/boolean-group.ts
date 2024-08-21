import {
  checkboxChecked,
  checkboxUnchecked,
} from '@blocksuite/affine-components/icons';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { BaseGroup } from './base.js';

@customElement('data-view-group-title-boolean-view')
export class BooleanGroupView extends BaseGroup<NonNullable<unknown>, boolean> {
  static override styles = css`
    .data-view-group-title-boolean-view {
      display: flex;
      align-items: center;
    }
    .data-view-group-title-boolean-view svg {
      width: 20px;
      height: 20px;
    }
  `;

  protected override render(): unknown {
    return html` <div class="data-view-group-title-boolean-view">
      ${this.value ? checkboxChecked() : checkboxUnchecked()}
    </div>`;
  }
}
