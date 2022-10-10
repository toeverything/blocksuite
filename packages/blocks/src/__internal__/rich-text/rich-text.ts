import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { BlockHost, hotkeyManager } from '@blocksuite/shared';
import type { BaseBlockModel } from '@blocksuite/store';
import { createKeyboardBindings } from './keyboard';

import style from './styles.css';

Quill.register('modules/cursors', QuillCursors);

@customElement('rich-text')
export class RichText extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

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
    const { store, selection } = host;
    const keyboardBindings = createKeyboardBindings(store, model, selection);
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
    });
    store.attachRichText(model.id, this._quill);
    store.awareness.updateLocalCursor();
    this._bindHotKey();
    this.model.propsUpdated.on(() => this.requestUpdate());
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .addEventListener('focus', this._focus.bind(this));
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .addEventListener('blur', this._blur.bind(this));
    hotkeyManager.setScope(this.model.id);
  }

  private _focus() {
    hotkeyManager.setScope(this.model.id);
  }
  private _blur() {
    hotkeyManager.setScope('page');
  }

  private _bindHotKey() {
    hotkeyManager.addListener(
      hotkeyManager.hotkeysMap.selectAll,
      this.model.id,
      this._onSelectAll
    );
  }

  private _onSelectAll() {
    // console.log('selectAll', e);
  }

  disconnectedCallback() {
    this.host.store.detachRichText(this.model.id);
    super.disconnectedCallback();
    this._textContainer.removeEventListener('focus', this._focus);
    this._textContainer.removeEventListener('blur', this._blur);
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
