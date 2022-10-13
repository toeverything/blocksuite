import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { BlockHost, hotkeyManager } from '@blocksuite/shared';
import type { BaseBlockModel, Store } from '@blocksuite/store';
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
  private _quill?: Quill;
  private _firstSelectAll = true;
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
    this._bindHotKey(store, selection);
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
    this._firstSelectAll = true;
    hotkeyManager.setScope(this.model.id);
  }
  private _blur() {
    this._firstSelectAll = true;
    hotkeyManager.setScope('page');
  }

  private _bindHotKey(_store: Store, _selection: BlockHost['selection']) {
    hotkeyManager.addListener(
      hotkeyManager.hotkeysMap.code,
      this.model.id,
      () => {
        const range = this._quill?.getSelection();
        if (range) {
          _store.captureSync();
          _store.transact(() => {
            const { index, length } = range;
            const format = this._quill?.getFormat(range);
            if (format?.code) {
              this.model?.text?.format(index, length, { code: false });
            } else {
              this.model?.text?.format(index, length, { code: true });
            }
          });
        }
      }
    );
    hotkeyManager.addListener(
      hotkeyManager.hotkeysMap.strikethrough,
      this.model.id,
      () => {
        const range = this._quill?.getSelection();
        if (range) {
          _store.captureSync();
          _store.transact(() => {
            const { index, length } = range;
            const format = this._quill?.getFormat(range);
            if (format?.strike) {
              this.model?.text?.format(index, length, { strike: false });
            } else {
              this.model?.text?.format(index, length, { strike: true });
            }
          });
        }
      }
    );
    hotkeyManager.addListener(
      hotkeyManager.hotkeysMap.selectAll,
      this.model.id,
      (e: Event) => {
        e.preventDefault();
        if (
          !this._firstSelectAll &&
          this._quill?.getSelection()?.length !== 0
        ) {
          this._quill?.blur();
          // XXX because blur is async, we need to wait for it to finish
          setTimeout(() => {
            _selection.selectAllBlocks();
          });
        } else {
          this._quill?.setSelection(0, this._quill.getLength());
        }

        this._firstSelectAll = false;
      }
    );
  }

  disconnectedCallback() {
    this.host.store.detachRichText(this.model.id);
    super.disconnectedCallback();
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .removeEventListener('focus', this._focus);
    this._textContainer
      .getElementsByClassName('ql-editor')[0]
      .removeEventListener('blur', this._blur);
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
