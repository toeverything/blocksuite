import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import style from 'quill/dist/quill.snow.css';
import { Store } from '@building-blocks/store';
import { createKeyboardBindings } from './keyboard';

Quill.register('modules/cursors', QuillCursors);

interface EditableModel {
  id: string;
  text: string;
}

@customElement('rich-text')
export class RichText extends LitElement {
  @query('.rich-text.quill-container')
  private _textContainer!: HTMLDivElement;
  private _quill?: Quill;

  @property()
  store!: Store;

  @property()
  model!: EditableModel;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    const { store, model } = this;
    const { _textContainer } = this;
    const keyboardBindings = createKeyboardBindings(store);
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
    store.attachText(model.id, this._quill);
    this._quill.focus();
  }

  render() {
    return html`
      <style>
        ${style} .rich-text.quill-container {
          margin-bottom: 12px;
        }
        .ql-editor {
          padding: 6px;
        }
      </style>
      <div class="rich-text quill-container"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
