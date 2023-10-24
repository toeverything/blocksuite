import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { createLitPortal } from '../../_common/components/portal.js';
import { MoreIcon } from '../../_common/icons/index.js';
import { BookmarkOperationMenu } from './bookmark-operation-popper.js';
import {
  config,
  type MenuActionCallback,
  type ToolbarActionCallback,
} from './config.js';

@customElement('bookmark-toolbar')
export class BookmarkToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    .bookmark-bar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
      height: 40px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      user-select: none;
    }
    .divider {
      width: 1px;
      height: 24px;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  model!: BaseBlockModel;

  @property({ attribute: false })
  onSelected?: ToolbarActionCallback & MenuActionCallback;

  @property({ attribute: false })
  root!: HTMLElement;

  @property({ attribute: false })
  abortController!: AbortController;

  @query('.bookmark-bar')
  bookmarkBarElement!: HTMLElement;

  @query('.more-button-wrapper')
  moreButton!: HTMLElement;

  private _moreMenuAbortController: AbortController | null = null;

  private _toggleMenu() {
    if (this._moreMenuAbortController) {
      this._moreMenuAbortController.abort();
      this._moreMenuAbortController = null;
      return;
    }
    this._moreMenuAbortController = new AbortController();
    const bookmarkOperationMenu = new BookmarkOperationMenu();
    bookmarkOperationMenu.model = this.model;
    bookmarkOperationMenu.onSelected = this.onSelected;

    createLitPortal({
      template: bookmarkOperationMenu,
      container: this.bookmarkBarElement,
      computePosition: {
        referenceElement: this.bookmarkBarElement,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
      abortController: this._moreMenuAbortController,
    });
  }

  override render() {
    const buttons = repeat(
      config.filter(({ showWhen = () => true }) => showWhen(this.model)),
      ({ type }) => type,
      ({ type, icon, tooltip, action, divider, disableWhen = () => false }) => {
        return html`<icon-button
            size="24px"
            class="bookmark-toolbar-button ${type}"
            ?disabled=${disableWhen(this.model)}
            @click=${() => {
              action(this.model, this.onSelected, this);
            }}
          >
            ${icon}
            <affine-tooltip .offset=${12}>${tooltip}</affine-tooltip>
          </icon-button>
          ${divider ? html`<div class="divider"></div>` : nothing} `;
      }
    );

    return html`
      <div class="bookmark-bar">
        ${buttons}

        <div class="more-button-wrapper">
          <icon-button
            size="24px"
            class="more-button"
            @click=${() => {
              this._toggleMenu();
            }}
          >
            ${MoreIcon}
            <affine-tooltip .offset=${12}>More</affine-tooltip>
          </icon-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-toolbar': BookmarkToolbar;
  }
}
