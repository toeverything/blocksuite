import {
  type AbstractEditor,
  type AttachmentProps,
  type DocPageBlockComponent,
  type EdgelessPageBlockComponent,
  edgelessPreset,
  FileDropManager,
  getServiceOrRegister,
  type ImageBlockProps,
  type PageBlockModel,
  pagePreset,
  readImageSize,
  ThemeObserver,
} from '@blocksuite/blocks';
import { withTempBlobData } from '@blocksuite/blocks';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import { IS_FIREFOX } from '@blocksuite/global/config';
import { noop, Slot } from '@blocksuite/global/utils';
import {
  BlockSuiteRoot,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/lit';
import { type Page } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { checkEditorElementActive, createBlockHub } from '../utils/editor.js';

noop(BlockSuiteRoot);

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
  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  mode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  pagePreset = pagePreset;

  @property({ attribute: false })
  edgelessPreset = edgelessPreset;

  @property({ attribute: false })
  override autofocus = false;

  /**
   * @deprecated This property is unreliable since pagePreset can be overridden.
   */
  @query('affine-doc-page')
  private _defaultPageBlock?: DocPageBlockComponent;

  /**
   * @deprecated This property is unreliable since edgelessPreset can be overridden.
   */
  @query('affine-edgeless-page')
  private _edgelessPageBlock?: EdgelessPageBlockComponent;

  readonly themeObserver = new ThemeObserver();

  fileDropManager = new FileDropManager(this);

  get model(): PageBlockModel | null {
    return this.page.root as PageBlockModel | null;
  }

  slots: AbstractEditor['slots'] = {
    pageLinkClicked: new Slot(),
    pageModeSwitched: new Slot(),
    tagClicked: new Slot<{ tagId: string }>(),
  };

  override connectedCallback() {
    super.connectedCallback();

    const keydown = (e: KeyboardEvent) => {
      if (e.altKey && e.metaKey && e.code === 'KeyC') {
        e.preventDefault();
      }

      // `esc`  clear selection
      if (e.code !== 'Escape') {
        return;
      }
      const pageModel = this.model;
      if (!pageModel) return;

      if (this.mode === 'page') {
        // FIXME(mirone)
        // getPageBlock(pageModel)?.selection?.clear();
      }

      const selection = getSelection();
      if (!selection || selection.isCollapsed || !checkEditorElementActive()) {
        return;
      }
      selection.removeAllRanges();
    };

    // Question: Why do we prevent this?
    if (IS_FIREFOX) {
      this._disposables.addFromEvent(document.body, 'keydown', keydown);
    } else {
      this._disposables.addFromEvent(window, 'keydown', keydown);
    }

    if (!this.page) {
      throw new Error('Missing page for EditorContainer!');
    }

    // connect mouse mode event changes
    // this._disposables.addFromEvent(
    //   window,
    //   'affine.switch-mouse-mode',
    //   ({ detail }) => {
    //     this.edgelessTool = detail;
    //   }
    // );

    // subscribe store
    this._disposables.add(
      this.page.slots.rootAdded.on(() => {
        // add the 'page' as requesting property to
        // make sure the `forwardSlot` is called in `updated` lifecycle
        this.requestUpdate('page');
      })
    );

    this._disposables.addFromEvent(
      this,
      'dragover',
      this.fileDropManager.onDragOver
    );
    this._disposables.addFromEvent(this, 'drop', this.fileDropManager.onDrop);

    this.themeObserver.observer(document.documentElement);
    this._disposables.add(this.themeObserver);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  override firstUpdated() {
    // todo: refactor to a better solution
    getServiceOrRegister('affine:code');
    if (this.mode === 'page') {
      setTimeout(() => {
        if (this.autofocus) {
          this._defaultPageBlock?.titleVEditor.focusEnd();
        }
      });
    }

    // adds files from outside by dragging and dropping
    this.fileDropManager.register({
      name: 'Image',
      matcher: file => file.type.startsWith('image'),
      handler: async (
        file: File
      ): Promise<ImageBlockProps & { flavour: 'affine:image' }> => {
        const storage = this.page.blobs;
        const { saveAttachmentData } = withTempBlobData();
        const sourceId = await storage.set(
          new Blob([file], { type: file.type })
        );
        saveAttachmentData(sourceId, { name: file.name });
        const size = this.mode === 'edgeless' ? await readImageSize(file) : {};
        return {
          flavour: 'affine:image',
          sourceId,
          ...size,
        };
      },
    });
    if (this.page.awarenessStore.getFlag('enable_attachment_block')) {
      this.fileDropManager.register({
        name: 'Attachment',
        matcher: (file: File) => {
          // TODO limit size in blob
          const MAX_ATTACHMENT_SIZE = 10 * 1000 * 1000;
          if (file.size > MAX_ATTACHMENT_SIZE) {
            console.warn('You can only upload files less than 10M.');
            return false;
          }
          return true;
        },
        handler: async (
          file: File
        ): Promise<AttachmentProps & { flavour: 'affine:attachment' }> => {
          const storage = this.page.blobs;
          const sourceId = await storage.set(
            new Blob([file], { type: file.type })
          );
          return {
            flavour: 'affine:attachment',
            name: file.name,
            size: file.size,
            type: file.type,
            sourceId,
          };
        },
      });
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mode')) {
      this.slots.pageModeSwitched.emit(this.mode);
      if (this.mode === 'page') {
        this._saveViewportLocalRecord();
      }
    }

    if (!changedProperties.has('page') && !changedProperties.has('mode')) {
      return;
    }

    requestAnimationFrame(() => {
      if (this._defaultPageBlock) {
        forwardSlot(this._defaultPageBlock.slots, this.slots);
      }
      if (this._edgelessPageBlock) {
        forwardSlot(this._edgelessPageBlock.slots, this.slots);
      }
    });
  }

  async createBlockHub() {
    await this.updateComplete;
    if (!this.page.root) {
      await new Promise(res => this.page.slots.rootAdded.once(res));
    }
    return createBlockHub(this, this.page);
  }

  private _saveViewportLocalRecord() {
    const edgelessPage = this.querySelector('affine-edgeless-page');
    if (edgelessPage) {
      const { viewport } = edgelessPage.surface;
      sessionStorage.setItem(
        'blocksuite:' + this.page.id + ':edgelessViewport',
        JSON.stringify({ ...viewport.center, zoom: viewport.zoom })
      );
    }
  }

  createContentParser() {
    return new ContentParser(this.page);
  }

  override render() {
    if (!this.model) return null;

    const rootContainer = keyed(
      this.model.id,
      html`<block-suite-root
        .page=${this.page}
        .blocks=${this.mode === 'page' ? this.pagePreset : this.edgelessPreset}
      ></block-suite-root>`
    );

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
        @media print {
          editor-container,
          .affine-editor-container {
            height: auto;
          }
        }
      </style>
      ${rootContainer}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }
}
