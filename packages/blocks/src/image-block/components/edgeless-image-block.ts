import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ImageBlockComponent } from '../image-block.js';

@customElement('affine-edgeless-image')
export class ImageBlockEdgelessComponent extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    affine-edgeless-image .resizable-img img {
      width: 100%;
      height: 100%;
    }
  `;

  @property({ attribute: false })
  block!: ImageBlockComponent;

  @query('.resizable-img')
  public readonly resizeImg?: HTMLElement;

  private get _host() {
    return this.block.host;
  }

  private get _model() {
    return this.block.model;
  }

  get edgeless() {
    return this._host.querySelector('affine-edgeless-page');
  }

  override render() {
    const resizableImgStyleMap = styleMap({
      width: `100%`,
      height: `100%`,
      transform: `rotate(${this._model.rotate}deg)`,
      transformOrigin: 'center',
    });

    return html`<div class="resizable-img" style=${resizableImgStyleMap}>
      <img
        class="drag-target"
        src=${this.block.blobUrl ?? ''}
        draggable="false"
      />
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-image': ImageBlockEdgelessComponent;
  }
}
