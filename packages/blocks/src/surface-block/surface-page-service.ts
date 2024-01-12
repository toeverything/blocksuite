import { BlockService } from '@blocksuite/block-std';

import { EditSessionStorage } from './managers/edit-session.js';
import { LayerManager } from './managers/layer-manager.js';
import type { SurfaceBlockModel } from './surface-model.js';

export class SurfacePageService extends BlockService<SurfaceBlockModel> {
  layer!: LayerManager;
  surface!: SurfaceBlockModel;
  editSession!: EditSessionStorage;

  override mounted(): void {
    super.mounted();
    this.surface = this.page.getBlockByFlavour(
      'affine:surface'
    )[0] as SurfaceBlockModel;
    this.layer = LayerManager.create(this.page, this.surface);
    this.editSession = new EditSessionStorage(this);
  }

  override unmounted(): void {
    this.layer.dispose();
  }
}
