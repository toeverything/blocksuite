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
        doc-editor * {
          box-sizing: border-box;
        }
        doc-editor {
          display: block;
          height: 100%;
          position: relative;
          overflow: hidden;
          font-family: var(--affine-font-family);
          background: var(--affine-background-primary-color);
        }
        @media print {
          doc-editor {
            height: auto;
          }
        }
      </style>
      <doc-title .page=${this.page} .editorHostRef=${this.host}></doc-title>
      <page-meta .page=${this.page} .editorHostRef=${this.host}></page-meta>
      <editor-host
        ${ref(this.host)}
        .page=${this.page}
        .specs=${this.specs}
      ></editor-host>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'doc-editor': DocEditor;
  }
}
