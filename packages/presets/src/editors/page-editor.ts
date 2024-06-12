import {
  EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { PageEditorBlockSpecs } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

noop(EditorHost);

@customElement('page-editor')
export class PageEditor extends WithDisposable(ShadowlessElement) {
  get host() {
    return this._host.value as EditorHost;
  }

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

  private _host: Ref<EditorHost> = createRef<EditorHost>();

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor specs = PageEditorBlockSpecs;

  @property({ type: Boolean })
  accessor hasViewport = true;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.doc.slots.rootAdded.on(() => this.requestUpdate())
    );
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.host.updateComplete;
    return result;
  }

  override render() {
    if (!this.doc.root) return nothing;

    return html`
      <div
        class=${this.hasViewport
          ? 'affine-page-viewport'
          : 'page-editor-container'}
      >
        <editor-host
          ${ref(this._host)}
          .doc=${this.doc}
          .specs=${this.specs}
        ></editor-host>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-editor': PageEditor;
  }
}
