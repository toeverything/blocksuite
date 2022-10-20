import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { Store } from '@blocksuite/store';
import { ClipboardManager, ContentParser } from '../..';
import { BlockSchema } from '../../block-loader';

type PageBlockModel = InstanceType<typeof BlockSchema.page>;

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

const IS_PLAYGROUND = location.href.includes('5173');

const options = {
  room,
  useDebugProvider: IS_PLAYGROUND,
};

@customElement('editor-container')
export class EditorContainer extends LitElement {
  @state()
  store = new Store(options).register(BlockSchema);

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

    this._subscribeStore();
    this._tryInitFromVoidState();

    // @ts-ignore
    window.store = this.store;
    // @ts-ignore
    window.editor = this;
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

  render() {
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
          overflow-y: scroll;
          position: relative;
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
