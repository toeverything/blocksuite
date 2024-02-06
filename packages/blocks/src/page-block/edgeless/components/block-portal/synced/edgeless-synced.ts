import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { Bound } from '../../../../../surface-block/index.js';
import type { SyncedBlockModel } from '../../../../../synced-block/index.js';
import { SYNCED_BLOCK_DEFAULT_HEIGHT } from '../../../../../synced-block/styles.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-synced')
export class EdgelessBlockPortalSynced extends EdgelessPortalBase<SyncedBlockModel> {
  static override styles = css`
    edgeless-block-portal-synced:has(.affine-synced-container.editing) {
      z-index: 1000 !important;
    }

    .edgeless-block-portal-synced > affine-synced {
      position: relative !important;
      display: block !important;
      left: 0px !important;
      top: 0px !important;
      width: 100% !important;
      height: 100% !important;
    }

    .edgeless-block-portal-synced
      .synced-block-editor
      .affine-doc-page-block-container {
      padding: 12px 24px;
      width: 100%;
    }

    .edgeless-block-portal-synced .affine-synced-container.edgeless {
      display: block;
      padding: 0;
      width: 100%;
      height: calc(${SYNCED_BLOCK_DEFAULT_HEIGHT}px + 36px);
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
