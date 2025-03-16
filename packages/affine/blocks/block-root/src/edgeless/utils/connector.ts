import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';

import type { EdgelessRootService } from '../edgeless-root-service.js';

/**
 * move connectors from origin to target
 * @param originId origin element id
 * @param targetId target element id
 * @param service edgeless root service
 */
export function moveConnectors(
  originId: string,
  targetId: string,
  service: EdgelessRootService
) {
  const connectors = service.surface.getConnectors(originId);
  const crud = service.std.get(EdgelessCRUDIdentifier);
  connectors.forEach(connector => {
    if (connector.source.id === originId) {
      crud.updateElement(connector.id, {
        source: { ...connector.source, id: targetId },
      });
    }
    if (connector.target.id === originId) {
      crud.updateElement(connector.id, {
        target: { ...connector.target, id: targetId },
      });
    }
  });
}
