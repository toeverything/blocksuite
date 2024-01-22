import { BlockService } from '@blocksuite/block-std';

import { LayerManager } from './managers/layer-manager.js';
import type { SurfaceBlockModel } from './surface-model.js';

export class SurfacePageService extends BlockService<SurfaceBlockModel> {
  layer!: LayerManager;
  surface!: SurfaceBlockModel;

  override mounted(): void {
    super.mounted();
    this.surface = this.page.getBlockByFlavour(
      'affine:surface'
    )[0] as SurfaceBlockModel;

    if (!this.surface) {
      const disposable = this.page.slots.blockUpdated.on(payload => {
        if (payload.flavour === 'affine:surface') {
          disposable.dispose();
          this.surface = this.page.getBlockById(
            payload.id
          ) as SurfaceBlockModel;
          this.layer = LayerManager.create(this.page, this.surface);
        }
      });
    } else {
      this.layer = LayerManager.create(this.page, this.surface);
    }
  }

  override unmounted(): void {
    this.layer?.dispose();
  }
}
