import type { EditorIconButton } from '@blocksuite/affine-components/toolbar';

import { MoreVerticalIcon } from '@blocksuite/affine-components/icons';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { CodeBlockComponent } from '../../../../code-block/code-block.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from '../types.js';

import { CodeToolbarItemRenderer, MoreMenuRenderer } from '../utils.js';

@customElement('affine-code-toolbar')
export class AffineCodeToolbar extends WithDisposable(LitElement) {
  private _currentOpenMenu: AbortController | null = null;

  private _popMenuAbortController: AbortController | null = null;

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

  closeCurrentMenu = () => {
    if (this._currentOpenMenu && !this._currentOpenMenu.signal.aborted) {
      this._currentOpenMenu.abort();
      this._currentOpenMenu = null;
    }
  };

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
          <div data-size="small" data-orientation="vertical">
            ${MoreMenuRenderer(
              this.blockComponent,
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
      container: this.blockComponent.host,
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
  }

  override render() {
    const items = CodeToolbarItemRenderer(
      this.items,
      this.blockComponent,
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
          ?disabled=${this.blockComponent.readonly}
          @click=${() => this._toggleMoreMenu()}
        >
          ${MoreVerticalIcon}
        </editor-icon-button>
      </editor-toolbar>
    `;
  }

  @query('.code-toolbar-button.more')
  private accessor _moreButton!: EditorIconButton;

  @state()
  private accessor _moreMenuOpen = false;

  @property({ attribute: false })
  accessor blockComponent!: CodeBlockComponent;

  @property({ attribute: false })
  accessor items!: CodeToolbarItem[];

  @property({ attribute: false })
  accessor moreItems!: CodeToolbarMoreItem[];

  @property({ attribute: false })
  accessor onActiveStatusChange: (active: boolean) => void = noop;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code-toolbar': AffineCodeToolbar;
  }
}
