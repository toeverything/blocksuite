import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { Store } from '@blocksuite/store';
import { BlockHost, hotkeyManager } from '@blocksuite/shared';
import {
  SelectionManager,
  MouseManager,
  ClipboardManager,
  ContentParser,
} from '../..';
import { BlockSchema } from '../../block-loader';
import './debug-menu';

type PageBlockModel = InstanceType<typeof BlockSchema.page>;

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

@customElement('editor-container')
export class EditorContainer extends LitElement implements BlockHost {
  @state()
  store = new Store(room).register(BlockSchema);

  @state()
  model!: PageBlockModel;

  @state()
  mouse = new MouseManager(this);

  @state()
  selection = new SelectionManager(this);

  @state()
  clipboard = new ClipboardManager(this, this);

  @state()
  contentParser = new ContentParser(this);

  @state()
  isEmptyPage = true;

  @query('.affine-block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  @state()
  placeholderModel = new BlockSchema.page(this.store, {});

  constructor() {
    super();

    this._subscribeStore();
    this._bindHotkeys();
    this._tryInitFromVoidState();

    // @ts-ignore
    window.store = this.store;
    // @ts-ignore
    window.page = this;
  }

  private _bindHotkeys() {
    const { undo, redo, selectAll } = hotkeyManager.hotkeysMap;
    const scope = 'page';

    hotkeyManager.addListener(undo, scope, () => this.store.undo());
    hotkeyManager.addListener(redo, scope, () => this.store.redo());
    hotkeyManager.addListener(selectAll, scope, (e: Event) => {
      e.preventDefault();
      const pageChildrenBlock = this.model.children.map(block => block.id);
      this.selection.selectedBlockIds = pageChildrenBlock;
    });
    hotkeyManager.setScope('page');
  }

  private _subscribeStore() {
    // if undo to empty page, reset to empty placeholder
    this.store.slots.updated.on(() => {
      this.isEmptyPage = this.store.isEmpty;
    });

    this.store.slots.rootAdded.on(block => {
      this.model = block as PageBlockModel;
      this.model.childrenUpdated.on(() => this.requestUpdate());
      this.requestUpdate();
    });
  }

  private _initFromVoidState() {
    if (!this.isEmptyPage) return;

    this.store.addBlock({ flavour: 'page' });
    this.store.addBlock({ flavour: 'paragraph' });

    this.isEmptyPage = false;
  }

  private _tryInitFromVoidState() {
    window.addEventListener('mousemove', () => this._initFromVoidState(), {
      once: true,
    });
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this._placeholderInput?.focus();
  }

  disconnectedCallback() {
    this.mouse.dispose();
    this.selection.dispose();
  }

  render() {
    const placeholderRoot = html`
      <page-block-element
        .model=${this.placeholderModel}
        .host=${this as BlockHost}
      ></page-block-element>
    `;

    const blockRoot = html`
      <page-block-element
        .model=${this.model}
        .host=${this as BlockHost}
      ></page-block-element>
    `;

    return html`
      <style>
        .affine-editor-container {
          position: relative;
          padding: 10px 70px;
        }
      </style>
      <div class="affine-editor-container">
        <debug-menu .editor=${this as EditorContainer}></debug-menu>
        <selection-rect
          .selectionManager=${this.selection}
          .pageModel=${this.model}
          .editor=${this as EditorContainer}
        ></selection-rect>
        ${this.isEmptyPage ? placeholderRoot : blockRoot}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }
}
