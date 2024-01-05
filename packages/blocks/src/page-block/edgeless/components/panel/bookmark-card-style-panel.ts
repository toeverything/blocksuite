import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { getBookmarkDefaultImages } from '../../../../bookmark-block/components/config.js';
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
    const {
      LargeHorizontalCardIcon,
      SmallHorizontalCardIcon,
      LargeVerticalCardIcon,
      SmallVerticalCardIcon,
    } = getBookmarkDefaultImages();
    return html`
      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'horizontal',
        })}
        @click=${() => this.onSelect('horizontal')}
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
          selected: this.value === 'list',
        })}
        @click=${() => this.onSelect('list')}
      >
        ${SmallHorizontalCardIcon}
        <affine-tooltip .offset=${4}
          >${'Small horizontal style'}</affine-tooltip
        >
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'vertical',
        })}
        @click=${() => this.onSelect('vertical')}
      >
        ${LargeVerticalCardIcon}
        <affine-tooltip .offset=${4}>${'Large vertical style'}</affine-tooltip>
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'cube',
        })}
        @click=${() => this.onSelect('cube')}
      >
        ${SmallVerticalCardIcon}
        <affine-tooltip .offset=${4}>${'Small vertical style'}</affine-tooltip>
      </icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card-style-panel': BookmarkCardStylePanel;
  }
}
