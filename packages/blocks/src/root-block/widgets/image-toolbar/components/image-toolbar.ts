import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { createLitPortal } from '../../../../_common/components/portal.js';
import { MoreVerticalIcon } from '../../../../_common/icons/edgeless.js';
import { stopPropagation } from '../../../../_common/utils/event.js';
import type { ImageBlockComponent } from '../../../../image-block/image-block.js';
import { styles } from '../styles.js';
import type { ImageConfigItem, MoreMenuConfigItem } from '../type.js';
import { ConfigRenderer } from '../utils.js';
import { ImageMorePopupMenu } from './more-popup-menu.js';

@customElement('affine-image-toolbar')
export class AffineImageToolbar extends LitElement {
  static override styles = styles;

  @property({ attribute: false })
  accessor blockElement!: ImageBlockComponent;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor config!: ImageConfigItem[];

  @property({ attribute: false })
  accessor moreMenuConfig!: MoreMenuConfigItem[];

  @query('.image-toolbar-button.more')
  private accessor _moreButton!: HTMLElement;

  @state()
  private accessor _moreMenuOpen = false;

  get _items() {
    return ConfigRenderer(this.blockElement, this.abortController, this.config);
  }

  private _moreMenuAbortController: AbortController | null = null;

  private _toggleMoreMenu() {
    if (
      this._moreMenuAbortController &&
      !this._moreMenuAbortController.signal.aborted
    ) {
      this._moreMenuAbortController.abort();
      this._moreMenuOpen = false;
      return;
    }
    this._moreMenuAbortController = new AbortController();

    const moreMenu = new ImageMorePopupMenu();
    moreMenu.block = this.blockElement;
    moreMenu.abortController = this._moreMenuAbortController;
    moreMenu.moreMenuConfig = this.moreMenuConfig;

    assertExists(this._moreButton);
    createLitPortal({
      template: moreMenu,
      container: this._moreButton,
      computePosition: {
        referenceElement: this._moreButton,
        placement: 'bottom-start',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
      abortController: moreMenu.abortController,
      closeOnClickAway: true,
    });
    this._moreMenuOpen = true;
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
