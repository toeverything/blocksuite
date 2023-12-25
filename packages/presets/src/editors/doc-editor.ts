import { DocEditorBlockSpecs } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { EditorHost, ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

noop(EditorHost);

@customElement('doc-editor')
export class DocEditor extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  specs = DocEditorBlockSpecs;

  @property({ type: Boolean })
  hasViewport = true;

  host: Ref<EditorHost> = createRef<EditorHost>();

  override render() {
    return html`
      <style>
        doc-editor {
          display: block;
          height: 100%;
          font-family: var(--affine-font-family);
          background: var(--affine-background-primary-color);
        }

        doc-editor * {
          box-sizing: border-box;
        }

        @media print {
          doc-editor {
            height: auto;
          }
        }

        .affine-doc-viewport {
          position: relative;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          user-select: none;
        }

        .doc-editor-container {
          user-select: none;
        }
      </style>
      <div
        class=${this.hasViewport
          ? 'affine-doc-viewport'
          : 'doc-editor-container'}
      >
        <editor-host
          ${ref(this.host)}
          .page=${this.page}
          .specs=${this.specs}
        ></editor-host>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'doc-editor': DocEditor;
  }
}
