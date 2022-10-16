import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { BlockHost, hotkey, HOTKEYS } from '../utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { createKeyboardBindings } from './keyboard';

import style from './styles.css';

Quill.register('modules/cursors', QuillCursors);

const Strike = Quill.import('formats/strike');
// Quill uses <s> by default，but <s> is not supported by HTML5
Strike.tagName = 'del';
Quill.register(Strike, true);

@customElement('rich-text')
export class RichText extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @query('.affine-rich-text.quill-container')
  private _textContainer!: HTMLDivElement;
  private _firstSelectAll = true;

  quill!: Quill;

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

    this.quill = new Quill(_textContainer, {
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
    });
    store.attachRichText(model.id, this.quill);
    store.awareness.updateLocalCursor();

    this.model.propsUpdated.on(() => this.requestUpdate());
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .addEventListener('focus', this._onRichTextFocus.bind(this));
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .addEventListener('blur', this._onRichTextBlur.bind(this));

    this._bindHotKey();
    hotkey.setScope(this.model.id);
  }

  private _onRichTextFocus() {
    this._firstSelectAll = true;
    hotkey.setScope(this.model.id);
  }

  private _onRichTextBlur() {
    this._firstSelectAll = true;
    hotkey.setScope('page');
  }

  private _bindHotKey() {
    hotkey.addListener(HOTKEYS.SELECT_ALL, this.model.id, (e: Event) => {
      e.preventDefault();
      if (!this._firstSelectAll && this.quill?.getSelection()?.length !== 0) {
        this.quill?.blur();
        // TODO select all blocks
      } else {
        this.quill?.setSelection(0, this.quill.getLength());
      }
      this._firstSelectAll = false;
    });
  }

  disconnectedCallback() {
    this.host.store.detachRichText(this.model.id);
    super.disconnectedCallback();
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .removeEventListener('focus', this._onRichTextFocus);
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .removeEventListener('blur', this._onRichTextBlur);
  }

  render() {
    return html`
      <div class="affine-rich-text quill-container ql-container"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
