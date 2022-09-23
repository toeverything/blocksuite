import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { SelectionManager, MouseManager } from '../..';
import { Store } from '@building-blocks/store';
import { BlockMap } from '../../block-loader';
import { Clipboard } from '../../clipboard';
import './debug-menu';

type PageBlockModel = InstanceType<typeof BlockMap.page>;

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

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
    this.store.addBlock({ flavour: 'text', text: '' });

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
        .store=${this.store}
        .page=${this as PageContainer}
      ></page-block-element>
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
