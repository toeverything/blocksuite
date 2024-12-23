import { CheckBoxCkeckSolidIcon, CheckBoxUnIcon } from '@blocksuite/icons/lit';
import { css, html } from 'lit';

import { BaseGroup } from './base.js';

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
      ${this.value
        ? CheckBoxCkeckSolidIcon({ style: `color:#1E96EB` })
        : CheckBoxUnIcon()}
    </div>`;
  }
}
