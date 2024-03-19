import './page-editor.js';
import './edgeless-editor.js';
import '../fragments/doc-title/doc-title.js';
import '../fragments/doc-meta-tags/doc-meta-tags.js';

import type {
  AbstractEditor,
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
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Doc } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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
      background: var(--affine-background-primary-color);
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

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  mode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  pageSpecs = PageEditorBlockSpecs;

  @state()
  private get _pageSpecs() {
    return [...this.pageSpecs].map(spec => {
      if (spec.schema.model.flavour === 'affine:page') {
        const setup = spec.setup;
        spec = {
          ...spec,
          setup: (slots, disposable) => {
            setup?.(slots, disposable);
            slots.mounted.once(({ service }) => {
              disposable.add(
                (<PageRootService>service).slots.editorModeSwitch.on(
                  this.switchEditor.bind(this)
                )
              );
            });
          },
        };
      }
      return spec;
    });
  }

  @property({ attribute: false })
  edgelessSpecs = EdgelessEditorBlockSpecs;

  @state()
  private get _edgelessSpecs() {
    return [...this.edgelessSpecs].map(spec => {
      if (spec.schema.model.flavour === 'affine:page') {
        const setup = spec.setup;
        spec = {
          ...spec,
          setup: (slots, disposable) => {
            setup?.(slots, disposable);
            slots.mounted.once(({ service }) => {
              disposable.add(
                (<PageRootService>service).slots.editorModeSwitch.on(
                  this.switchEditor.bind(this)
                )
              );
            });
          },
        };
      }
      return spec;
    });
  }

  @property({ attribute: false })
  override autofocus = false;

  @query('page-editor')
  private _pageEditor?: PageEditor;
  @query('edgeless-editor')
  private _edgelessEditor?: EdgelessEditor;

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
    assertExists(this.doc, 'Missing doc for EditorContainer.');
    assertExists(this.doc.root, 'Missing root model for Doc.');
    return this.doc.root;
  }

  switchEditor(mode: typeof this.mode) {
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

  /** @deprecated unreliable since pageSpecs can be overridden */
  @query('affine-page-root')
  private _pageRoot?: PageRootBlockComponent;
  /** @deprecated unreliable since edgelessSpecs can be overridden */
  @query('affine-edgeless-root')
  private _edgelessRoot?: EdgelessRootBlockComponent;

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

  /**
   * @deprecated need to refactor
   */
  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.doc, 'Missing doc for EditorContainer.');
    assertExists(this.doc.root, 'Missing root model for Doc.');

    this.themeObserver.observe(document.documentElement);
    this._disposables.add(this.themeObserver);
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
