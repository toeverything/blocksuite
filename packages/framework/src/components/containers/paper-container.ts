import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { SelectionManager, MouseManager } from '../..';
import { Store, noop } from '@building-blocks/store';
import { RichText } from '../rich-text/rich-text';
// FIXME circular deps
import {
  ITextBlockModel,
  TextBlockModel,
  PageBlockModel,
} from '../../../../blocks';

// avoid being tree-shaked
noop(RichText);

const room =
  new URLSearchParams(location.search).get('room') || 'virgo-default';

@customElement('paper-container')
export class PaperContainer extends LitElement {
  @state()
  store = new Store(room);

  @state()
  model = new PageBlockModel(this.store);

  @state()
  mouse = new MouseManager(this.addEventListener.bind(this));

  @state()
  selection = new SelectionManager(this);

  @state()
  connectionBtnText = 'Disconnect';

  @state()
  isEmptyPage = true;

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  @query('.block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

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
        flavour: 'text',
        id: this.store.createId(),
        text: '',
      };
      this.store.addBlock(blockProps);
    }
  }

  private _onToggleConnection() {
    if (this.connectionBtnText === 'Disconnect') {
      this.store.provider.disconnect();
      this.connectionBtnText = 'Connect';
    } else {
      this.store.provider.connect();
      this.connectionBtnText = 'Disconnect';
    }
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this._placeholderInput.focus();
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

    const debugButtons = html`
      <div style="margin-bottom: 10px">
        <button .disabled=${!this.canUndo} @click=${() => this.store.undo()}>
          Undo
        </button>
        <button .disabled=${!this.canRedo} @click=${() => this.store.redo()}>
          Redo
        </button>
        <button @click=${this._onToggleConnection}>
          ${this.connectionBtnText}
        </button>
      </div>
    `;

    const blockRoot = html`
      <page-block-element
        .model=${this.model}
        .store=${this.store}
      ></page-block-element>
    `;

    return html`
      <style>
        .paper-container {
          position: relative;
        }
      </style>
      <div class="paper-container">
        ${debugButtons}
        <selection-rect .mouse=${this.mouse}></selection-rect>
        ${this.isEmptyPage ? emptyPagePlaceholder : blockRoot}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'paper-container': PaperContainer;
  }
}
