import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Store, TextBinding } from '@building-blocks/core';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import style from 'quill/dist/quill.snow.css';
import { createkeyboardBindings } from './keyboard';

Quill.register('modules/cursors', QuillCursors);

@customElement('text-block')
export class TextBlock extends LitElement {
  @query('.text-block.quill-container')
  textContainer!: HTMLDivElement;

  @property({ type: Store })
  store!: Store;

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  private _initEditorContainer(store: Store, id: string) {
    const yText = store.doc.getText(`q-${id}`);
    store.history.addToScope([yText]);

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
      theme: 'snow', // or 'bubble'
    });

    const binding = new TextBinding(yText, quill, store.provider.awareness);
    store.containers.push({ quill, binding });
  }

  protected firstUpdated() {
    this._initEditorContainer(this.store, this.store.getId());
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
      <div class="text-block quill-container"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-block': TextBlock;
  }
}
