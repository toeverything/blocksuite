import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { BookmarkBlockModel } from '../../../../../models.js';
import { Bound } from '../../../../../surface-block/index.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-bookmark')
export class EdgelessBlockPortalBookmark extends EdgelessPortalBase<BookmarkBlockModel> {
  @query('.edgeless-block-portal-bookmark')
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
      transformOrigin: '0 0',
    };

    return html`
      <div class="edgeless-block-portal-bookmark" style=${styleMap(style)}>
        ${this.renderModel(model)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-bookmark': EdgelessBlockPortalBookmark;
  }
}
