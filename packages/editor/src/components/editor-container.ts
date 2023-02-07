import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import {
  BlockHub,
  MouseMode,
  NonShadowLitElement,
  PageBlockModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import { DisposableGroup, Page, Signal } from '@blocksuite/store';

import { ClipboardManager, ContentParser } from '../managers/index.js';

import { EditorKeydownHandler } from '../managers/keyboard/keydown-handler.js';
import { createBlockHub } from '../utils/editor.js';

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

  protected update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('readonly')) {
      this.page.awarenessStore.setReadonly(this.page, this.readonly);
    }
    super.update(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.page.awarenessStore.signals.update.subscribe(
        msg => msg.state?.flags.readonly[this.page.prefixedId],
        rd => {
          if (typeof rd === 'boolean' && rd !== this.readonly) {
            this.readonly = rd;
          }
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );

    EditorKeydownHandler.init(this.pageBlockModel);

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

  public async createBlockHub() {
    return new Promise<BlockHub>(resolve => {
      requestAnimationFrame(() => {
        const blockHub = createBlockHub(this, this.page);
        resolve(blockHub);
      });
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.page.awarenessStore.setLocalCursor(this.page, null);
    this._disposables.dispose();
  }

  render() {
    if (!this.model) return null;

    const pageContainer = html`
      <affine-default-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .model=${this.pageBlockModel as PageBlockModel}
        .readonly=${this.readonly}
      ></affine-default-page>
    `;

    const edgelessContainer = html`
      <affine-edgeless-page
        .mouseRoot=${this as HTMLElement}
        .page=${this.page}
        .pageModel=${this.pageBlockModel as PageBlockModel}
        .surfaceModel=${this.surfaceBlockModel as SurfaceBlockModel}
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
