import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

export class EdgelessPortalBase<T extends BlockModel> extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: T;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  protected renderModel(model: T) {
    return this.surface.host.renderModel(model);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }
}
