import { BlockElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfacePageService } from './surface-page-service.js';

@customElement('affine-doc-surface')
export class SurfaceDocBlockComponent extends BlockElement<
  SurfaceBlockModel,
  SurfacePageService
> {
  override render() {
    return nothing;
  }
}
