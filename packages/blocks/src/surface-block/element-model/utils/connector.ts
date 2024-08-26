import { ConnectorElementModel } from '@blocksuite/affine-model';

export function isConnectorWithLabel(
  model: BlockSuite.EdgelessModel | BlockSuite.SurfaceLocalModel
) {
  return model instanceof ConnectorElementModel && model.hasLabel();
}
