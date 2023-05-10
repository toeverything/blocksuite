import {
  type AbstractEditor,
  activeEditorManager,
  type DefaultPageBlockComponent,
  type EdgelessPageBlockComponent,
  type MouseMode,
  type PageBlockModel,
  type SurfaceBlockModel,
  WithDisposable,
} from '@blocksuite/blocks';
import {
  getDefaultPageBlock,
  getServiceOrRegister,
  ShadowlessElement,
  ThemeObserver,
} from '@blocksuite/blocks';
import { isFirefox, type Page, Slot } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { keyed } from 'lit/directives/keyed.js';

import { checkEditorElementActive, createBlockHub } from '../utils/editor.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forwardSlot<T extends Record<string, Slot<any>>>(
  from: T,
  to: Partial<T>
) {
  Object.entries(from).forEach(([key, slot]) => {
    const target = to[key];
    if (target) {
      slot.pipe(target);
    }
  });
}

@customElement('editor-container')
export class EditorContainer
  extends WithDisposable(ShadowlessElement)
  implements AbstractEditor
{
  @property()
  page!: Page;

  @property()
  mode: 'page' | 'edgeless' = 'page';

  @property()
  override autofocus = false;

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @property()
  showGrid = true;

  readonly themeObserver = new ThemeObserver();

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

  @query('affine-default-page')
  private _defaultPageBlock?: DefaultPageBlockComponent;

  @query('affine-edgeless-page')
  private _edgelessPageBlock?: EdgelessPageBlockComponent;

  slots: AbstractEditor['slots'] = {
    pageLinkClicked: new Slot(),
    pageModeSwitched: new Slot(),
  };

  override connectedCallback() {
    super.connectedCallback();
    activeEditorManager.setIfNoActive(this);

    const keydown = (e: KeyboardEvent) => {
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
    };

    // Question: Why do we prevent this?
    if (isFirefox) {
      this._disposables.addFromEvent(document.body, 'keydown', keydown);
    } else {
      this._disposables.addFromEvent(window, 'keydown', keydown);
    }

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

    // subscribe store
    this._disposables.add(
      this.page.slots.rootAdded.on(() => {
        // add the 'page' as requesting property to
        // make sure the `forwardSlot` is called in `updated` lifecycle
        this.requestUpdate('page');
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

    this.themeObserver.observer(document.documentElement);
    this._disposables.add(this.themeObserver);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    activeEditorManager.clearActive();
    this.page.awarenessStore.setLocalRange(this.page, null);
  }

  override firstUpdated() {
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

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mode')) {
      this.slots.pageModeSwitched.emit(this.mode);
    }

    if (!changedProperties.has('page') && !changedProperties.has('mode')) {
      return;
    }
    if (this._defaultPageBlock) {
      forwardSlot(this._defaultPageBlock.slots, this.slots);
    }
    if (this._edgelessPageBlock) {
      forwardSlot(this._edgelessPageBlock.slots, this.slots);
    }
  }

  async createBlockHub() {
    await this.updateComplete;
    if (!this.page.root) {
      await new Promise(res => this.page.slots.rootAdded.once(res));
    }
    return createBlockHub(this, this.page);
  }

  override render() {
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
        editor-container * {
          box-sizing: border-box;
        }
        editor-container,
        .affine-editor-container {
          display: block;
          height: 100%;
          position: relative;
          overflow: hidden;
          font-family: var(--affine-font-family);
          background: var(--affine-background-primary-color);
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
