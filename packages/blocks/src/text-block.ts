import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { DebugProvider, Store, TextBinding } from '@building-blocks/core';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import style from 'quill/dist/quill.snow.css';

Quill.register('modules/cursors', QuillCursors);

@customElement('text-block')
export class TextBlock extends LitElement {
  @query('#text-container')
  textContainer!: HTMLDivElement;

  @property({ type: Store })
  store!: Store;

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  private _initEditorContainer(store: Store, i: number) {
    const provider = new DebugProvider(`quill-demo-${i}`, store.doc);
    const yText = store.doc.getText(`q-${i}`);
    store.history.addToScope([yText]);

    const { textContainer } = this;

    const quill = new Quill(textContainer, {
      modules: {
        cursors: false,
        toolbar: false,
        history: {
          maxStack: 0,
          userOnly: true,
        },
        keyboard: {
          bindings: {
            undo: {
              key: 'z',
              shortKey: true,
              handler() {
                store.history.undo();
                return false;
              },
            },
            redo: {
              key: 'z',
              shiftKey: true,
              shortKey: true,
              handler() {
                store.history.redo();
                return false;
              },
            },
          },
        },
      },
      theme: 'snow', // or 'bubble'
    });

    const binding = new TextBinding(yText, quill, provider.awareness);
    store.containers.push({ provider, quill, yText, binding });
  }

  protected firstUpdated() {
    this._initEditorContainer(this.store, 0);
  }

  render() {
    return html`
      <style>
        ${style}
      </style>
      <div>
        <div id="text-container"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-block': TextBlock;
  }
}
