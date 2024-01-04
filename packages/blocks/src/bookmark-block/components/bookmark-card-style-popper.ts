import '../../_common/components/button';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type {
  BookmarkBlockModel,
  BookmarkBlockType,
} from '../bookmark-model.js';
import {
  getBookmarkDefaultImages,
  STYLE_ICON_NAMES,
  STYLE_TOOLTIPS,
  STYLE_VALUES,
} from './config.js';

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
    const images = getBookmarkDefaultImages();
    const { style: currentStyle } = this.model;
    return html`${repeat(
      STYLE_VALUES,
      style => style,
      (style, index) => {
        return html`
          <icon-button
            width="76px"
            height="76px"
            class=${classMap({
              selected: currentStyle === style,
            })}
            @click=${() => this._setBookmarkStyle(style)}
          >
            ${images[STYLE_ICON_NAMES[index]]}
            <affine-tooltip .offset=${4}
              >${STYLE_TOOLTIPS[index]}</affine-tooltip
            >
          </icon-button>
        `;
      }
    )} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card-style-menu': BookmarkCardStyleMenu;
  }
}
