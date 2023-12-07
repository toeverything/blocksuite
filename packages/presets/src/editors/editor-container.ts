import type {
  AbstractEditor,
  DocPageBlockComponent,
  EdgelessPageBlockComponent,
  PageBlockModel,
} from '@blocksuite/blocks';
import {
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
  getServiceOrRegister,
  ThemeObserver,
} from '@blocksuite/blocks';
import { noop, Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { DocEditor } from './doc-editor.js';
import { EdgelessEditor } from './edgeless-editor.js';

noop(DocEditor);
noop(EdgelessEditor);

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
  docSpecs = DocEditorBlockSpecs;

  @property({ attribute: false })
  edgelessSpecs = EdgelessEditorBlockSpecs;

  @property({ attribute: false })
  override autofocus = false;

  /** @deprecated unreliable since docSpecs can be overridden */
  @query('affine-doc-page')
  private _defaultPageBlock?: DocPageBlockComponent;

  /** @deprecated unreliable since edgelessSpecs can be overridden */
  @query('affine-edgeless-page')
  private _edgelessPageBlock?: EdgelessPageBlockComponent;

  get root() {
    return this.mode === 'page'
      ? this._defaultPageBlock?.root
      : this._edgelessPageBlock?.root;
  }

  readonly themeObserver = new ThemeObserver();

  get model() {
    return this.page.root as PageBlockModel | null;
  }

  slots: AbstractEditor['slots'] = {
    pageLinkClicked: new Slot(),
    pageModeSwitched: new Slot(),
    tagClicked: new Slot<{ tagId: string }>(),
  };

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    const root = this.root;
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

  override render() {
    if (!this.model) return nothing;

    return html`${keyed(
      this.model.id,
      this.mode === 'page'
        ? html`<doc-editor .page=${this.page}></doc-editor>`
        : html`<edgeless-editor .page=${this.page}></edgeless-editor>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }
}
