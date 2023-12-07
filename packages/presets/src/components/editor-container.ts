import type {
  AbstractEditor,
  DocPageBlockComponent,
  EdgelessPageBlockComponent,
  PageBlockModel,
} from '@blocksuite/blocks';
import {
  EdgelessEditorBlockSpecs,
  getServiceOrRegister,
  PageEditorBlockSpecs,
  saveViewportToSession,
  ThemeObserver,
} from '@blocksuite/blocks';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import { noop, Slot } from '@blocksuite/global/utils';
import {
  BlockSuiteRoot,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import type { Ref } from 'lit/directives/ref.js';
import { createRef, ref } from 'lit/directives/ref.js';

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
  pagePreset = PageEditorBlockSpecs;

  @property({ attribute: false })
  edgelessPreset = EdgelessEditorBlockSpecs;

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

  root: Ref<BlockSuiteRoot> = createRef<BlockSuiteRoot>();

  readonly themeObserver = new ThemeObserver();

  get model() {
    return this.page.root as PageBlockModel | null;
  }

  get isEditorElementActive(): boolean {
    return document.activeElement?.closest('editor-container') !== null;
  }

  slots: AbstractEditor['slots'] = {
    pageLinkClicked: new Slot(),
    pageModeSwitched: new Slot(),
    tagClicked: new Slot<{ tagId: string }>(),
  };

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    const root = this.root.value;
    if (root) {
      await root.updateComplete;
    }
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!this.page) {
      throw new Error('Missing page for EditorContainer!');
    }

    // subscribe store
    this._disposables.add(
      this.page.slots.rootAdded.on(() => {
        // add the 'page' as requesting property to
        // make sure the `forwardSlot` is called in `updated` lifecycle
        this.requestUpdate('page');
      })
    );

    this.themeObserver.observe(document.documentElement);
    this._disposables.add(this.themeObserver);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  override firstUpdated() {
    //FIXME: refactor to a better solution
    getServiceOrRegister('affine:code');
    if (this.mode === 'page') {
      setTimeout(() => {
        if (this.autofocus) {
          this._defaultPageBlock?.titleVEditor.focusEnd();
        }
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

  private _saveViewportLocalRecord() {
    const edgelessPage = this.querySelector('affine-edgeless-page');
    if (edgelessPage) {
      const { viewport } = edgelessPage.surface;
      saveViewportToSession(this.page.id, {
        x: viewport.center.x,
        y: viewport.center.y,
        zoom: viewport.zoom,
      });
    }
  }

  /** @deprecated for testing only */
  createContentParser() {
    return new ContentParser(this.page);
  }

  override render() {
    if (!this.model) return null;

    const rootContainer = keyed(
      this.model.id,
      html`<block-suite-root
        ${ref(this.root)}
        .page=${this.page}
        .preset=${this.mode === 'page' ? this.pagePreset : this.edgelessPreset}
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
