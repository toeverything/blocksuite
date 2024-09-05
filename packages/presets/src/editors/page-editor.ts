import { BlockStdScope } from '@blocksuite/block-std';
import {
  EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { PageEditorBlockSpecs } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { BlockViewType, type Doc } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { guard } from 'lit/directives/guard.js';

noop(EditorHost);

@customElement('page-editor')
export class PageEditor extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    page-editor {
      font-family: var(--affine-font-family);
      background: var(--affine-background-primary-color);
    }

    page-editor * {
      box-sizing: border-box;
    }

    @media print {
      page-editor {
        height: auto;
      }
    }

    .affine-page-viewport {
      position: relative;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      container-name: viewport;
      container-type: inline-size;
    }

    .page-editor-container {
      display: block;
      height: 100%;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.doc.slots.rootAdded.on(() => this.requestUpdate())
    );
    const blockCollection = this.doc.blockCollection;
    if (!blockCollection) return;
    this.doc = blockCollection.getDoc({
      query: {
        mode: 'loose',
        match: [
          {
            flavour: 'affine:note',
            viewType: BlockViewType.Hidden,
            props: {
              displayMode: 'edgeless',
            },
          },
        ],
      },
    });
    this.std = new BlockStdScope({
      doc: this.doc,
      extensions: this.specs,
    });
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.host?.updateComplete;
    return result;
  }

  override render() {
    const std = this.std;
    if (!this.doc.root) return nothing;

    return html`
      <div
        class=${this.hasViewport
          ? 'affine-page-viewport'
          : 'page-editor-container'}
      >
        ${guard([std], () => std.render())}
      </div>
    `;
  }

  override willUpdate(
    changedProperties: Map<string | number | symbol, unknown>
  ) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('doc')) {
      this.std = new BlockStdScope({
        doc: this.doc,
        extensions: this.specs,
      });
    }
  }

  get host() {
    try {
      return this.std.host;
    } catch {
      return null;
    }
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ type: Boolean })
  accessor hasViewport = true;

  @property({ attribute: false })
  accessor specs = PageEditorBlockSpecs;

  @state()
  accessor std!: BlockStdScope;
}

declare global {
  interface HTMLElementTagNameMap {
    'page-editor': PageEditor;
  }
}
