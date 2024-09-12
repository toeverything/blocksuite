import { BlockComponent } from '@blocksuite/block-std';
import { nothing } from 'lit';

import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';

export class SurfaceBlockVoidComponent extends BlockComponent<
  SurfaceBlockModel,
  SurfaceBlockService
> {
  override render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-void': SurfaceBlockVoidComponent;
  }
}
