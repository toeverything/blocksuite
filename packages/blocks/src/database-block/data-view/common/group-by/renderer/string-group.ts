import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { popMenu } from '../../../../../_common/components/index.js';
import { BaseGroup } from './base.js';

@customElement('data-view-group-title-string-view')
export class StringGroupView extends BaseGroup<NonNullable<unknown>, string> {
  static override styles = css`
    .data-view-group-title-string-view {
      border-radius: 8px;
      padding: 4px 8px;
      width: max-content;
      cursor: pointer;
    }

    .data-view-group-title-string-view:hover {
      background-color: var(--affine-hover-color);
    }
  `;

  private _click = () => {
    if (this.readonly) {
      return;
    }
    popMenu(this, {
      options: {
        input: {
          initValue: this.value ?? '',
          onComplete: text => {
            this.updateValue?.(text);
          },
        },
        items: [],
      },
    });
  };

  protected override render(): unknown {
    if (!this.value) {
      return html` <div>Ungroups</div>`;
    }
    return html` <div
      @click="${this._click}"
      class="data-view-group-title-string-view"
    >
      ${this.value}
    </div>`;
  }
}
