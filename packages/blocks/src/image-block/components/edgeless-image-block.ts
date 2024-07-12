import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('affine-edgeless-image')
export class ImageBlockEdgelessComponent extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    affine-edgeless-image .resizable-img,
    affine-edgeless-image .resizable-img img {
      width: 100%;
      height: 100%;
    }
  `;

  private _handleError(error: Error) {
    this.dispatchEvent(new CustomEvent('error', { detail: error }));
  }

  override render() {
    return html`<div class="resizable-img">
      <img
        class="drag-target"
        src=${this.url ?? ''}
        draggable="false"
        @error=${this._handleError}
      />
    </div>`;
  }

  @query('.resizable-img')
  public accessor resizeImg: HTMLElement | null = null;

  @property({ attribute: false })
  accessor url: string | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-image': ImageBlockEdgelessComponent;
  }
}
