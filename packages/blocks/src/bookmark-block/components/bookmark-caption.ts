import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { stopPropagation } from '../../_common/utils/event.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';

@customElement('bookmark-caption')
export class BookmarkCaption extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-bookmark-caption {
      width: 100%;
      font-size: var(--affine-font-sm);
      outline: none;
      border: 0;
      font-family: inherit;
      text-align: center;
      color: var(--affine-icon-color);
      display: inline-block;
      background: transparent;
    }
    .affine-bookmark-caption::placeholder {
      color: var(--affine-placeholder-color);
    }
  `;

  @query('.affine-bookmark-caption')
  input!: HTMLInputElement;

  @property({ attribute: false })
  bookmark!: BookmarkBlockComponent;

  @property({ attribute: false })
  display!: boolean;

  get caption() {
    return this.bookmark.model.caption ?? '';
  }

  private _onInputChange() {
    this.bookmark.model.page.updateBlock(this.bookmark.model, {
      caption: this.input.value,
    });
    this.requestUpdate();
  }

  private _onInputBlur() {
    this.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
  }

  override render() {
    if (!this.display) return nothing;
    const model = this.bookmark.model;

    return html`<input
      .disabled=${model.page.readonly}
      placeholder="Write a caption"
      class="affine-bookmark-caption"
      value=${this.caption}
      @input=${this._onInputChange}
      @blur=${this._onInputBlur}
      @pointerdown=${stopPropagation}
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-caption': BookmarkCaption;
  }
}
