import type { GfxModel } from '@blocksuite/block-std/gfx';

import { ConnectorElementModel } from '@blocksuite/affine-model';

export function isConnectorWithLabel(
  model: GfxModel | BlockSuite.SurfaceLocalModel
) {
  return model instanceof ConnectorElementModel && model.hasLabel();
}
