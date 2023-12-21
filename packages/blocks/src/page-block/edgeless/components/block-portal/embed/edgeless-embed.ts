import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { EmbedBlockModel } from '../../../../../_common/embed-block-helper/index.js';
import { Bound } from '../../../../../surface-block/index.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-embed')
export class EdgelessBlockPortalEmbed extends EdgelessPortalBase<EmbedBlockModel> {
  @query('.edgeless-block-portal-embed')
  override portalContainer!: HTMLDivElement;

  override render() {
    const { model, index, surface } = this;
    const bound = Bound.deserialize(model.xywh);
    const { translateX, translateY, zoom } = surface.viewport;
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      transform: `translate(${translateX + bound.x * zoom}px, ${
        translateY + bound.y * zoom
      }px) scale(${zoom})`,
      transformOrigin: '0px 0px',
    };

    return html`
      <div class="edgeless-block-portal-embed" style=${styleMap(style)}>
        ${this.renderModel(model)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-embed': EdgelessBlockPortalEmbed;
  }
}
