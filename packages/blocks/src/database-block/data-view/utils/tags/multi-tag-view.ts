import './tag.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { SelectTag } from './multi-tag-select.js';

@customElement('affine-multi-tag-view')
export class MultiTagView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-multi-tag-view {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      min-height: 22px;
    }

    .affine-select-cell-container * {
      box-sizing: border-box;
    }

    .affine-select-cell-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      width: 100%;
    }

    .affine-select-cell-container .select-selected {
      height: 22px;
      font-size: 14px;
      line-height: 22px;
      padding: 0 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid var(--affine-border-color);
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--affine-background-primary-color);
    }
    .select-selected .selected-point {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  `;

  @query('.affine-select-cell-container')
  accessor selectContainer!: HTMLElement;

  @property({ attribute: false })
  accessor value: string[] = [];

  @property({ attribute: false })
  accessor options: SelectTag[] = [];

  override render() {
    const values = this.value;
    const map = new Map<string, SelectTag>(this.options?.map(v => [v.id, v]));
    return html`
      <div contenteditable="false" class="affine-select-cell-container">
        ${repeat(values, id => {
          const option = map.get(id);
          if (!option) {
            return;
          }
          return html`<affine-tag-component
            .name="${option.value}"
            .color="${option.color}"
          ></affine-tag-component>`;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-multi-tag-view': MultiTagView;
  }
}
