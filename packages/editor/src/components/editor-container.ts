import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { BaseBlockModel, Page, Signal } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import type { MouseMode, PageBlockModel } from '@blocksuite/blocks';
import { NonShadowLitElement } from '@blocksuite/blocks';
import { ClipboardManager, ContentParser } from '../managers/index.js';

@customElement('editor-container')
export class EditorContainer extends NonShadowLitElement {
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

  @state()
  showGrid = false;

  // TODO only select block
  @state()
  clipboard = new ClipboardManager(this, this);

  @state()
  contentParser = new ContentParser(this);

  get model() {
    return this.page.root as
      | PageBlockModel
      | [PageBlockModel, BaseBlockModel]
      | null;
  }

  get pageBlockModel(): PageBlockModel | null {
    return Array.isArray(this.model) ? this.model[0] : this.model;
  }

  get surfaceBlockModel(): SurfaceBlockModel | null {
    return Array.isArray(this.model) ? this.model[1] : null;
  }

  @query('.affine-block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  private _disposables = new DisposableGroup();

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    // Question: Why do we prevent this?
    this._disposables.add(
      Signal.fromEvent(window, 'keydown').on(e => {
        if (e.altKey && e.metaKey && e.code === 'KeyC') {
          e.preventDefault();
        }
      })
    );

    if (!this.page) {
      throw new Error('Missing page for EditorContainer!');
    }

    // connect mouse mode event changes
    this._disposables.add(
      Signal.fromEvent(window, 'affine.switch-mouse-mode').on(({ detail }) => {
        this.mouseMode = detail;
      })
    );

    this._disposables.add(
      Signal.fromEvent(window, 'affine:switch-edgeless-display-mode').on(
        ({ detail }) => {
          this.showGrid = detail;
        }
      )
    );

    // subscribe store
    this._disposables.add(
      this.page.signals.rootAdded.on(() => {
        this.requestUpdate();
      })
    );

    this._placeholderInput?.focus();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
    this._disposables = new DisposableGroup();
  }

  render() {
    if (!this.model) return null;

    const pageContainer = html`
      <affine-default-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .model=${this.pageBlockModel}
        .readonly=${this.readonly}
      ></affine-default-page>
    `;

    const edgelessContainer = html`
      <affine-edgeless-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .model=${this.pageBlockModel}
        .surfaceModel=${this.surfaceBlockModel}
        .mouseMode=${this.mouseMode}
        .readonly=${this.readonly}
        .showGrid=${this.showGrid}
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
