import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import style from 'quill/dist/quill.snow.css';

import { BlockHost, hotkeyManager } from '@blocksuite/shared';
import type { BaseBlockModel } from '@blocksuite/store';

import type { ListBlockModel, ParagraphBlockModel } from '../..';
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
      theme: 'snow',
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
    hotkeyManager.addListener(
      hotkeyManager.hotkeysMap.code,
      this.model.id,
      ()=>{
       const range = this._quill?.getSelection()
       if(range){
         const {index, length} = range;
        let format = this._quill?.getFormat(range);
        if(format?.code){
          this._quill?.removeFormat(index, length)
        }else{
          this._quill?.formatText(index, length, {                   // unbolds 'hello' and set its color to blue
            'bold': false,
            'code':'pre'
          });
        }
       }   
      }
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
    const { type } = this.model as ParagraphBlockModel | ListBlockModel;

    return html`
      <style>
        ${style} .affine-rich-text.quill-container {
          margin-bottom: 0px;
        }
        .ql-editor {
          padding: 2px;
        }
        .affine-rich-text.quill-container.ql-snow {
          /* border: 0; */
          border: 1px #eee dashed;
        }
        .affine-rich-text.quill-container.h1 p {
          font-size: 28px;
        }
        .affine-rich-text.quill-container.h2 p {
          font-size: 24px;
        }
        .affine-rich-text.quill-container.h3 p {
          font-size: 20px;
        }
        .affine-rich-text.quill-container.quote p {
          font-size: 13px;
          color: grey;
        }
        .affine-rich-text.quill-container.text p {
          font-size: 13px;
        }
      </style>
      <div
        class="affine-rich-text quill-container ql-container ql-snow ${type}"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
