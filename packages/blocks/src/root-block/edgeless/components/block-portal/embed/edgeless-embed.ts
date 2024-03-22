import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { EmbedBlockModel } from '../../../../../_common/embed-block-helper/index.js';
import { Bound } from '../../../../../surface-block/index.js';
import { isEmbedHtmlBlock } from '../../../utils/query.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-embed')
export class EdgelessBlockPortalEmbed extends EdgelessPortalBase<EmbedBlockModel> {
  override render() {
    const { model, index } = this;
    const borderRadius = isEmbedHtmlBlock(model) ? 12 : 8;
    const bound = Bound.deserialize(model.xywh);
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      transformOrigin: '0px 0px',
      boxShadow: 'var(--affine-shadow-1)',
      borderRadius: `${borderRadius}px`,
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
