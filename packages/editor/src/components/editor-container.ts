import {
  getDefaultPageBlock,
  getServiceOrRegister,
  type MouseMode,
  type PageBlockModel,
} from '@blocksuite/blocks';
import {
  ContentParser,
  NonShadowLitElement,
  type SurfaceBlockModel,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { checkEditorElementActive, createBlockHub } from '../utils/editor.js';

@customElement('editor-container')
export class EditorContainer extends NonShadowLitElement {
  @property()
  page!: Page;

  @property()
  mode?: 'page' | 'edgeless' = 'page';

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @state()
  private showGrid = false;

  contentParser!: ContentParser;

  get model() {
    return [this.page.root, this.page.surface] as [
      PageBlockModel | null,
      SurfaceBlockModel | null
    ];
  }

  get pageBlockModel(): PageBlockModel | null {
    return Array.isArray(this.model) ? this.model[0] : this.model;
  }

  get surfaceBlockModel(): SurfaceBlockModel | null {
    return Array.isArray(this.model)
      ? (this.model[1] as SurfaceBlockModel)
      : null;
  }

  @query('.affine-block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  private _disposables = new DisposableGroup();

  override firstUpdated() {
    // todo: refactor to a better solution
    getServiceOrRegister('affine:code');
  }

  override connectedCallback() {
    super.connectedCallback();
    this.contentParser = new ContentParser(this.page);

    // Question: Why do we prevent this?
    this._disposables.addFromEvent(window, 'keydown', e => {
      if (e.altKey && e.metaKey && e.code === 'KeyC') {
        e.preventDefault();
      }

      // `esc`  clear selection
      if (e.code !== 'Escape') {
        return;
      }
      const pageModel = this.pageBlockModel;
      if (!pageModel) return;
      const pageBlock = getDefaultPageBlock(pageModel);
      pageBlock.selection.clear();

      const selection = getSelection();
      if (!selection || selection.isCollapsed || !checkEditorElementActive()) {
        return;
      }
      selection.removeAllRanges();
    });

    if (!this.page) {
      throw new Error('Missing page for EditorContainer!');
    }

    // connect mouse mode event changes
    this._disposables.addFromEvent(
      window,
      'affine.switch-mouse-mode',
      ({ detail }) => {
        this.mouseMode = detail;
      }
    );

    this._disposables.addFromEvent(
      window,
      'affine:switch-edgeless-display-mode',
      ({ detail }) => {
        this.showGrid = detail;
      }
    );

    // subscribe store
    this._disposables.add(
      this.page.slots.rootAdded.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.add(
      this.page.slots.blockUpdated.on(async ({ type, id }) => {
        const block = this.page.getBlockById(id);

        if (!block) return;

        if (type === 'update') {
          const service = await getServiceOrRegister(block.flavour);
          service.updateEffect(block);
        }
      })
    );

    this._placeholderInput?.focus();
  }

  public async createBlockHub() {
    await this.updateComplete;
    if (!this.page.root) {
      await new Promise(res => this.page.slots.rootAdded.once(res));
    }
    return createBlockHub(this, this.page);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.page.awarenessStore.setLocalRange(this.page, null);
    this._disposables.dispose();
  }

  render() {
    if (!this.model || !this.pageBlockModel) return null;

    const pageContainer = html`
      <affine-default-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .model=${this.pageBlockModel}
      ></affine-default-page>
    `;

    const edgelessContainer = html`
      <affine-edgeless-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .pageModel=${this.pageBlockModel}
        .surfaceModel=${this.surfaceBlockModel as SurfaceBlockModel}
        .mouseMode=${this.mouseMode}
        .showGrid=${this.showGrid}
      ></affine-edgeless-page>
    `;

    const remoteSelectionContainer = html`
      <remote-selection .page=${this.page}></remote-selection>
    `;

    const blockRoot = html`
      ${choose(this.mode, [
        ['page', () => pageContainer],
        ['edgeless', () => edgelessContainer],
      ])}
      ${remoteSelectionContainer}
    `;

    return html`
      <style>
        editor-container,
        .affine-editor-container {
          display: block;
          height: 100%;
          position: relative;
          overflow: hidden;
          font-family: var(--affine-font-family);
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
