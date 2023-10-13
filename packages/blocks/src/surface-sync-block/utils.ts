import type { Page } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../models.js';

export function getSurfaceBlock(page: Page) {
  return (
    (page.getBlockByFlavour('affine:surface')[0] as SurfaceBlockModel) ?? null
  );
}
