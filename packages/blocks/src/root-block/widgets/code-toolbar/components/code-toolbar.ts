import '../../../../_common/components/toolbar/icon-button.js';
import '../../../../_common/components/toolbar/toolbar.js';
import '../../../../_common/components/toolbar/menu-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { createLitPortal } from '../../../../_common/components/index.js';
import type { EditorIconButton } from '../../../../_common/components/toolbar/icon-button.js';
import { MoreVerticalIcon } from '../../../../_common/icons/edgeless.js';
import type { CodeBlockComponent } from '../../../../code-block/code-block.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from '../types.js';
import { CodeToolbarItemRenderer, MoreMenuRenderer } from '../utils.js';

@customElement('affine-code-toolbar')
export class AffineCodeToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      top: 0;
      right: 0;
    }

    .code-toolbar-container {
      height: 24px;
      gap: 4px;
      padding: 4px;
      margin: 0;
    }

    .code-toolbar-button {
      color: var(--affine-icon-color);
      background-color: var(--affine-background-primary-color);
      box-shadow: var(--affine-shadow-1);
      border-radius: 4px;
    }
  `;

  @state()
  private accessor _moreMenuOpen = false;

  @query('.code-toolbar-button.more')
  private accessor _moreButton!: EditorIconButton;

  private _popMenuAbortController: AbortController | null = null;

  private _currentOpenMenu: AbortController | null = null;

  @property({ attribute: false })
  accessor blockElement!: CodeBlockComponent;

  @property({ attribute: false })
  accessor items!: CodeToolbarItem[];

  @property({ attribute: false })
  accessor moreItems!: CodeToolbarMoreItem[];

  @property({ attribute: false })
  accessor onActiveStatusChange: (active: boolean) => void = noop;

  private _toggleMoreMenu() {
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
          class="more-popup-menu"
          style=${styleMap({
            '--content-padding': '8px',
            '--packed-height': '4px',
          })}
        >
          <div slot data-size="small" data-orientation="vertical">
            ${MoreMenuRenderer(
              this.blockElement,
              this._popMenuAbortController,
              this.moreItems
            )}
          </div>
        </editor-menu-content>
      `,
      // should be greater than block-selection z-index as selection and popover wil share the same stacking context(editor-host)
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
      container: this.blockElement.host,
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
  }

  override render() {
    const items = CodeToolbarItemRenderer(
      this.items,
      this.blockElement,
      this.closeCurrentMenu
    );

    return html`
      <editor-toolbar class="code-toolbar-container" data-without-bg>
        ${items}
        <editor-icon-button
          class="code-toolbar-button more"
          data-testid="more"
          aria-label="More"
          .tooltip=${'More'}
          .tooltipOffset=${4}
          .showTooltip=${!this._moreMenuOpen}
          ?disabled=${this.blockElement.readonly}
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
    'affine-code-toolbar': AffineCodeToolbar;
  }
}
