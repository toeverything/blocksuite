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

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  store = new Store();

  @property()
  model = new PageBlockModel(this.store);

  @property()
  btnText = 'Disconnect';

  @property()
  isVoidState = true;

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
    const onceDisposable = this.store.slots.update.on(() => {
      this.isVoidState = false;
      onceDisposable.dispose();
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
  }

  private _onVoidStateClick() {
    if (this.isVoidState) {
      this.isVoidState = false;

      const blockProps: ITextBlockModel = {
        type: 'text',
        id: this.store.createId(),
        parentId: this.model.id,
        text: '',
      };
      this.store.addBlock(blockProps);
    }
  }

  protected firstUpdated() {
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
    const voidStatePlaceholder = html`
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
      <div @click=${this._onVoidStateClick} class="block-placeholder">
        <input class="block-placeholder-input" />
      </div>
    `;

    const blockContent = html`
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
    `;

    const connectionBtn = html`<button @click=${this._onToggleConnection}>
      ${this.btnText}
    </button>`;

    return [
      this.isVoidState ? voidStatePlaceholder : blockContent,
      connectionBtn,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}
