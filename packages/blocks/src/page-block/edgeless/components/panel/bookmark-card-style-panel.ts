import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  getBookmarkDefaultImages,
  STYLE_ICON_NAMES,
  STYLE_TOOLTIPS,
  STYLE_VALUES,
} from '../../../../bookmark-block/components/config.js';
import type { BookmarkBlockType } from '../../../../index.js';

@customElement('bookmark-card-style-panel')
export class BookmarkCardStylePanel extends WithDisposable(LitElement) {
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
  value!: string;

  @property({ attribute: false })
  onSelect!: (value: BookmarkBlockType) => void;

  override render() {
    const images = getBookmarkDefaultImages();
    return html`${repeat(
      STYLE_VALUES,
      style => style,
      (style, index) => {
        return html`
          <icon-button
            size="76px"
            class=${classMap({
              selected: this.value === style,
            })}
            @click=${() => this.onSelect(style)}
          >
            ${images[STYLE_ICON_NAMES[index]]}
            <affine-tooltip .offset=${12} .placement=${'bottom'}
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
    'bookmark-card-style-panel': BookmarkCardStylePanel;
  }
}
