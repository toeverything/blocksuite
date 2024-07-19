import type { Doc } from '@blocksuite/store';

import {
  EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';
import { type TemplateResult, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Ref, createRef } from 'lit/directives/ref.js';

noop(EditorHost);

@customElement('page-editor')
export class PageEditor extends WithDisposable(ShadowlessElement) {
  private _host: Ref<EditorHost> = createRef<EditorHost>();

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

  override render() {
    const classes = this.hasViewport
      ? 'affine-page-viewport'
      : 'page-editor-container';

    return html`<div class=${classes}>${this.editor}</div>`;
  }

  get host() {
    return this._host.value as EditorHost;
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor editor!: TemplateResult;

  @property({ type: Boolean })
  accessor hasViewport = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'page-editor': PageEditor;
  }
}
