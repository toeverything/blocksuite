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
  connectors.forEach(connector => {
    if (connector.source.id === originId) {
      service.updateElement(connector.id, {
        source: { ...connector.source, id: targetId },
      });
    }
    if (connector.target.id === originId) {
      service.updateElement(connector.id, {
        target: { ...connector.target, id: targetId },
      });
    }
  });
}
