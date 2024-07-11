import '../../../../_common/components/toolbar/icon-button.js';
import '../../../../_common/components/toolbar/toolbar.js';
import '../../../../_common/components/toolbar/menu-button.js';

import { assertExists, noop } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { createLitPortal } from '../../../../_common/components/portal.js';
import type { EditorIconButton } from '../../../../_common/components/toolbar/icon-button.js';
import { MoreVerticalIcon } from '../../../../_common/icons/edgeless.js';
import type { ImageBlockComponent } from '../../../../image-block/image-block.js';
import { styles } from '../styles.js';
import type { ImageConfigItem, MoreMenuConfigItem } from '../type.js';
import { ConfigRenderer, MoreMenuRenderer } from '../utils.js';

@customElement('affine-image-toolbar')
export class AffineImageToolbar extends LitElement {
  static override styles = styles;

  @query('editor-icon-button.more')
  private accessor _moreButton!: EditorIconButton;

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

  get _items() {
    return ConfigRenderer(
      this.blockElement,
      this.abortController,
      this.config,
      this.closeCurrentMenu
    );
  }

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

    assertExists(this._moreButton);
    createLitPortal({
      template: html`
        <editor-menu-content
          data-show
          class="image-more-popup-menu"
          style=${styleMap({
            '--content-padding': '8px',
            '--packed-height': '4px',
          })}
        >
          <div slot data-size="small" data-orientation="vertical">
            ${MoreMenuRenderer(
              this.blockElement,
              this._popMenuAbortController,
              this.moreMenuConfig
            )}
          </div>
        </editor-menu-content>
      `,
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
      <editor-toolbar class="affine-image-toolbar-container" data-without-bg>
        ${this._items}
        <editor-icon-button
          class="image-toolbar-button more"
          aria-label="More"
          .tooltip=${'More'}
          .tooltipOffset=${4}
          .showTooltip=${!this._moreMenuOpen}
          @click=${() => this._toggleMoreMenu()}
        >
          ${MoreVerticalIcon}
        </editor-icon-button>
      </editor-toolbar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image-toolbar': AffineImageToolbar;
  }
}
