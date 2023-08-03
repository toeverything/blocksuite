import { BlockElement } from '@blocksuite/lit';
import { customElement } from 'lit/decorators.js';

import type { SurfaceBlockModel } from './surface-model.js';

@customElement('affine-surface')
export class SurfaceBlockComponent extends BlockElement<SurfaceBlockModel> {}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
