import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { EnterIcon } from '../../icons/ai.js';
import {
  type AIActionConfigItem,
  type AIActionSubConfigItem,
} from './config.js';

export const actionItemStyles = css`
  .action-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 12px;
    gap: 4px;
    align-self: stretch;
    border-radius: 4px;
    box-sizing: border-box;
    &:hover {
      background: var(--affine-hover-color);
      cursor: pointer;
    }
  }
  .action-icon {
    display: flex;
    color: var(--affine-brand-color);
  }
  .action-name {
    display: flex;
    padding: 0px 4px;
    align-items: center;
    flex: 1 0 0;
    color: var(--affine-text-primary-color);
    text-align: justify;
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
  }
  .enter-icon,
  .arrow-right-icon {
    color: var(--affine-icon-color);
  }
  .enter-icon {
    display: none;
  }
  .arrow-right-icon,
  .action-item:hover .enter-icon {
    display: flex;
  }
`;

@customElement('ai-action-sub-panel')
export class AIActionSubPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .action-sub-menu {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      position: absolute;
      padding: 8px;
      min-width: 240px;
      max-height: 320px;
      overflow-y: auto;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      z-index: var(--affine-z-index-popover);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--affine-text-primary-color);
      text-align: justify;
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-size: var(--affine-font-sm);
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      user-select: none;
    }
    ${actionItemStyles}
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  item!: AIActionConfigItem;

  @property({ attribute: false })
  abortController!: AbortController;

  private _handleClick = (subItem: AIActionSubConfigItem) => {
    if (subItem.action) {
      // TODO: add parameters to action
      subItem.action();
    }

    this.abortController.abort();
  };

  override render() {
    if (!this.item.subConfig || this.item.subConfig.length <= 0) return nothing;
    return html`<div class="action-sub-menu">
      ${this.item.subConfig?.map(
        subItem =>
          html`<div
            class="action-item"
            @click=${() => this._handleClick(subItem)}
          >
            <div class="action-name">${subItem.type}</div>
            <span class="enter-icon">${EnterIcon}</span>
          </div>`
      )}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-action-sub-panel': AIActionSubPanel;
  }
}
