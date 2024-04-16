import './ai-item.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AIItemGroupConfig } from './types.js';

@customElement('ai-item-list')
export class AIItemList extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      user-select: none;
    }
    .group-name {
      display: flex;
      padding: 8px 12px;
      align-items: center;
      color: var(--affine-text-secondary-color);
      text-align: justify;
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
      width: 100%;
      box-sizing: border-box;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  groups!: AIItemGroupConfig[];

  override render() {
    return html`${repeat(this.groups, group => {
      return html`
        ${group.name
          ? html`<div class="group-name">
              ${group.name.toLocaleUpperCase()}
            </div>`
          : nothing}
        ${repeat(
          group.items,
          item => html`<ai-item .item=${item} .host=${this.host}></ai-item>`
        )}
      `;
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-item-list': AIItemList;
  }
}
