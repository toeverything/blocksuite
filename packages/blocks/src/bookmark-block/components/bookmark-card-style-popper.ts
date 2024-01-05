import '../../_common/components/button';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type {
  BookmarkBlockModel,
  BookmarkBlockType,
} from '../bookmark-model.js';
import { getBookmarkDefaultImages } from './config.js';

@customElement('bookmark-card-style-menu')
export class BookmarkCardStyleMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      border-radius: 8px;
      padding: 8px;
      gap: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    icon-button {
      padding: var(--1, 0px);
    }

    icon-button.selected {
      border: 1px solid var(--affine-brand-color);
    }
  `;

  @property({ attribute: false })
  model!: BookmarkBlockModel;

  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  abortController!: AbortController;

  private _setBookmarkStyle(style: BookmarkBlockType) {
    this.model.page.updateBlock(this.model, { style });
    this.requestUpdate();
    this.abortController.abort();
  }

  override render() {
    const { LargeHorizontalCardIcon, SmallHorizontalCardIcon } =
      getBookmarkDefaultImages();
    return html`
      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.model.style === 'horizontal',
        })}
        @click=${() => this._setBookmarkStyle('horizontal')}
      >
        ${LargeHorizontalCardIcon}
        <affine-tooltip .offset=${4}
          >${'Large horizontal style'}</affine-tooltip
        >
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.model.style === 'list',
        })}
        @click=${() => this._setBookmarkStyle('list')}
      >
        ${SmallHorizontalCardIcon}
        <affine-tooltip .offset=${4}
          >${'Small horizontal style'}</affine-tooltip
        >
      </icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card-style-menu': BookmarkCardStyleMenu;
  }
}
