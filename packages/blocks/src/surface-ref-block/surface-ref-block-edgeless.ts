import { BlockComponent } from '@blocksuite/block-std';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { SurfaceRefBlockModel } from './surface-ref-model.js';

@customElement('affine-edgeless-surface-ref')
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
