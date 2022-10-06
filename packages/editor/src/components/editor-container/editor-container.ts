import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { Store } from '@blocksuite/store';
import { ClipboardManager, ContentParser } from '../..';
import { BlockSchema } from '../../block-loader';

type PageBlockModel = InstanceType<typeof BlockSchema.page>;

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

@customElement('editor-container')
export class EditorContainer extends LitElement {
  @state()
  store = new Store(room).register(BlockSchema);

  @state()
  model!: PageBlockModel;

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

  render() {
    const placeholderRoot = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .store=${this.store}
        .model=${this.placeholderModel}
      ></default-page-block>
    `;

    const blockRoot = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .store=${this.store}
        .model=${this.model}
      ></default-page-block>
    `;

    return html`
      <style>
        .affine-editor-container {
          position: relative;
          padding: 10px 70px;
        }
      </style>
      <div class="affine-editor-container">
        <debug-menu .store=${this.store}></debug-menu>
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
