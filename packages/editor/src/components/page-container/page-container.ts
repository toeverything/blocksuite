import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { BlockHost, HotKeysManage } from '@blocksuite/shared';
import { SelectionManager, MouseManager } from '../..';
import { Store } from '@blocksuite/store';
import { BlockMap } from '../../block-loader';
import { Clipboard } from '../../clipboard';
import './debug-menu';
type PageBlockModel = InstanceType<typeof BlockMap.page>;

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

@customElement('page-container')
export class PageContainer extends LitElement implements BlockHost {
  @state()
  store = new Store(room).register(BlockMap);

  @state()
  model!: PageBlockModel;

  @state()
  mouse = new MouseManager(this.addEventListener.bind(this));

  @state()
  selection = new SelectionManager(this);

  @state()
  clipboard = new Clipboard(this, this);

  @state()
  isEmptyPage = true;

  @query('.affine-block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  @state()
  placeholderModel = new BlockMap.page(this.store, {});

  constructor() {
    super();

    this._subscribeStore();
    this._tryInitFromVoidState();
    // @ts-ignore
    window.store = this.store;
    // @ts-ignore
    window.page = this;
    this._bindHotkeys();
    HotKeysManage.useScope('page');
  }

  private _bindHotkeys() {
    HotKeysManage.addHotkey(
      HotKeysManage.hotkeysMap.undo,
      'page',

      () => {
        this.store.undo();
      }
    );
    HotKeysManage.addHotkey('ctrl+i', 'all', () => {
      console.log('123123123');
    });
    HotKeysManage.addHotkey(HotKeysManage.hotkeysMap.redo, 'page', () => {
      this.store.redo();
    });
    HotKeysManage.addHotkey(
      HotKeysManage.hotkeysMap.selectAll,
      'page',
      (e: Event) => {
        console.log('select all');
        e.preventDefault();
        this.selection.selectedBlockIds = ['1', '2', '3'];
      }
    );
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
        .affine-page-container {
          position: relative;
          padding: 10px 70px;
        }
      </style>
      <div class="affine-page-container">
        <debug-menu .page=${this as PageContainer}></debug-menu>
        <selection-rect
          .selectionManager=${this.selection}
          .pageModel=${this.model}
          .page=${this as PageContainer}
        ></selection-rect>
        ${this.isEmptyPage ? placeholderRoot : blockRoot}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-container': PageContainer;
  }
}
