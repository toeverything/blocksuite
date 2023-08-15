import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { popMenu } from '../../../../components/menu/index.js';
import type { SelectTag } from '../../../../components/tags/multi-tag-select.js';
import { BaseGroup } from './base.js';

@customElement('data-view-group-title-select-view')
export class SelectGroupView extends BaseGroup<
  {
    options: SelectTag[];
  },
  string
> {
  static override styles = css`
    .data-view-group-title-select-view {
      width: 100%;
      cursor: pointer;
    }

    .tag {
      padding: 0 8px;
      border-radius: 4px;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  get tag() {
    return this.data.options.find(v => v.id === this.value);
  }

  private _click = () => {
    popMenu(this, {
      options: {
        input: {
          initValue: this.tag?.value ?? '',
          onComplete: text => {
            this.updateData?.({
              ...this.data,
              options: this.data.options.map(v => {
                if (v.id === this.value) {
                  return {
                    ...v,
                    value: text,
                  };
                }
                return v;
              }),
            });
          },
        },
        items: [],
      },
    });
  };

  protected override render(): unknown {
    const tag = this.tag;
    if (!tag) {
      return html` <div>Ungroups</div>`;
    }
    const style = styleMap({
      backgroundColor: tag.color,
    });
    return html` <div
      @click="${this._click}"
      class="data-view-group-title-select-view"
    >
      <div class="tag" style="${style}">${tag.value}</div>
    </div>`;
  }
}
