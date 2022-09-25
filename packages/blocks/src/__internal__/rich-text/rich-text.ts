import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import style from 'quill/dist/quill.snow.css';
import type { BlockHost } from '@blocksuite/shared';
import type { BaseBlockModel } from '@blocksuite/store';
import { createKeyboardBindings } from './keyboard';

Quill.register('modules/cursors', QuillCursors);

@customElement('rich-text')
export class RichText extends LitElement {
  @query('.affine-rich-text.quill-container')
  private _textContainer!: HTMLDivElement;
  private _quill?: Quill;

  @property()
  host!: BlockHost;

  @property()
  model!: BaseBlockModel;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    const { host, model, _textContainer } = this;
    const { store } = host;
    const keyboardBindings = createKeyboardBindings(store, model);
    this._quill = new Quill(_textContainer, {
      modules: {
        cursors: true,
        toolbar: false,
        history: {
          maxStack: 0,
          userOnly: true,
        },
        keyboard: {
          bindings: keyboardBindings,
        },
      },
      theme: 'snow',
    });
    store.attachRichText(model.id, this._quill);
    store.awareness.updateLocalCursor();
  }

  disconnectedCallback() {
    this.host.store.detachRichText(this.model.id);

    super.disconnectedCallback();
  }

  render() {
    return html`
      <style>
        ${style} .affine-rich-text.quill-container {
          margin-bottom: 0px;
        }
        .ql-editor {
          padding: 2px;
        }
        .affine-rich-text.ql-container.ql-snow {
          /* border: 0; */
          border: 1px #eee dashed;
        }
      </style>
      <div class="affine-rich-text quill-container"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
