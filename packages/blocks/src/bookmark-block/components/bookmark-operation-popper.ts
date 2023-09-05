import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { type MenuActionCallback, moreOperations } from './config.js';

@customElement('bookmark-operation-menu')
export class BookmarkOperationMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .bookmark-operation-menu {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }
    .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    .menu-item:hover {
      background: var(--affine-hover-color);
    }
    .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .menu-item:hover.delete > svg {
      color: var(--affine-error-color);
    }
    .menu-item svg {
      margin: 0 8px;
    }
  `;

  @property({ attribute: false })
  model!: BaseBlockModel;

  @property({ attribute: false })
  onSelected?: MenuActionCallback;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    const menuItems = repeat(
      moreOperations.filter(({ showWhen = () => true }) =>
        showWhen(this.model)
      ),
      ({ type }) => type,
      ({ type, icon, label, action, divider, disableWhen = () => false }) => {
        return html`<icon-button
            width="126px"
            height="32px"
            class="menu-item ${type}"
            text=${label}
            ?disabled=${disableWhen(this.model)}
            @click=${() => {
              action(this.model, this.onSelected, this);
            }}
          >
            ${icon}
          </icon-button>
          ${divider ? html`<div class="divider"></div>` : nothing} `;
      }
    );

    return html`<div class="bookmark-operation-menu">${menuItems}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-operation-menu': BookmarkOperationMenu;
  }
}
