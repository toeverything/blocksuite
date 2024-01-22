import type { SurfaceBlockComponent } from '@blocksuite/blocks';

export const getConnectorFromId = (
  id: string,
  surface: SurfaceBlockComponent
) => {
  return surface.getElementsByType('connector').filter(v => v.source.id === id);
};
export const getConnectorToId = (
  id: string,
  surface: SurfaceBlockComponent
) => {
  return surface.getElementsByType('connector').filter(v => v.target.id === id);
};
export const getConnectorPath = (
  id: string,
  surface: SurfaceBlockComponent
) => {
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
