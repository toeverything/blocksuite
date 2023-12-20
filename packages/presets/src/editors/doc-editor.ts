import '../fragments/page-meta/page-meta';
import '../fragments/doc-title/doc-title';

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

  host: Ref<EditorHost> = createRef<EditorHost>();

  override render() {
    return html`
      <style>
        doc-editor {
          position: relative;
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
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
        }

        editor-host {
          flex-grow: 1;
        }
      </style>
      <div class="affine-doc-viewport">
        <doc-title .page=${this.page} .editorHostRef=${this.host}></doc-title>
        <page-meta .page=${this.page} .editorHostRef=${this.host}></page-meta>
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
