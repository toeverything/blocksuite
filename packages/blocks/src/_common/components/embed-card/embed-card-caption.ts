import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Text } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { AttachmentBlockComponent } from '../../../attachment-block/attachment-block.js';
import type { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/surface-ref-block.js';
import { stopPropagation } from '../../utils/event.js';
import { asyncFocusRichText } from '../../utils/selection.js';

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
    | AttachmentBlockComponent
    | BookmarkBlockComponent
    | ImageBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent
    | EmbedFigmaBlockComponent
    | EmbedLinkedDocBlockComponent
    | SurfaceRefBlockComponent;

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
    this.block.model.page.updateBlock(this.block.model, {
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
    this.block.std.event.activate();

    if (this.block.isInSurface || event.isComposing) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const page = this.block.page;
      const target = event.target as HTMLInputElement;
      const start = target.selectionStart;
      if (start === null) {
        return;
      }

      const model = this.block.model;
      const parent = page.getParent(model);
      if (!parent) {
        return;
      }

      const value = target.value;
      const caption = value.slice(0, start);
      page.updateBlock(model, { caption });

      const nextBlockText = value.slice(start);
      const index = parent.children.indexOf(model);
      const id = page.addBlock(
        'affine:paragraph',
        { text: new Text(nextBlockText) },
        parent,
        index + 1
      );

      asyncFocusRichText(this.block.host, model.page, id)?.catch(console.error);
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
      .disabled=${this.block.page.readonly}
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
