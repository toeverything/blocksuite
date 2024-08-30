import type { BlockModel, Doc } from '@blocksuite/store';

import {
  BlockStdScope,
  EditorHost,
  type ExtensionType,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { type AbstractEditor, DocModeProvider } from '@blocksuite/blocks';
import {
  DocMode,
  EdgelessEditorBlockSpecs,
  type EdgelessRootBlockComponent,
  PageEditorBlockSpecs,
  type PageRootBlockComponent,
} from '@blocksuite/blocks';
import { Slot, noop } from '@blocksuite/global/utils';
import {
  SignalWatcher,
  computed,
  effect,
  signal,
} from '@lit-labs/preact-signals';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { when } from 'lit/directives/when.js';

import '../fragments/doc-title/doc-title.js';

noop(EditorHost);

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
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements AbstractEditor
{
  private _doc = signal<Doc>();

  private _edgelessSpecs = signal<ExtensionType[]>(EdgelessEditorBlockSpecs);

  private _editorTemplate = computed(() => {
    return this._std.value.render();
  });

  private _forwardRef = (mode: DocMode) => {
    requestAnimationFrame(() => {
      if (mode === DocMode.Page) {
        if (this._pageRoot) forwardSlot(this._pageRoot.slots, this.slots);
      } else {
        if (this._edgelessRoot)
          forwardSlot(this._edgelessRoot.slots, this.slots);
      }
    });
  };

  private _mode = signal<DocMode>(DocMode.Page);

  private _pageSpecs = signal<ExtensionType[]>(PageEditorBlockSpecs);

  private _specs = computed(() =>
    this._mode.value === DocMode.Page
      ? this._pageSpecs.value
      : this._edgelessSpecs.value
  );

  private _std = computed(() => {
    return new BlockStdScope({
      doc: this.doc,
      extensions: this._specs.value,
    });
  });

  static override styles = css`
    .affine-page-viewport {
      position: relative;
      display: flex;
      flex-direction: column;
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

    .playground-page-editor-container {
      flex-grow: 1;
      font-family: var(--affine-font-family);
      display: block;
    }

    .playground-page-editor-container * {
      box-sizing: border-box;
    }

    @media print {
      .playground-page-editor-container {
        height: auto;
      }
    }

    .edgeless-editor-container {
      font-family: var(--affine-font-family);
      background: var(--affine-background-primary-color);
      display: block;
      height: 100%;
      position: relative;
      overflow: clip;
    }

    .edgeless-editor-container * {
      box-sizing: border-box;
    }

    @media print {
      .edgeless-editor-container {
        height: auto;
      }
    }

    .affine-edgeless-viewport {
      display: block;
      height: 100%;
      position: relative;
      overflow: clip;
      container-name: viewport;
      container-type: inline-size;
    }
  `;

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

    this._disposables.add(
      this.doc.slots.rootAdded.on(() => this.requestUpdate())
    );
  }

  override firstUpdated() {
    if (this.mode === 'page') {
      setTimeout(() => {
        if (this.autofocus) {
          const richText = this.querySelector('rich-text');
          const inlineEditor = richText?.inlineEditor;
          inlineEditor?.focusEnd();
        }
      });
    }

    this._disposables.add(
      effect(() => {
        const std = this._std.value;
        const mode = std.get(DocModeProvider).getMode();
        this._forwardRef(mode);
      })
    );
  }

  override render() {
    const mode = this._mode.value;

    return html`${keyed(
      this.rootModel.id + mode,
      html`
        <div
          class=${mode === DocMode.Page
            ? 'affine-page-viewport'
            : 'affine-edgeless-viewport'}
        >
          ${when(
            mode === DocMode.Page,
            () => html` <doc-title .doc=${this.doc}></doc-title> `
          )}
          <div
            class=${mode === DocMode.Page
              ? 'page-editor playground-page-editor-container'
              : 'edgeless-editor-container'}
          >
            ${this._editorTemplate.value}
          </div>
        </div>
      `
    )}`;
  }

  switchEditor(mode: DocMode) {
    this._mode.value = mode;
  }

  /**
   * @deprecated need to refactor
   */
  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('doc')) {
      this.slots.docUpdated.emit({ newDocId: this.doc.id });
      this._forwardRef(this.mode);
    }

    if (!changedProperties.has('doc') && !changedProperties.has('mode')) {
      return;
    }
  }

  get doc() {
    return this._doc.value as Doc;
  }

  set doc(doc: Doc) {
    this._doc.value = doc;
  }

  set edgelessSpecs(specs: ExtensionType[]) {
    this._edgelessSpecs.value = specs;
  }

  get edgelessSpecs() {
    return this._edgelessSpecs.value;
  }

  get host() {
    return this.std.host;
  }

  get mode() {
    return this._mode.value;
  }

  set mode(mode: DocMode) {
    this._mode.value = mode;
  }

  set pageSpecs(specs: ExtensionType[]) {
    this._pageSpecs.value = specs;
  }

  get pageSpecs() {
    return this._pageSpecs.value;
  }

  get rootModel() {
    return this.doc.root as BlockModel;
  }

  get std() {
    return this._std.value;
  }

  /** @deprecated unreliable since edgelessSpecs can be overridden */
  @query('affine-edgeless-root')
  private accessor _edgelessRoot: EdgelessRootBlockComponent | null = null;

  /** @deprecated unreliable since pageSpecs can be overridden */
  @query('affine-page-root')
  private accessor _pageRoot: PageRootBlockComponent | null = null;

  @property({ attribute: false })
  override accessor autofocus = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-editor-container': AffineEditorContainer;
  }
}
