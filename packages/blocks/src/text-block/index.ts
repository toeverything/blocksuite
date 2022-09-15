import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Store } from '@building-blocks/core';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import style from 'quill/dist/quill.snow.css';
import { createkeyboardBindings } from './keyboard';
import { BaseBlockModel, IBaseBlockModel } from '../base';

Quill.register('modules/cursors', QuillCursors);

export interface ITextBlockModel extends IBaseBlockModel {
  type: 'text';
  text: string;
}

export class TextBlockModel extends BaseBlockModel implements ITextBlockModel {
  type = 'text' as const;
  text = '';

  constructor(store: Store, props: Partial<ITextBlockModel>) {
    super(store, props);
    this.text = props.text as string;
  }
}

@customElement('text-block-element')
export class TextBlockElement extends LitElement {
  @query('.text-block.quill-container')
  textContainer!: HTMLDivElement;

  @property({ type: Store })
  store!: Store;

  @property({ type: TextBlockModel })
  model!: TextBlockModel;

  @property()
  id!: string;

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  private _initEditorContainer(store: Store, model: TextBlockModel) {
    const { textContainer } = this;
    const keyboardBindings = createkeyboardBindings(store);
    const quill = new Quill(textContainer, {
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
    quill.focus();
    store.attachText(model.id, model.text, quill);
    store.captureSync();
  }

  protected firstUpdated() {
    this._initEditorContainer(this.store, this.model);
  }

  render() {
    return html`
      <style>
        ${style} .text-block.quill-container {
          margin-bottom: 12px;
        }
        .ql-editor {
          padding: 6px;
        }
      </style>
      <div data-id="${this.id}" class="text-block quill-container"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-block-element': TextBlockElement;
  }
}
