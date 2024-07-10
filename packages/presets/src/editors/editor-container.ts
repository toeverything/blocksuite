import './page-editor.js';
import './edgeless-editor.js';
import '../fragments/doc-title/doc-title.js';
import '../fragments/doc-meta-tags/doc-meta-tags.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type {
  AbstractEditor,
  DocMode,
  EdgelessRootBlockComponent,
  PageRootBlockComponent,
  PageRootService,
} from '@blocksuite/blocks';
import {
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
  ThemeObserver,
} from '@blocksuite/blocks';
import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import type { EdgelessEditor } from './edgeless-editor.js';
import type { PageEditor } from './page-editor.js';

/**
 * @deprecated need to refactor
 */
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

@customElement('affine-editor-container')
export class AffineEditorContainer
  extends WithDisposable(ShadowlessElement)
  implements AbstractEditor
{
  private get _pageSpecs() {
    return [...this.pageSpecs].map(spec => {
      if (spec.schema.model.flavour === 'affine:page') {
        const setup = spec.setup;
        spec = {
          ...spec,
          setup: (slots, disposable) => {
            setup?.(slots, disposable);
            slots.mounted.once(({ service }) => {
              const { docModeService } = service as PageRootService;
              disposable.add(
                docModeService.onModeChange(this.switchEditor.bind(this))
              );
            });
          },
        };
      }
      return spec;
    });
  }

  private get _edgelessSpecs() {
    return [...this.edgelessSpecs].map(spec => {
      if (spec.schema.model.flavour === 'affine:page') {
        const setup = spec.setup;
        spec = {
          ...spec,
          setup: (slots, disposable) => {
            setup?.(slots, disposable);
            slots.mounted.once(({ service }) => {
              const { docModeService } = service as PageRootService;
              disposable.add(
                docModeService.onModeChange(this.switchEditor.bind(this))
              );
            });
          },
        };
      }
      return spec;
    });
  }

  get editor() {
    const editor =
      this.mode === 'page' ? this._pageEditor : this._edgelessEditor;
    assertExists(editor);
    return editor;
  }

  get host() {
    assertExists(this.editor);
    return this.editor.host;
  }

  get rootModel() {
    return this.doc.root as BlockModel;
  }

  static override styles = css`
    .affine-page-viewport {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      container-name: viewport;
      container-type: inline-size;
      font-family: var(--affine-font-family);
    }
    .affine-page-viewport * {
      box-sizing: border-box;
    }

    @media print {
      .affine-page-viewport {
        height: auto;
      }
    }

    page-editor {
      flex-grow: 1;
    }
  `;

  @query('page-editor')
  private accessor _pageEditor: PageEditor | null = null;

  @query('edgeless-editor')
  private accessor _edgelessEditor: EdgelessEditor | null = null;

  /** @deprecated unreliable since pageSpecs can be overridden */
  @query('affine-page-root')
  private accessor _pageRoot: PageRootBlockComponent | null = null;

  /** @deprecated unreliable since edgelessSpecs can be overridden */
  @query('affine-edgeless-root')
  private accessor _edgelessRoot: EdgelessRootBlockComponent | null = null;

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor mode: DocMode = 'page';

  @property({ attribute: false })
  accessor pageSpecs = PageEditorBlockSpecs;

  @property({ attribute: false })
  accessor edgelessSpecs = EdgelessEditorBlockSpecs;

  @property({ attribute: false })
  override accessor autofocus = false;

  /**
   * @deprecated need to refactor
   */
  readonly themeObserver = new ThemeObserver();

  /**
   * @deprecated need to refactor
   */
  slots: AbstractEditor['slots'] = {
    docLinkClicked: new Slot(),
    editorModeSwitched: new Slot(),
    docUpdated: new Slot(),
    tagClicked: new Slot<{ tagId: string }>(),
  };

  switchEditor(mode: DocMode) {
    this.mode = mode;
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    const editor = this.editor;
    assertExists(editor);
    await editor.updateComplete;
    return result;
  }

  override firstUpdated() {
    if (this.mode === 'page') {
      setTimeout(() => {
        if (this.autofocus) {
          const richText = this.querySelector('rich-text');
          assertExists(richText);
          const inlineEditor = richText.inlineEditor;
          assertExists(inlineEditor);
          inlineEditor.focusEnd();
        }
      });
    }
  }

  /**
   * @deprecated need to refactor
   */
  override connectedCallback() {
    super.connectedCallback();

    this.themeObserver.observe(document.documentElement);
    this._disposables.add(this.themeObserver);
    this._disposables.add(
      this.doc.slots.rootAdded.on(() => this.requestUpdate())
    );
  }

  /**
   * @deprecated need to refactor
   */
  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mode')) {
      this.slots.editorModeSwitched.emit(this.mode);
    }

    if (changedProperties.has('doc')) {
      this.slots.docUpdated.emit({ newDocId: this.doc.id });
    }

    if (!changedProperties.has('doc') && !changedProperties.has('mode')) {
      return;
    }

    requestAnimationFrame(() => {
      if (this._pageRoot) forwardSlot(this._pageRoot.slots, this.slots);
      if (this._edgelessRoot) forwardSlot(this._edgelessRoot.slots, this.slots);
    });
  }

  override render() {
    if (!this.rootModel) return nothing;

    return html`${keyed(
      this.rootModel.id,
      this.mode === 'page'
        ? html`
            <div class="affine-page-viewport">
              <doc-title .doc=${this.doc}></doc-title>

              <doc-meta-tags .doc=${this.doc}></doc-meta-tags>

              <page-editor
                .doc=${this.doc}
                .specs=${this._pageSpecs}
                .hasViewport=${false}
              ></page-editor>
            </div>
          `
        : html`
            <edgeless-editor
              .doc=${this.doc}
              .specs=${this._edgelessSpecs}
            ></edgeless-editor>
          `
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-editor-container': AffineEditorContainer;
  }
}
