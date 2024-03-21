import {
  EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import type { SurfaceBlockComponent } from '@blocksuite/blocks';
import { EdgelessEditorBlockSpecs } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

noop(EditorHost);

@customElement('edgeless-editor')
export class EdgelessEditor extends WithDisposable(ShadowlessElement) {
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
      overflow: hidden;
      container-name: viewport;
      container-type: inline-size;
    }
  `;

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  specs = EdgelessEditorBlockSpecs;

  private _host: Ref<EditorHost> = createRef<EditorHost>();

  get host() {
    return this._host.value as EditorHost;
  }

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

  override disconnectedCallback(): void {
    const host = this.host;
    if (!host) return;
    const surfaceModel = host.doc.getBlockByFlavour('affine:surface')[0];
    const surface = host.view.viewFromPath('block', [
      this.doc.root!.id,
      surfaceModel.id,
    ]) as SurfaceBlockComponent;

    if (!surface) return;

    const { edgeless } = surface;
    edgeless.service.editSession.setItem('viewport', {
      centerX: edgeless.service.viewport.centerX,
      centerY: edgeless.service.viewport.centerY,
      zoom: edgeless.service.viewport.zoom,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-editor': EdgelessEditor;
  }
}
