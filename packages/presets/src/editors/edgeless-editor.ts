import type { Doc } from '@blocksuite/store';

import {
  EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { EdgelessEditorBlockSpecs } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { type TemplateResult, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Ref, createRef, ref } from 'lit/directives/ref.js';

noop(EditorHost);

@customElement('edgeless-editor')
export class EdgelessEditor extends WithDisposable(ShadowlessElement) {
  private _host: Ref<EditorHost> = createRef<EditorHost>();

  static override styles = css`
    edgeless-editor {
      font-family: var(--affine-font-family);
      background: var(--affine-background-primary-color);
    }

    edgeless-editor * {
      box-sizing: border-box;
    }

    @media print {
      edgeless-editor {
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
      <div class="affine-edgeless-viewport">
        <editor-host
          ${ref(this._host)}
          .doc=${this.doc}
          .specs=${this.specs}
        ></editor-host>
      </div>
    `;
  }

  get host() {
    return this._host.value as EditorHost;
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor editor!: TemplateResult;

  @property({ attribute: false })
  accessor specs = EdgelessEditorBlockSpecs;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-editor': EdgelessEditor;
  }
}
