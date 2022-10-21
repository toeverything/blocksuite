import { LitElement, html } from 'lit';
import { customElement, state, property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { Store } from '@blocksuite/store';
import { ClipboardManager, ContentParser } from '../..';
import { BlockSchema } from '../../block-loader';

type PageBlockModel = InstanceType<typeof BlockSchema.page>;

const IS_PLAYGROUND = location.href.includes('5173');

@customElement('editor-container')
export class EditorContainer extends LitElement {
  @property()
  store!: Store;

  @state()
  mode: 'page' | 'edgeless' = 'page';

  @state()
  model!: PageBlockModel;

  // TODO only select block
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
    this._init();
  }

  private _init() {
    if (!this.store) {
      return;
    }
    this._subscribeStore();
    this._tryInitFromVoidState();

    // @ts-ignore
    window.store = this.store;
    // @ts-ignore
    window.editor = this;
  }

  private _subscribeStore() {
    // if undo to empty page, reset to empty placeholder
    this.store.signals.updated.on(() => {
      this.isEmptyPage = this.store.isEmpty;
    });

    this.store.signals.rootAdded.on(block => {
      this.model = block as PageBlockModel;
      this.model.childrenUpdated.on(() => this.requestUpdate());
      this.requestUpdate();
    });
  }

  private _initFromVoidState() {
    if (!this.isEmptyPage) return;

    const pageId = this.store.addBlock({ flavour: 'page' });
    const groupId = this.store.addBlock({ flavour: 'group' }, pageId);
    this.store.addBlock({ flavour: 'paragraph' }, groupId);

    this.isEmptyPage = false;
  }

  // only work in playground
  private _tryInitFromVoidState() {
    if (!IS_PLAYGROUND) return;
    window.addEventListener('mousemove', () => this._initFromVoidState(), {
      once: true,
    });
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    window.addEventListener('affine.switch-mode', ({ detail }) => {
      this.mode = detail;
    });

    this._placeholderInput?.focus();
  }

  updated() {
    this._init();
  }

  render() {
    if (!this.store) {
      return;
    }
    const placeholderRoot = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .store=${this.store}
        .model=${this.placeholderModel}
      ></default-page-block>
    `;

    const pageContainer = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .store=${this.store}
        .model=${this.model}
      ></default-page-block>
    `;

    const edgelessContainer = html`
      <edgeless-page-block
        .mouseRoot=${this as HTMLElement}
        .store=${this.store}
        .model=${this.model}
      ></edgeless-page-block>
    `;

    const blockRoot = html`
      ${choose(this.mode, [
        ['page', () => pageContainer],
        ['edgeless', () => edgelessContainer],
      ])}
    `;

    return html`
      <style>
        .affine-editor-container {
          height: 100%;
          position: relative;
          background: var(--affine-page-background);
          transition: background-color 0.5s;
          overflow-y: auto;
          overflow-x: hidden;
        }
      </style>
      <div class="affine-editor-container">
        ${this.isEmptyPage ? placeholderRoot : blockRoot}
        <debug-menu
          .store=${this.store}
          .contentParser=${this.contentParser}
        ></debug-menu>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }
}
