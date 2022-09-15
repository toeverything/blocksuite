import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Store } from '@building-blocks/core';
import { TextBlockModel, ITextBlockModel } from '../text-block';
import { BaseBlockModel } from '../base';

export class PageBlockModel extends BaseBlockModel {
  type = 'page';
  children: TextBlockModel[] = [];

  constructor(store: Store) {
    super(store, { id: '0', parentId: '' });
  }
}

const room =
  new URLSearchParams(location.search).get('room') || 'virgo-default';

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  store = new Store(room);

  @property()
  model = new PageBlockModel(this.store);

  @property()
  btnText = 'Disconnect';

  @property()
  isEmptyPage = true;

  @property()
  canUndo = false;

  @property()
  canRedo = false;

  @query('.block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this._subscribeStore();
    // @ts-ignore
    window.store = this.store;
  }

  private _subscribeStore() {
    // if undo to empty page, reset to empty placeholder
    this.store.slots.update.on(() => {
      this.isEmptyPage = this.store.isEmpty;
    });

    this.store.slots.historyUpdate.on(() => {
      this.canUndo = this.store.canUndo;
      this.canRedo = this.store.canRedo;
    });

    this.store.slots.addBlock.on(blockProps => {
      const block = new TextBlockModel(
        this.store,
        blockProps as ITextBlockModel
      );
      if (!this.model.children.find(child => child.id === block.id)) {
        this.model.children.push(block);
      }

      this.requestUpdate();
    });

    this.store.slots.deleteBlock.on(id => {
      const index = this.model.children.findIndex(child => child.id === id);
      if (index !== -1) {
        this.model.children.splice(index, 1);
      }

      this.isEmptyPage = this.model.children.length === 0;
      this.requestUpdate();
    });
  }

  private _onVoidStateUpdate(e: MouseEvent | KeyboardEvent) {
    e.preventDefault();

    if (this.isEmptyPage) {
      this.isEmptyPage = false;

      const blockProps: ITextBlockModel = {
        type: 'text',
        id: this.store.createId(),
        parentId: this.model.id,
        text: '',
      };
      this.store.addBlock(blockProps);
      // after first block is added, never go back to empty block state
      queueMicrotask(() => {
        this.store.restHistory();
      });
    }
  }

  firstUpdated() {
    this._placeholderInput.focus();
  }

  private _onToggleConnection() {
    if (this.btnText === 'Disconnect') {
      this.store.provider.disconnect();
      this.btnText = 'Connect';
    } else {
      this.store.provider.connect();
      this.btnText = 'Disconnect';
    }
  }

  render() {
    const emptyPagePlaceholder = html`
      <style>
        .block-placeholder {
          box-sizing: border-box;
        }
        .block-placeholder-input {
          display: block;
          box-sizing: border-box;
          margin-bottom: 12px;
          padding: 6px;
          width: 100%;
          line-height: 1.4;
          border: 1px solid rgb(204, 204, 204);
          border-radius: 0;
          outline: none;
        }
      </style>
      <div
        @click=${this._onVoidStateUpdate}
        @keydown=${this._onVoidStateUpdate}
        class="block-placeholder"
      >
        <input class="block-placeholder-input" />
      </div>
    `;

    const blockContent = html`
      <div data-id="${this.id}">
        ${repeat(
          this.model.children,
          child => child.id,
          child =>
            html`<text-block-element
              .store=${this.store}
              .id=${child.id}
              .model=${child}
            />`
        )}
      </div>
    `;

    const buttons = html`
      <button @click=${this._onToggleConnection}>${this.btnText}</button>
      <button .disabled=${!this.canUndo} @click=${() => this.store.undo()}>
        Undo
      </button>
      <button .disabled=${!this.canRedo} @click=${() => this.store.redo()}>
        Redo
      </button>
    `;

    return [this.isEmptyPage ? emptyPagePlaceholder : blockContent, buttons];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}
