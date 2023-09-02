import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { popMenu } from '../../../../components/menu/index.js';
import { selectOptionColors } from '../../../../components/tags/colors.js';
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

  updateTag(tag: Partial<SelectTag>) {
    this.updateData?.({
      ...this.data,
      options: this.data.options.map(v => {
        if (v.id === this.value) {
          return {
            ...v,
            ...tag,
          };
        }
        return v;
      }),
    });
  }

  private _click = () => {
    if (this.readonly) {
      return;
    }
    popMenu(this, {
      options: {
        input: {
          initValue: this.tag?.value ?? '',
          onComplete: text => {
            this.updateTag({ value: text });
          },
        },
        items: selectOptionColors.map(({ color, name }) => {
          const styles = styleMap({
            backgroundColor: color,
            borderRadius: '50%',
            width: '20px',
            height: '20px',
          });
          return {
            type: 'action',
            name: name,
            isSelected: this.tag?.color === color,
            icon: html` <div style=${styles}></div>`,
            select: () => {
              this.updateTag({ color });
            },
          };
        }),
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
