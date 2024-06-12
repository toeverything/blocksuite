import type { BlockElement } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { stopPropagation } from '../utils/event.js';
import { asyncFocusRichText } from '../utils/selection.js';

export interface BlockCaptionProps {
  caption: string | null | undefined;
}

@customElement('block-caption-editor')
export class BlockCaptionEditor<
  Model extends BlockModel<BlockCaptionProps> = BlockModel<BlockCaptionProps>,
> extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .block-caption-editor {
      display: inline-table;
      resize: none;
      width: 100%;
      outline: none;
      border: 0;
      background: transparent;
      color: var(--affine-icon-color);
      font-size: var(--affine-font-sm);
      font-family: inherit;
      text-align: center;
    }
    .block-caption-editor::placeholder {
      color: var(--affine-placeholder-color);
    }
  `;

  private _focus = false;

  @property({ attribute: false })
  accessor block!: BlockElement<Model> & { isInSurface?: boolean };

  @state()
  accessor display = false;

  @state()
  accessor caption: string | null | undefined = undefined;

  @query('.block-caption-editor')
  accessor input!: HTMLInputElement;

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

    return html`<textarea
      .disabled=${this.block.doc.readonly}
      placeholder="Write a caption"
      class="block-caption-editor"
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
    ></textarea>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'block-caption-editor': BlockCaptionEditor;
  }
}
