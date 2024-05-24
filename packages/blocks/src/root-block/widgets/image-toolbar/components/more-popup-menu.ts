import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { stopPropagation } from '../../../../_common/utils/event.js';
import type { ImageBlockComponent } from '../../../../image-block/image-block.js';
import type { MoreMenuConfigItem } from '../type.js';
import { MoreMenuRenderer } from '../utils.js';

@customElement('image-more-popup-menu')
export class ImageMorePopupMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .image-more-popup-menu {
      box-sizing: border-box;
    }

    .image-more-popup-menu-container {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-1);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .image-more-popup-menu-container > .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      font-size: var(--affine-font-sm);
      font-weight: 400;
      line-height: 22px;
      color: var(--affine-text-primary-color);
      border-radius: 4px;
    }

    .image-more-popup-menu-container > .menu-item.delete:hover icon-button {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .image-more-popup-menu-container
      > .menu-item.delete:hover
      icon-button
      > svg {
      color: var(--affine-error-color);
    }

    .image-more-popup-menu-container > .menu-item svg {
      margin: 0 8px;
      scale: 0.88;
    }

    .image-more-popup-menu-container > .divider {
      width: 100%;
      height: 0.5px;
      margin: 8px 0;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  accessor block!: ImageBlockComponent;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor moreMenuConfig!: MoreMenuConfigItem[];

  get _items() {
    return MoreMenuRenderer(
      this.block,
      this.abortController,
      this.moreMenuConfig
    );
  }

  override render() {
    return html`
      <div class="image-more-popup-menu">
        <div
          class="image-more-popup-menu-container"
          @pointerdown=${stopPropagation}
        >
          ${this._items}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'image-more-popup-menu': ImageMorePopupMenu;
  }
}
