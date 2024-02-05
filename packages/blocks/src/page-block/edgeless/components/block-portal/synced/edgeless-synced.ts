import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { Bound } from '../../../../../surface-block/index.js';
import type { SyncedBlockModel } from '../../../../../synced-block/index.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-synced')
export class EdgelessBlockPortalSynced extends EdgelessPortalBase<SyncedBlockModel> {
  static override styles = css`
    .edgeless-block-portal-synced > affine-synced {
      position: relative;
      display: block;
      left: 0px;
      top: 0px;
      width: 100%;
      height: 100%;
    }
  `;

  override render() {
    const { model, index } = this;
    const bound = Bound.deserialize(model.xywh);
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      transformOrigin: '0 0',
    };

    return html`
      <div class="edgeless-block-portal-synced" style=${styleMap(style)}>
        ${this.renderModel(model)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-synced': EdgelessBlockPortalSynced;
  }
}
