import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { SelectTag } from '../../../types.js';

@customElement('affine-database-multi-tag-view')
export class MultiTagView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-database-multi-tag-view {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 2px 0;
    }

    .affine-database-select-cell-container * {
      box-sizing: border-box;
    }

    .affine-database-select-cell-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      width: 100%;
      font-size: var(--affine-font-sm);
    }

    .affine-database-select-cell-container .select-selected {
      height: 28px;
      padding: 2px 10px;
      border-radius: 4px;
      white-space: nowrap;
      background: var(--affine-tag-white);
    }
  `;

  @query('.affine-database-select-cell-container')
  selectContainer!: HTMLElement;

  @property({ attribute: false })
  value: string[] = [];

  @property({ attribute: false })
  options: SelectTag[] = [];

  override render() {
    const values = this.value;
    const map = new Map<string, SelectTag>(this.options.map(v => [v.id, v]));
    return html`
      <div class="affine-database-select-cell-container">
        ${repeat(values, id => {
          const option = map.get(id);
          if (!option) {
            return;
          }
          const style = styleMap({
            backgroundColor: option.color,
          });
          return html`<span class="select-selected" style=${style}
            >${option.value}</span
          >`;
        })}
      </div>
    `;
  }
}
