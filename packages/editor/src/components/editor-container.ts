import type {
  MouseMode,
  PageBlockModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import {
  getDefaultPageBlock,
  getServiceOrRegister,
  NonShadowLitElement,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { keyed } from 'lit/directives/keyed.js';

import { checkEditorElementActive, createBlockHub } from '../utils/editor.js';

@customElement('editor-container')
export class EditorContainer extends NonShadowLitElement {
  @property()
  page!: Page;

  @property()
  mode?: 'page' | 'edgeless' = 'page';

  @property()
  autofocus = false;

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @state()
  private showGrid = false;

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

  private _disposables = new DisposableGroup();

  firstUpdated() {
    // todo: refactor to a better solution
    getServiceOrRegister('affine:code');

    if (this.mode === 'page') {
      setTimeout(() => {
        const defaultPage = this.querySelector('affine-default-page');
        if (this.autofocus) {
          defaultPage?.titleVEditor.focusEnd();
        }
      });
    }
  }

  connectedCallback() {
    super.connectedCallback();

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

      if (this.mode === 'page') {
        const pageBlock = getDefaultPageBlock(pageModel);
        pageBlock.selection.clear();
      }

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
  }

  async createBlockHub() {
    await this.updateComplete;
    if (!this.page.root) {
      await new Promise(res => this.page.slots.rootAdded.once(res));
    }
    return createBlockHub(this, this.page);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.page.awarenessStore.setLocalRange(this.page, null);
    this._disposables.dispose();
  }

  render() {
    if (!this.model || !this.pageBlockModel) return null;

    const pageContainer = keyed(
      'page-' + this.pageBlockModel.id,
      html`
        <affine-default-page
          .mouseRoot=${this as HTMLElement}
          .page=${this.page}
          .model=${this.pageBlockModel}
        ></affine-default-page>
      `
    );

    const edgelessContainer = keyed(
      'edgeless-' + this.pageBlockModel.id,
      html`
        <affine-edgeless-page
          .mouseRoot=${this as HTMLElement}
          .page=${this.page}
          .model=${this.pageBlockModel}
          .surfaceModel=${this.surfaceBlockModel as SurfaceBlockModel}
          .mouseMode=${this.mouseMode}
          .showGrid=${this.showGrid}
        ></affine-edgeless-page>
      `
    );

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
