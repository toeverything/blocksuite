import type {
  EdgelessRootBlockComponent,
  PageRootBlockComponent,
} from '@blocksuite/blocks';
import type {
  AbstractEditor,
  DocMode,
  PageRootService,
} from '@blocksuite/blocks';
import type { BlockModel, Doc } from '@blocksuite/store';

import { type BlockSpec, EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import {
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';
import { Slot, assertExists, noop } from '@blocksuite/global/utils';
import {
  SignalWatcher,
  computed,
  effect,
  signal,
} from '@lit-labs/preact-signals';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { type Ref, createRef, ref } from 'lit/directives/ref.js';
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
  private _edgelessSpecs = computed(() => {
    return [...this._edgelessSpecs$.value].map(spec => {
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
  });

  private _edgelessSpecs$ = signal(EdgelessEditorBlockSpecs);

  private _forwardRef = (mode: DocMode) => {
    requestAnimationFrame(() => {
      if (mode === 'page') {
        if (this._pageRoot) forwardSlot(this._pageRoot.slots, this.slots);
      } else {
        if (this._edgelessRoot)
          forwardSlot(this._edgelessRoot.slots, this.slots);
      }
    });
  };

  private _hostRef: Ref<EditorHost> = createRef<EditorHost>();

  private _mode = signal<DocMode>('page');

  private _pageSpecs = computed(() => {
    return [...this._pageSpecs$.value].map(spec => {
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
  });

  private _pageSpecs$ = signal(PageEditorBlockSpecs);

  private _specs = computed(() =>
    this._mode.value === 'page'
      ? this._pageSpecs.value
      : this._edgelessSpecs.value
  );

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
      background: var(--affine-background-primary-color);
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
          assertExists(richText);
          const inlineEditor = richText.inlineEditor;
          assertExists(inlineEditor);
          inlineEditor.focusEnd();
        }
      });
    }

    this._disposables.add(
      effect(() => {
        const mode = this._mode.value;
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
          class=${mode === 'page'
            ? 'affine-page-viewport'
            : 'affine-edgeless-viewport'}
        >
          ${when(
            mode === 'page',
            () => html`
              <doc-title .doc=${this.doc}></doc-title>

              <doc-meta-tags .doc=${this.doc}></doc-meta-tags>
            `
          )}
          <div
            class=${mode === 'page'
              ? 'page-editor playground-page-editor-container'
              : 'edgeless-editor-container'}
          >
            <editor-host
              ${ref(this._hostRef)}
              .doc=${this.doc}
              .specs=${this._specs.value}
            ></editor-host>
          </div>
        </div>
      `
    )}`;
  }

  switchEditor(mode: DocMode) {
    this.mode = mode;
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

  set edgelessSpecs(specs: BlockSpec[]) {
    this._edgelessSpecs$.value = specs;
  }

  get host() {
    return this._hostRef.value;
  }

  get mode() {
    return this._mode.value;
  }

  set mode(mode: DocMode) {
    this._mode.value = mode;
  }

  set pageSpecs(specs: BlockSpec[]) {
    this._pageSpecs$.value = specs;
  }

  get rootModel() {
    return this.doc.root as BlockModel;
  }

  /** @deprecated unreliable since edgelessSpecs can be overridden */
  @query('affine-edgeless-root')
  private accessor _edgelessRoot: EdgelessRootBlockComponent | null = null;

  /** @deprecated unreliable since pageSpecs can be overridden */
  @query('affine-page-root')
  private accessor _pageRoot: PageRootBlockComponent | null = null;

  @property({ attribute: false })
  override accessor autofocus = false;

  @property({ attribute: false })
  accessor doc!: Doc;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-editor-container': AffineEditorContainer;
  }
}
