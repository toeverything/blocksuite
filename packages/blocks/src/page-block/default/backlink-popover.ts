import {
  ArrowDownIcon,
  DualLinkIcon16,
  LinkedPageIcon,
  PageIcon,
} from '@blocksuite/global/config';
import { assertExists, type Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { type BlockHost, WithDisposable } from '../../std.js';

const styles = css`
  :host {
    position: relative;
  }

  .btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    border: none;
    padding: 1px 4px;
    border-radius: 5px;
    gap: 4px;
    background: transparent;
    cursor: pointer;

    user-select: none;
    font-family: var(--affine-font-family);
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
    bottom: -8px;

    display: flex;
    flex-direction: column;
    padding: 8px 4px;
    background: var(--affine-white);
    box-shadow: var(--affine-menu-shadow);
    border-radius: 12px;
    transform: translateY(100%);
    z-index: 1;
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

  ::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 4px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background-color: #b1b1b1;
  }
`;

export type BackLink = {
  pageId: string;
  blockId: string;
  type: NonNullable<AffineTextAttributes['reference']>['type'];
};

@customElement('backlink-button')
export class BacklinkButton extends WithDisposable(LitElement) {
  static override styles = styles;

  @property()
  page?: Page;

  @property()
  host!: BlockHost;

  @state()
  private _backlinks: BackLink[] = [];

  @state()
  private _showPopover = false;

  override connectedCallback() {
    super.connectedCallback();
    this.tabIndex = 0;

    const page = this.page;
    assertExists(page);
    const backlinkIndexer = page.workspace.indexer.backlink;
    this._backlinks = backlinkIndexer.getBacklink(page.id);
    backlinkIndexer.slots.indexUpdated.on(() => {
      this._backlinks = backlinkIndexer.getBacklink(page.id);
      if (!this._backlinks.length) {
        this._showPopover = false;
      }
    });
    this._disposables.addFromEvent(window, 'mousedown', this._onClickAway);
  }

  // Handle click outside
  private _onClickAway = (e: Event) => {
    if (e.target === this) return;
    if (!this._showPopover) return;
    this._showPopover = false;
  };

  onClick() {
    this._showPopover = !this._showPopover;
  }

  override render() {
    // Only show linked page backlinks
    const linkedBacklinks = this._backlinks.filter(
      ({ type }) => type === 'LinkedPage'
    );
    if (!linkedBacklinks.length) {
      return null;
    }
    return html`<div class="btn" @click=${this.onClick}>
        ${DualLinkIcon16}<span>Backlinks (${linkedBacklinks.length})</span
        >${ArrowDownIcon}
      </div>
      ${this._showPopover
        ? backlinkPopover(this.host, linkedBacklinks)
        : null}`;
  }
}

const DEFAULT_PAGE_NAME = 'Untitled';

function backlinkPopover(host: BlockHost, backlinks: BackLink[]) {
  const metas = host.page.workspace.meta.pageMetas;
  return html`<div class="backlink-popover">
    <div class="group-title">Linked to this page</div>
    <div class="group" style="overflow-y: scroll; max-height: 372px;">
      ${backlinks.map(({ pageId, blockId, type }) => {
        const icon = type === 'LinkedPage' ? LinkedPageIcon : PageIcon;
        const pageMeta = metas.find(page => page.id === pageId);
        if (!pageMeta) {
          console.warn('Unexpected page meta not found', pageId);
        }
        const title = pageMeta?.title || DEFAULT_PAGE_NAME;
        return html`<icon-button
          width="248px"
          height="32px"
          text=${title}
          @click=${() => {
            if (pageId === host.page.id) {
              // On the current page, no need to jump
              // TODO jump to block
              return;
            }
            host.slots.pageLinkClicked.emit({ pageId, blockId });
          }}
        >
          ${icon}
        </icon-button>`;
      })}
    </div>
  </div>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'backlink-button': BacklinkButton;
  }
}
