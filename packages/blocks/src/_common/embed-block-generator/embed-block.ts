import type { BlockService } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/lit';
import { BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { ImageBlockModel } from '../../image-block/index.js';
import { BLOCK_BATCH } from '../../surface-block/batch.js';
import type { IEdgelessElement } from '../../surface-block/index.js';
import type { SerializedXYWH } from '../../surface-block/index.js';
import type { IVec, PointLocation } from '../../surface-block/index.js';
import { Bound } from '../../surface-block/index.js';
import type { EmbedProps } from './index.js';

export class EmbedBlock<
  Model extends BaseBlockModel<EmbedProps> = BaseBlockModel<EmbedProps>,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockElement<Model, Service, WidgetName> {
  protected get _isInSurface() {
    const parent = this.root.querySelector('affine-edgeless-page');
    return !!parent;
  }

  get surface() {
    if (!this._isInSurface) return null;

    return this.root.querySelector('affine-surface');
  }

  get bound() {
    return Bound.deserialize(
      ((this.surface?.pickById(this.model.id) as ImageBlockModel) ?? this.model)
        .xywh
    );
  }

  renderEmbed = (children: () => TemplateResult) => {
    if (!this._isInSurface) {
      return html` <div class="embed-block-container">${children()}</div> `;
    }

    return html`
      <div
        class="embed-block-container"
        style=${styleMap({
          width: '100%',
          height: '100%',
        })}
      >
        ${children()}
      </div>
    `;
  };
}

export class EmbedModel<Props>
  extends BaseBlockModel<EmbedProps<Props>>
  implements IEdgelessElement
{
  elementBound!: Bound;
  override xywh!: SerializedXYWH;
  get batch() {
    return BLOCK_BATCH;
  }

  get connectable() {
    return true;
  }
  containedByBounds!: (_: Bound) => boolean;
  getNearestPoint!: (_: IVec) => IVec;
  intersectWithLine!: (_: IVec, _1: IVec) => PointLocation[] | null;
  getRelativePointLocation!: (_: IVec) => PointLocation;
  boxSelect!: (bound: Bound) => boolean;
  hitTest(x: number, y: number): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }
}
