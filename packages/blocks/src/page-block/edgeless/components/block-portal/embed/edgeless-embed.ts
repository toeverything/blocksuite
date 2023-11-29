import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { EmbedModel } from '../../../../../_common/embed-block-generator/embed-block.js';
import { Bound } from '../../../../../surface-block/index.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-embed')
export class EdgelessBlockPortalEmbed extends EdgelessPortalBase<EmbedModel> {
  override render() {
    const { model, index, surface } = this;
    const bound = Bound.deserialize(model.xywh);
    const { zoom } = surface.viewport;
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      transform: `translate(${bound.x * zoom}px, ${
        bound.y * zoom
      }px) scale(${zoom})`,
      transformOrigin: '0px 0px',
    };

    return html`
      <div style=${styleMap(style)}>${this.renderModel(model)}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-embed': EdgelessBlockPortalEmbed;
  }
}
