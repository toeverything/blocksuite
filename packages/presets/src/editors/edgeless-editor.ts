import type { SurfaceBlockComponent } from '@blocksuite/blocks';
import { EdgelessEditorBlockSpecs } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { EditorHost, ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

noop(EditorHost);

@customElement('edgeless-editor')
export class EdgelessEditor extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  specs = EdgelessEditorBlockSpecs;

  private _host: Ref<EditorHost> = createRef<EditorHost>();

  get host() {
    return this._host.value as EditorHost;
  }

  override render() {
    return html`
      <style>
        edgeless-editor * {
          box-sizing: border-box;
        }
        edgeless-editor {
          display: block;
          height: 100%;
          position: relative;
          overflow: hidden;
          font-family: var(--affine-font-family);
          background: var(--affine-background-primary-color);
        }
        @media print {
          edgeless-editor {
            height: auto;
          }
        }
      </style>
      <editor-host
        ${ref(this._host)}
        .page=${this.page}
        .specs=${this.specs}
      ></editor-host>
    `;
  }

  override disconnectedCallback(): void {
    const host = this.host;
    if (!host) return;
    const surfaceModel = host.page.getBlockByFlavour('affine:surface')[0];
    const surface = host.view.viewFromPath('block', [
      this.page.root!.id,
      surfaceModel.id,
    ]) as SurfaceBlockComponent;

    if (!surface) return;

    const { service, viewport } = surface;
    service.editSession.setItem('viewport', {
      centerX: viewport.centerX,
      centerY: viewport.centerY,
      zoom: viewport.zoom,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-editor': EdgelessEditor;
  }
}
