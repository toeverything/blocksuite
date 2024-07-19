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

  override render() {
    return html`<div class="affine-edgeless-viewport">${this.editor}</div>`;
  }

  get host() {
    return this._host.value as EditorHost;
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor editor!: TemplateResult;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-editor': EdgelessEditor;
  }
}
