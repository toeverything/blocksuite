import type { SurfaceRefBlockModel } from '@blocksuite/affine-model';
import { BlockComponent } from '@blocksuite/std';
import { nothing } from 'lit';

export class EdgelessSurfaceRefBlockComponent extends BlockComponent<SurfaceRefBlockModel> {
  override render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-surface-ref': EdgelessSurfaceRefBlockComponent;
  }
}
