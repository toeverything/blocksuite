import type { DocMode } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { BlockModel, Doc } from '@blocksuite/store';

import { stopPropagation } from '@blocksuite/affine-shared/utils';
import {
  docContext,
  modelContext,
  ShadowlessElement,
  stdContext,
} from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { Text } from '@blocksuite/store';
import { consume } from '@lit/context';
import { css, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';

import { focusTextModel } from '../rich-text/index.js';

export interface BlockCaptionProps {
  caption: string | null | undefined;
}

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

  show = () => {
    this.display = true;
    this.updateComplete.then(() => this.input.focus()).catch(console.error);
  };

  get mode(): DocMode {
    return this.doc.getParent(this.model)?.flavour === 'affine:surface'
      ? 'edgeless'
      : 'page';
  }

  private _onCaptionKeydown(event: KeyboardEvent) {
    event.stopPropagation();

    if (this.mode === 'edgeless' || event.isComposing) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const doc = this.doc;
      const target = event.target as HTMLInputElement;
      const start = target.selectionStart;
      if (start === null) {
        return;
      }

      const model = this.model;
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

      focusTextModel(this.std, id);
    }
  }

  private _onInputBlur() {
    this._focus = false;
    this.display = !!this.caption?.length;
  }

  private _onInputChange(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this.caption = target.value;
    this.doc.updateBlock(this.model, {
      caption: this.caption,
    });
  }

  private _onInputFocus() {
    this._focus = true;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.caption = this.model.caption;

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        if (key === 'caption') {
          this.caption = this.model.caption;
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
      .disabled=${this.doc.readonly}
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

  @state()
  accessor caption: string | null | undefined = undefined;

  @state()
  accessor display = false;

  @consume({ context: docContext })
  accessor doc!: Doc;

  @query('.block-caption-editor')
  accessor input!: HTMLInputElement;

  @consume({ context: modelContext })
  accessor model!: Model;

  @consume({ context: stdContext })
  accessor std!: BlockStdScope;
}

declare global {
  interface HTMLElementTagNameMap {
    'block-caption-editor': BlockCaptionEditor;
  }
}
