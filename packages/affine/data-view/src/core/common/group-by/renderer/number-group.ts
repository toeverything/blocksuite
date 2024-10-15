import {
  menu,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { css, html } from 'lit';

import { BaseGroup } from './base.js';

export class NumberGroupView extends BaseGroup<NonNullable<unknown>, number> {
  static override styles = css`
    .data-view-group-title-number-view {
      border-radius: 8px;
      padding: 4px 8px;
      width: max-content;
      cursor: pointer;
    }

    .data-view-group-title-number-view:hover {
      background-color: var(--affine-hover-color);
    }
  `;

  private _click = () => {
    if (this.readonly) {
      return;
    }
    popMenu(popupTargetFromElement(this), {
      options: {
        items: [
          menu.input({
            initialValue: this.value ? `${this.value * 10}` : '',
            onComplete: text => {
              const num = Number.parseFloat(text);
              if (Number.isNaN(num)) {
                return;
              }
              this.updateValue?.(num);
            },
          }),
        ],
      },
    });
  };

  protected override render(): unknown {
    if (this.value == null) {
      return html` <div>Ungroups</div>`;
    }
    if (this.value >= 10) {
      return html` <div
        @click="${this._click}"
        class="data-view-group-title-number-view"
      >
        >= 100
      </div>`;
    }
    return html` <div
      @click="${this._click}"
      class="data-view-group-title-number-view"
    >
      ${this.value * 10} - ${this.value * 10 + 9}
    </div>`;
  }
}
