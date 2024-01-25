import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';
import type { AttachmentBlockComponent } from '../../../index.js';
import { stopPropagation } from '../../utils/event.js';

@customElement('embed-card-caption')
export class EmbedCardCaption extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-embed-card-caption {
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
    .affine-embed-card-caption::placeholder {
      color: var(--affine-placeholder-color);
    }
  `;

  @property({ attribute: false })
  block!:
    | AttachmentBlockComponent
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent
    | EmbedFigmaBlockComponent
    | EmbedLinkedDocBlockComponent;

  @property({ attribute: false })
  display!: boolean;

  @query('.affine-embed-card-caption')
  input!: HTMLInputElement;

  get caption() {
    return this.block.model.caption ?? '';
  }

  private _onInputChange() {
    this.block.model.page.updateBlock(this.block.model, {
      caption: this.input.value,
    });
  }

  private _onInputBlur() {
    this.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      this.block.model.propsUpdated.on(({ key }) => {
        if (key === 'caption') {
          this.input.value = this.block.model.caption ?? '';
        }
      })
    );
  }

  override render() {
    if (!this.display) return nothing;
    const model = this.block.model;

    return html`<input
      .disabled=${model.page.readonly}
      placeholder="Write a caption"
      class="affine-embed-card-caption"
      value=${this.caption}
      @input=${this._onInputChange}
      @blur=${this._onInputBlur}
      @pointerdown=${stopPropagation}
      @pointerup=${stopPropagation}
      @click=${stopPropagation}
      @dblclick=${stopPropagation}
      @cut=${stopPropagation}
      @copy=${stopPropagation}
      @paste=${stopPropagation}
      @keydown=${stopPropagation}
      @keyup=${stopPropagation}
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-caption': EmbedCardCaption;
  }
}
