import { assertExists, noop } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { MorePopupMenu } from '../../../../_common/components/more-popup-menu/more-popup-menu.js';
import { createLitPortal } from '../../../../_common/components/portal.js';
import { MoreVerticalIcon } from '../../../../_common/icons/edgeless.js';
import { stopPropagation } from '../../../../_common/utils/event.js';
import type { ImageBlockComponent } from '../../../../image-block/image-block.js';
import { styles } from '../styles.js';
import type { ImageConfigItem, MoreMenuConfigItem } from '../type.js';
import { ConfigRenderer, MoreMenuRenderer } from '../utils.js';

@customElement('affine-image-toolbar')
export class AffineImageToolbar extends LitElement {
  get _items() {
    return ConfigRenderer(
      this.blockElement,
      this.abortController,
      this.config,
      this.closeCurrentMenu
    );
  }

  static override styles = styles;

  @query('.image-toolbar-button.more')
  private accessor _moreButton!: HTMLElement;

  @state()
  private accessor _moreMenuOpen = false;

  private _popMenuAbortController: AbortController | null = null;

  private _currentOpenMenu: AbortController | null = null;

  @property({ attribute: false })
  accessor blockElement!: ImageBlockComponent;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor config!: ImageConfigItem[];

  @property({ attribute: false })
  accessor moreMenuConfig!: MoreMenuConfigItem[];

  @property({ attribute: false })
  accessor onActiveStatusChange: (active: boolean) => void = noop;

  private _clearPopMenu() {
    if (this._popMenuAbortController) {
      this._popMenuAbortController.abort();
      this._popMenuAbortController = null;
    }
  }

  private _toggleMoreMenu() {
    // If the menu we're trying to open is already open, return
    if (
      this._currentOpenMenu &&
      !this._currentOpenMenu.signal.aborted &&
      this._currentOpenMenu === this._popMenuAbortController
    ) {
      this.closeCurrentMenu();
      this._moreMenuOpen = false;
      return;
    }

    this.closeCurrentMenu();
    this._popMenuAbortController = new AbortController();
    this._popMenuAbortController.signal.addEventListener('abort', () => {
      this._moreMenuOpen = false;
      this.onActiveStatusChange(false);
    });
    this.onActiveStatusChange(true);

    this._currentOpenMenu = this._popMenuAbortController;

    const moreMenu = new MorePopupMenu();
    const moreItems = MoreMenuRenderer(
      this.blockElement,
      this._popMenuAbortController,
      this.moreMenuConfig
    );
    moreMenu.items = moreItems;

    assertExists(this._moreButton);
    createLitPortal({
      template: moreMenu,
      container: this.blockElement.host,
      // stacking-context(editor-host)
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
      computePosition: {
        referenceElement: this._moreButton,
        placement: 'bottom-start',
        middleware: [flip(), offset(4)],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._popMenuAbortController,
      closeOnClickAway: true,
    });
    this._moreMenuOpen = true;
  }

  closeCurrentMenu = () => {
    if (this._currentOpenMenu && !this._currentOpenMenu.signal.aborted) {
      this._currentOpenMenu.abort();
      this._currentOpenMenu = null;
    }
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.closeCurrentMenu();
    this._clearPopMenu();
  }

  override render() {
    return html`
      <div
        class="affine-image-toolbar-container"
        @pointerdown=${stopPropagation}
      >
        ${this._items}
        <icon-button
          class="image-toolbar-button more"
          size="24px"
          @click=${() => this._toggleMoreMenu()}
        >
          ${MoreVerticalIcon}
          ${!this._moreMenuOpen
            ? html`<affine-tooltip>More</affine-tooltip>`
            : nothing}
        </icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image-toolbar': AffineImageToolbar;
  }
}
