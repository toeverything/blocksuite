import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { Text } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { AttachmentBlockComponent } from '../../../attachment-block/attachment-block.js';
import type { EmbedHtmlBlockComponent } from '../../../embed-html-block/embed-html-block.js';
import type { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/surface-ref-block.js';
import { stopPropagation } from '../../utils/event.js';
import { asyncFocusRichText } from '../../utils/selection.js';
import type { EmbedToolbarBlockElement } from './type.js';

@customElement('embed-card-caption')
export class EmbedCardCaption extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-embed-card-caption {
      display: inline-block;
      width: 100%;
      outline: none;
      border: 0;
      background: transparent;
      color: var(--affine-icon-color);
      font-size: var(--affine-font-sm);
      font-family: inherit;
      text-align: center;
    }
    .affine-embed-card-caption::placeholder {
      color: var(--affine-placeholder-color);
    }
  `;

  @property({ attribute: false })
  block!:
    | EmbedToolbarBlockElement
    | AttachmentBlockComponent
    | ImageBlockComponent
    | EmbedHtmlBlockComponent
    | SurfaceRefBlockComponent
    | EmbedSyncedDocBlockComponent;

  @state()
  display = false;

  @state()
  caption?: string | null;

  @query('.affine-embed-card-caption')
  input!: HTMLInputElement;

  private _focus = false;

  private _onInputChange(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this.caption = target.value;
    this.block.doc.updateBlock(this.block.model, {
      caption: this.caption,
    });
  }

  private _onInputFocus() {
    this._focus = true;
  }

  private _onInputBlur() {
    this._focus = false;
    this.display = !!this.caption?.length;
  }

  private _onCaptionKeydown(event: KeyboardEvent) {
    event.stopPropagation();

    if (this.block.isInSurface || event.isComposing) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const doc = this.block.doc;
      const target = event.target as HTMLInputElement;
      const start = target.selectionStart;
      if (start === null) {
        return;
      }

      const model = this.block.model;
      const parent = doc.getParent(model);
      if (!parent) {
        return;
      }

      const value = target.value;
      const caption = value.slice(0, start);
      doc.updateBlock(model, { caption });

      const nextBlockText = value.slice(start);
      const index = parent.children.indexOf(model);
      const id = doc.addBlock(
        'affine:paragraph',
        { text: new Text(nextBlockText) },
        parent,
        index + 1
      );

      asyncFocusRichText(this.block.host, id)?.catch(console.error);
    }
  }

  show = () => {
    this.display = true;
    this.updateComplete.then(() => this.input.focus()).catch(console.error);
  };

  override connectedCallback(): void {
    super.connectedCallback();

    this.caption = this.block.model.caption;

    this.disposables.add(
      this.block.model.propsUpdated.on(({ key }) => {
        if (key === 'caption') {
          this.caption = this.block.model.caption;
          if (!this._focus) {
            this.display = !!this.caption?.length;
          }
        }
      })
    );
  }

  override render() {
    if (!this.display && !this.caption) {
      return nothing;
    }

    return html`<input
      .disabled=${this.block.doc.readonly}
      placeholder="Write a caption"
      class="affine-embed-card-caption"
      .value=${this.caption ?? ''}
      @input=${this._onInputChange}
      @focus=${this._onInputFocus}
      @blur=${this._onInputBlur}
      @pointerdown=${stopPropagation}
      @click=${stopPropagation}
      @dblclick=${stopPropagation}
      @cut=${stopPropagation}
      @copy=${stopPropagation}
      @paste=${stopPropagation}
      @keydown=${this._onCaptionKeydown}
      @keyup=${stopPropagation}
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-caption': EmbedCardCaption;
  }
}
