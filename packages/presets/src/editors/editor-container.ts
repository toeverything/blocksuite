import './doc-editor.js';
import './edgeless-editor.js';
import '../fragments/doc-title/doc-title.js';
import '../fragments/page-meta-tags/page-meta-tags.js';

import type {
  AbstractEditor,
  DocPageBlockComponent,
  EdgelessPageBlockComponent,
} from '@blocksuite/blocks';
import {
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
  SurfaceRefBlockService,
  ThemeObserver,
} from '@blocksuite/blocks';
import { assertExists, Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import type { DocEditor } from './doc-editor.js';
import type { EdgelessEditor } from './edgeless-editor.js';

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
    .affine-doc-viewport {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      user-select: none;
      container-name: viewport;
      container-type: inline-size;
      background: var(--affine-background-primary-color);
      font-family: var(--affine-font-family);
    }
    .affine-doc-viewport * {
      box-sizing: border-box;
    }

    @media print {
      .affine-doc-viewport {
        height: auto;
      }
    }

    doc-editor {
      flex-grow: 1;
    }
  `;

  @property({ attribute: false })
  page!: Page;

  /** Due to product naming, `DocEditor` may be referred to as "page mode" */
  @property({ attribute: false })
  mode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  docSpecs = DocEditorBlockSpecs;

  @property({ attribute: false })
  edgelessSpecs = EdgelessEditorBlockSpecs;

  @property({ attribute: false })
  override autofocus = false;

  @query('doc-editor')
  private _docEditor?: DocEditor;
  @query('edgeless-editor')
  private _edgelessEditor?: EdgelessEditor;

  get editor() {
    const editor =
      this.mode === 'page' ? this._docEditor : this._edgelessEditor;
    assertExists(editor);
    return editor;
  }
  get host() {
    assertExists(this.editor);
    return this.editor.host;
  }

  get rootModel() {
    assertExists(this.page, 'Missing page for EditorContainer.');
    assertExists(this.page.root, 'Missing root model for Page.');
    return this.page.root;
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

  /** @deprecated unreliable since docSpecs can be overridden */
  @query('affine-doc-page')
  private _docPage?: DocPageBlockComponent;
  /** @deprecated unreliable since edgelessSpecs can be overridden */
  @query('affine-edgeless-page')
  private _edgelessPage?: EdgelessPageBlockComponent;

  /**
   * @deprecated need to refactor
   */
  readonly themeObserver = new ThemeObserver();

  /**
   * @deprecated need to refactor
   */
  slots: AbstractEditor['slots'] = {
    pageLinkClicked: new Slot(),
    pageModeSwitched: new Slot(),
    pageUpdated: new Slot(),
    tagClicked: new Slot<{ tagId: string }>(),
  };

  /**
   * @deprecated need to refactor
   */
  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.page, 'Missing page for EditorContainer.');
    assertExists(this.page.root, 'Missing root model for Page.');

    this.themeObserver.observe(document.documentElement);
    this._disposables.add(this.themeObserver);
    this._disposables.add(
      SurfaceRefBlockService.editorModeSwitch.on(mode => {
        this.mode = mode;
      })
    );
  }

  /**
   * @deprecated need to refactor
   */
  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mode')) {
      this.slots.pageModeSwitched.emit(this.mode);
    }

    if (changedProperties.has('page')) {
      this.slots.pageUpdated.emit({ newPageId: this.page.id });
    }

    if (!changedProperties.has('page') && !changedProperties.has('mode')) {
      return;
    }

    requestAnimationFrame(() => {
      if (this._docPage) forwardSlot(this._docPage.slots, this.slots);
      if (this._edgelessPage) forwardSlot(this._edgelessPage.slots, this.slots);
    });
  }

  override render() {
    return html`${keyed(
      this.rootModel.id,
      this.mode === 'page'
        ? html`<div class="affine-doc-viewport">
            <doc-title .page=${this.page}></doc-title>
            <page-meta-tags .page=${this.page}></page-meta-tags>
            <doc-editor
              .page=${this.page}
              .specs=${this.docSpecs}
              .hasViewport=${false}
            ></doc-editor>
          </div>`
        : html`<edgeless-editor
            .page=${this.page}
            .specs=${this.edgelessSpecs}
          ></edgeless-editor>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-editor-container': AffineEditorContainer;
  }
}
