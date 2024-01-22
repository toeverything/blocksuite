import type { EdgelessPageService } from '@blocksuite/blocks';
import {
  type ConnectorElementModel,
  SurfaceBlockComponent,
} from '@blocksuite/blocks';

export const getConnectorToId = (id: string, surface: EdgelessPageService) => {
  return surface.elements.filter(
    v => SurfaceBlockComponent.isConnector(v) && v.target.id === id
  ) as ConnectorElementModel[];
};
export const getConnectorPath = (id: string, surface: EdgelessPageService) => {
  let current: string | undefined = id;
  const set = new Set<string>();
  const result: string[] = [];
  while (current) {
    if (set.has(current)) {
      return result;
    }
    set.add(current);
    const connector = getConnectorToId(current, surface);
    if (connector.length !== 1) {
      return result;
    }
    current = connector[0].source.id;
    if (current) {
      result.unshift(current);
    }
  }
  return result;
};
