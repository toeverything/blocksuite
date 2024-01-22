import { BlockElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { SurfaceRefBlockModel } from './surface-ref-model.js';

@customElement('affine-surface-ref-edgeless')
export class SurfaceRefBlockEdgelessComponent extends BlockElement<SurfaceRefBlockModel> {
  override render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref-edgeless': SurfaceRefBlockEdgelessComponent;
  }
}
