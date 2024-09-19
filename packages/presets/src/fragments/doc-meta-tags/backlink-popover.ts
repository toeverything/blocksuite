import { DualLinkIcon16, scrollbarStyle } from '@blocksuite/blocks';
import { WithDisposable } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { state } from 'lit/decorators.js';

import { type BacklinkData, DEFAULT_DOC_NAME } from './utils.js';

export class BacklinkButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: relative;
      display: flex;
    }

    .btn {
      padding: 0 12px;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      border: none;
      height: 30px;
      border-radius: 8px;
      gap: 4px;
      background: transparent;
      cursor: pointer;

      user-select: none;
      font-size: var(--affine-font-sm);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      fill: var(--affine-text-secondary-color);
      color: var(--affine-text-secondary-color);
      pointer-events: auto;
    }

    .btn > span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .btn:hover {
      background: var(--affine-hover-color);
    }

    .btn:active {
      background: var(--affine-hover-color);
    }

    .backlink-popover {
      position: absolute;
      left: 0;
      bottom: 0;
      transform: translateY(100%);
      z-index: 1;
      padding-top: 8px;
    }

    .menu {
      display: flex;
      flex-direction: column;
      padding: 8px 4px;
      background: var(--affine-white);
      box-shadow: var(--affine-menu-shadow);
      border-radius: 12px;
    }

    .backlink-popover .group-title {
      color: var(--affine-text-secondary-color);
      margin: 8px 12px;
    }

    .backlink-popover icon-button {
      padding: 8px;
      justify-content: flex-start;
      gap: 8px;
    }

    ${scrollbarStyle('.backlink-popover .group')}
  `;

  private _backlinks: BacklinkData[];

  // Handle click outside
  private _onClickAway = (e: Event) => {
    if (e.target === this) return;
    if (!this._showPopover) return;
    this._showPopover = false;
    document.removeEventListener('mousedown', this._onClickAway);
  };

  constructor(backlinks: BacklinkData[]) {
    super();

    this._backlinks = backlinks;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.tabIndex = 0;
  }

  onClick() {
    this._showPopover = !this._showPopover;
    document.addEventListener('mousedown', this._onClickAway);
  }

  override render() {
    // Only show linked doc backlinks
    const backlinks = this._backlinks;
    if (!backlinks.length) return null;

    return html`
      <div class="btn" @click="${this.onClick}">
        ${DualLinkIcon16}<span>Backlinks (${backlinks.length})</span>
        ${this._showPopover ? backlinkPopover(backlinks) : null}
      </div>
    `;
  }

  @state()
  private accessor _showPopover = false;
}

function backlinkPopover(backlinks: BacklinkData[]) {
  return html`<div
    class="backlink-popover"
    @click=${(e: MouseEvent) => e.stopPropagation()}
  >
    <div class="menu">
      <div class="group-title">Linked to this doc</div>
      <div class="group" style="overflow-y: scroll; max-height: 372px;">
        ${backlinks.map(link => {
          const title = link.title || DEFAULT_DOC_NAME;
          return html`<icon-button
            width="248px"
            height="32px"
            text="${title}"
            @mousedown="${link.jump}"
          >
            ${link.icon}
          </icon-button>`;
        })}
      </div>
    </div>
  </div>`;
}
