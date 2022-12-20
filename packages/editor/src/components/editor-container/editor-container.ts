import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import type { Page, Disposable } from '@blocksuite/store';
import { ClipboardManager, ContentParser } from '../../index.js';
import type { MouseMode, PageBlockModel } from '@blocksuite/blocks';

@customElement('editor-container')
export class EditorContainer extends LitElement {
  @property()
  page!: Page;

  @property()
  mode?: 'page' | 'edgeless' = 'page';

  @property()
  readonly = false;

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  // TODO only select block
  @state()
  clipboard = new ClipboardManager(this, this);

  @state()
  contentParser = new ContentParser(this);

  get model() {
    return this.page.root as PageBlockModel;
  }

  @query('.affine-block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  private _disposables: Disposable[] = [];

  private _subscribeStore() {
    const rootAddedDisposable = this.page.signals.rootAdded.on(() => {
      this.requestUpdate();
    });
    this._disposables.push(rootAddedDisposable);
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  private _handleSwitchMouseMode = ({ detail }: CustomEvent<MouseMode>) => {
    this.mouseMode = detail;
  };

  override connectedCallback() {
    super.connectedCallback();

    window.addEventListener('keydown', e => {
      if (e.altKey && e.metaKey && e.code === 'KeyC') {
        e.preventDefault();
      }
    });

    if (!this.page) {
      throw new Error('Missing page for EditorContainer!');
    }

    window.addEventListener(
      'affine.switch-mouse-mode',
      this._handleSwitchMouseMode
    );

    this._subscribeStore();

    this._placeholderInput?.focus();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    window.removeEventListener(
      'affine.switch-mouse-mode',
      this._handleSwitchMouseMode
    );
    this._disposables.forEach(disposable => disposable.dispose());
  }

  render() {
    if (!this.model) return null;

    const pageContainer = html`
      <affine-default-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .model=${this.model}
        .readonly=${this.readonly}
      ></affine-default-page>
    `;

    const edgelessContainer = html`
      <affine-edgeless-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .model=${this.model}
        .mouseMode=${this.mouseMode}
        .readonly=${this.readonly}
      ></affine-edgeless-page>
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
      <div class="affine-editor-container">${blockRoot}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }
}
