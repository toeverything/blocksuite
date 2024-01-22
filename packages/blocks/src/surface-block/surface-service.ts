import { BlockService } from '@blocksuite/block-std';

import { LayerManager } from './managers/layer-manager.js';
import type { SurfaceBlockModel } from './surface-model.js';

export class SurfaceService extends BlockService<SurfaceBlockModel> {
  layer!: LayerManager;
  surface!: SurfaceBlockModel;

  override mounted(): void {
    super.mounted();
    const surface = this.page.getBlockByFlavour(
      'affine:surface'
    )[0] as SurfaceBlockModel;

    if (!surface) {
      const disposable = this.page.slots.blockUpdated.on(payload => {
        if (payload.type === 'add' && payload.flavour === 'affine:surface') {
          disposable.dispose();
          this.surface = this.page.getBlockById(
            payload.id
          ) as SurfaceBlockModel;
          this.layer = LayerManager.create(this.page, surface);
        }
      });
    } else {
      this.surface = surface;
      this.layer = LayerManager.create(this.page, surface);
    }
  }
}
