import type { Store } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model';

export function getSurfaceBlock(doc: Store) {
  const blocks = doc.getBlocksByFlavour('affine:surface');
  return blocks.length !== 0 ? (blocks[0].model as SurfaceBlockModel) : null;
}
