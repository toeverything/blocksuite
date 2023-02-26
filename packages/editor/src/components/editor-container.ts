import {
  getDefaultPageBlock,
  getServiceOrRegister,
  MouseMode,
  PageBlockModel,
} from '@blocksuite/blocks';
import { NonShadowLitElement, SurfaceBlockModel } from '@blocksuite/blocks';
import { Page, Signal } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { ClipboardManager, ContentParser } from '../managers/index.js';
import { checkEditorElementActive, createBlockHub } from '../utils/editor.js';

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

  override firstUpdated() {
    // todo: refactor to a better solution
    getServiceOrRegister('affine:code');
  }

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

    // Question: Why do we prevent this?
    this._disposables.add(
      Signal.disposableListener(window, 'keydown', e => {
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
        if (
          !selection ||
          selection.isCollapsed ||
          !checkEditorElementActive()
        ) {
          return;
        }
        selection.removeAllRanges();
      })
    );

    if (!this.page) {
      throw new Error('Missing page for EditorContainer!');
    }

    // connect mouse mode event changes
    this._disposables.add(
      Signal.disposableListener(
        window,
        'affine.switch-mouse-mode',
        ({ detail }) => {
          this.mouseMode = detail;
        }
      )
    );

    this._disposables.add(
      Signal.disposableListener(
        window,
        'affine:switch-edgeless-display-mode',
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
    this._disposables.add(
      this.page.signals.blockUpdated.on(async ({ type, id }) => {
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
    return createBlockHub(this, this.page);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.page.awarenessStore.setLocalRange(this.page, null);
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
