import type {
  EditorIconButton,
  MenuItemGroup,
} from '@blocksuite/affine-components/toolbar';

import { MoreVerticalIcon } from '@blocksuite/affine-components/icons';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import { renderGroups } from '@blocksuite/affine-components/toolbar';
import { assertExists, noop } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ImageToolbarContext } from '../context.js';

import { styles } from '../styles.js';

export class AffineImageToolbar extends LitElement {
  static override styles = styles;

  private _currentOpenMenu: AbortController | null = null;

  private _popMenuAbortController: AbortController | null = null;

  closeCurrentMenu = () => {
    if (this._currentOpenMenu && !this._currentOpenMenu.signal.aborted) {
      this._currentOpenMenu.abort();
      this._currentOpenMenu = null;
    }
  };

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
          <div data-size="large" data-orientation="vertical">
            ${renderGroups(this.moreGroups, this.context)}
          </div>
        </editor-menu-content>
      `,
      container: this.context.host,
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

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.closeCurrentMenu();
    this._clearPopMenu();
  }

  override render() {
    return html`
      <editor-toolbar class="affine-image-toolbar-container" data-without-bg>
        ${renderGroups(this.primaryGroups, this.context)}
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

  @query('editor-icon-button.more')
  private accessor _moreButton!: EditorIconButton;

  @state()
  private accessor _moreMenuOpen = false;

  @property({ attribute: false })
  accessor context!: ImageToolbarContext;

  @property({ attribute: false })
  accessor moreGroups!: MenuItemGroup<ImageToolbarContext>[];

  @property({ attribute: false })
  accessor onActiveStatusChange: (active: boolean) => void = noop;

  @property({ attribute: false })
  accessor primaryGroups!: MenuItemGroup<ImageToolbarContext>[];
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image-toolbar': AffineImageToolbar;
  }
}
