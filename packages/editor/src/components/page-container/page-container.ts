import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { SelectionManager, MouseManager } from '../..';
import { Store } from '@building-blocks/store';
import { BlockMap, TextBlockProps } from '../../block-loader';
import { Clipboard } from '../../clipboard';

type PageBlockModel = InstanceType<typeof BlockMap.page>;

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';
const initType = params.get('init') || 'default';

@customElement('page-container')
export class PageContainer extends LitElement {
  @state()
  store = new Store(room).register(BlockMap);

  @state()
  model!: PageBlockModel;

  @state()
  mouse = new MouseManager(this.addEventListener.bind(this));

  @state()
  selection = new SelectionManager(this);

  @state()
  clipboard1 = new Clipboard(this, this);

  @state()
  connectionBtnText = 'Disconnect';

  @state()
  isEmptyPage = true;

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  @state()
  selectionInfo = this.selection.selectionInfo;

  @query('.block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  constructor() {
    super();

    this._subscribeStore();
    this._handleDebugInit();

    // @ts-ignore
    window.store = this.store;
  }

  private _subscribeStore() {
    // if undo to empty page, reset to empty placeholder
    this.store.slots.updated.on(() => {
      this.isEmptyPage = this.store.isEmpty;
    });

    this.store.slots.historyUpdated.on(() => {
      this.canUndo = this.store.canUndo;
      this.canRedo = this.store.canRedo;
    });

    this.store.slots.blockAdded.on(block => {
      if (block.flavour === 'page') {
        this.store.setRoot(block);
        this.model = block as PageBlockModel;
      } else {
        if (!this.model.children.find(child => child.id === block.id)) {
          this.model.children.push(block);
        }

        this.requestUpdate();
      }
    });

    this.store.slots.blockDeleted.on(id => {
      const index = this.model.children.findIndex(child => child.id === id);
      if (index !== -1) {
        this.model.children.splice(index, 1);
      }

      this.isEmptyPage = this.model.children.length === 0;
      this.requestUpdate();
    });
  }

  private _onVoidStateUpdate(e?: MouseEvent | KeyboardEvent) {
    if (e) e.preventDefault();

    if (this.isEmptyPage) {
      this.isEmptyPage = false;

      this.store.addBlock({
        flavour: 'page',
        children: [],
      });

      const textProps: Partial<TextBlockProps> = {
        flavour: 'text',
        text: '',
      };
      const id = this.store.addBlock(textProps);
      setTimeout(() => {
        this.store.textAdapters.get(id)?.quill.focus();
      });
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

  private _onAddList() {
    if (this.isEmptyPage) {
      this._onVoidStateUpdate();
    }

    this.store.addBlock({
      flavour: 'list',
      children: [],
    });
  }

  private _onDeleteSelected() {
    this.selectionInfo?.selectedNodesIds?.forEach(id => {
      this.store.deleteBlockById(id);
    });
  }

  private _handleDebugInit() {
    if (initType === 'list') {
      this.store.addBlock({
        flavour: 'page',
        children: [],
      });
      for (let i = 0; i < 3; i++) {
        this.store.addBlock({
          flavour: 'list',
          children: [],
        });
      }
    }
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this._placeholderInput?.focus();

    this.selection.onSelectionChange(selectionInfo => {
      this.selectionInfo = selectionInfo;
    });
  }

  disconnectedCallback() {
    this.mouse.dispose();
    this.selection.dispose();
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
          padding: 6px;
          padding-left: 5px;
          width: 100%;
          height: 30.45px;
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
        <button @click=${this._onAddList}>Add List</button>
        <button
          .disabled=${this.selectionInfo.type !== 'Block' ||
          !this.selectionInfo?.selectedNodesIds.length}
          @click=${this._onDeleteSelected}
        >
          Delete
        </button>
      </div>
    `;

    const blockRoot = html`
      <page-block-element
        .model=${this.model}
        .store=${this.store}
        .page=${this as PageContainer}
      ></page-block-element>
    `;

    return html`
      <style>
        .page-container {
          position: relative;
          padding: 0 70px;
        }
      </style>
      <div class="page-container">
        ${debugButtons}
        <selection-rect
          .selectionManager=${this.selection}
          .pageModel=${this.model}
          .page=${this as PageContainer}
        ></selection-rect>
        ${this.isEmptyPage ? emptyPagePlaceholder : blockRoot}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-container': PageContainer;
  }
}
