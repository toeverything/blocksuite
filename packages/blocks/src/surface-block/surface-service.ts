import { BlockService } from '@blocksuite/block-std';

import type { SurfaceBlockModel } from './surface-model.js';

import { LayerManager } from './managers/layer-manager.js';

export class SurfaceBlockService extends BlockService<SurfaceBlockModel> {
  layer!: LayerManager;

  surface!: SurfaceBlockModel;

  override mounted(): void {
    super.mounted();

    this.surface = this.doc.getBlockByFlavour(
      'affine:surface'
    )[0] as SurfaceBlockModel;

    if (!this.surface) {
      const disposable = this.doc.slots.blockUpdated.on(payload => {
        if (payload.flavour === 'affine:surface') {
          disposable.dispose();
          const surface = this.doc.getBlockById(
            payload.id
          ) as SurfaceBlockModel | null;
          if (!surface) return;
          this.surface = surface;
          this.layer = LayerManager.create(this.doc, surface);
        }
      });
    } else {
      this.layer = LayerManager.create(this.doc, this.surface);
    }
  }

  override unmounted(): void {
    this.layer?.dispose();
  }
}
