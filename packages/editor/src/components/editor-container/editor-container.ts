import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import type { Space } from '@blocksuite/store';
import { ClipboardManager, ContentParser } from '../..';
import { BlockSchema } from '../../block-loader';

type PageBlockModel = InstanceType<typeof BlockSchema['affine:page']>;

@customElement('editor-container')
export class EditorContainer extends LitElement {
  @property()
  space!: Space;

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
  placeholderModel!: PageBlockModel;

  @state()
  unsubscribe = [] as (() => void)[];

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('space')) {
      this.placeholderModel = new BlockSchema['affine:page'](this.space, {});
    }
    super.update(changedProperties);
  }

  private _subscribeStore() {
    // if undo to empty page, reset to empty placeholder
    const unsubscribeUpdate = this.space.signals.updated.on(() => {
      this.isEmptyPage = this.space.isEmpty;
    });
    this.unsubscribe.push(unsubscribeUpdate.dispose);

    const unsubscribeRootAdd = this.space.signals.rootAdded.on(block => {
      this.model = block as PageBlockModel;
      this.model.childrenUpdated.on(() => this.requestUpdate());
      this.requestUpdate();
    });
    this.unsubscribe.push(unsubscribeRootAdd.dispose);
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!this.space) {
      throw new Error("EditorContainer's store is not set!");
    }
    this.placeholderModel = new BlockSchema['affine:page'](this.space, {});

    window.addEventListener('affine.switch-mode', ({ detail }) => {
      this.mode = detail;
    });

    this._subscribeStore();

    this._placeholderInput?.focus();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.unsubscribe.forEach(fn => fn());
  }

  render() {
    const placeholderRoot = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .space=${this.space}
        .model=${this.placeholderModel}
      ></default-page-block>
    `;

    const pageContainer = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .space=${this.space}
        .model=${this.model}
      ></default-page-block>
    `;

    const edgelessContainer = html`
      <edgeless-page-block
        .mouseRoot=${this as HTMLElement}
        .space=${this.space}
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
          overflow-y: auto;
          overflow-x: hidden;
        }
      </style>
      <div class="affine-editor-container">
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
