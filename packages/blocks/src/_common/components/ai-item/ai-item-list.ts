import { createLitPortal } from '@blocksuite/affine-components/portal';
import { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { PropTypes, requiredProperties } from '@blocksuite/block-std';
import { flip, offset } from '@floating-ui/dom';
import { baseTheme } from '@toeverything/theme';
import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AIItem } from './ai-item.js';
import type { AIItemConfig, AIItemGroupConfig } from './types.js';

import './ai-item.js';
import {
  SUBMENU_OFFSET_CROSS_AXIS,
  SUBMENU_OFFSET_MAIN_AXIS,
} from './const.js';

@requiredProperties({ host: PropTypes.instanceOf(EditorHost) })
@customElement('ai-item-list')
export class AIItemList extends WithDisposable(LitElement) {
  private _abortController: AbortController | null = null;

  private _activeSubMenuItem: AIItemConfig | null = null;

  private _closeSubMenu = () => {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._activeSubMenuItem = null;
  };

  private _itemClassName = (item: AIItemConfig) => {
    return 'ai-item-' + item.name.split(' ').join('-').toLocaleLowerCase();
  };

  private _openSubMenu = (item: AIItemConfig) => {
    if (!item.subItem || item.subItem.length === 0) {
      this._closeSubMenu();
      return;
    }

    if (item === this._activeSubMenuItem) {
      return;
    }

    const aiItem = this.shadowRoot?.querySelector(
      `.${this._itemClassName(item)}`
    ) as AIItem | null;
    if (!aiItem || !aiItem.menuItem) return;

    this._closeSubMenu();
    this._activeSubMenuItem = item;
    this._abortController = new AbortController();
    this._abortController.signal.addEventListener('abort', () => {
      this._closeSubMenu();
    });

    const aiItemContainer = aiItem.menuItem;
    const subMenuOffset = {
      mainAxis: item.subItemOffset?.[0] ?? SUBMENU_OFFSET_MAIN_AXIS,
      crossAxis: item.subItemOffset?.[1] ?? SUBMENU_OFFSET_CROSS_AXIS,
    };

    createLitPortal({
      template: html`<ai-sub-item-list
        .item=${item}
        .host=${this.host}
        .onClick=${this.onClick}
        .abortController=${this._abortController}
      ></ai-sub-item-list>`,
      container: aiItemContainer,
      computePosition: {
        referenceElement: aiItemContainer,
        placement: 'right-start',
        middleware: [flip(), offset(subMenuOffset)],
        autoUpdate: true,
      },
      abortController: this._abortController,
      closeOnClickAway: true,
    });
  };

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
      padding: 4px calc(var(--item-padding, 8px) + 4px);
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
          item =>
            html`<ai-item
              .onClick=${() => {
                this.onClick?.();
              }}
              .item=${item}
              .host=${this.host}
              class=${this._itemClassName(item)}
              @mouseover=${() => {
                this._openSubMenu(item);
              }}
            ></ai-item>`
        )}
      `;
    })}`;
  }

  @property({ attribute: false })
  accessor groups: AIItemGroupConfig[] = [];

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor onClick: (() => void) | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-item-list': AIItemList;
  }
}
