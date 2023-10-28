import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { ImageBlockModel } from '../../../../../image-block/index.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';

@customElement('edgeless-block-portal-image')
export class EdgelessBlockPortalImage extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: ImageBlockModel;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  override firstUpdated() {
    this._disposables.add(
      this.surface.page.slots.yBlockUpdated.on(e => {
        if (e.id === this.model.id) {
          this.requestUpdate();
        }
      })
    );
  }

  override render() {
    const { model, surface, index } = this;
    const bound = Bound.deserialize(model.xywh);
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
    };

    return html`
      <div style=${styleMap(style)}>${surface.edgeless.renderModel(model)}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-image': EdgelessBlockPortalImage;
  }
}
