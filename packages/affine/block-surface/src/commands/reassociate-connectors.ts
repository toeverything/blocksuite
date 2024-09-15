import type { Command } from '@blocksuite/block-std';

/**
 * Re-associate bindings for block that have been converted.
 *
 * @param oldId - the old block id
 * @param newId - the new block id
 */
export const reassociateConnectorsCommand: Command<
  never,
  never,
  { oldId: string; newId: string }
> = (ctx, next) => {
  const { oldId, newId } = ctx;
  const service = ctx.std.getService('affine:surface');
  if (!oldId || !newId || !service) {
    next();
    return;
  }

  const surface = service.surface;
  const connectors = surface.getConnectors(oldId);
  for (const { id, source, target } of connectors) {
    if (source.id === oldId) {
      surface.updateElement(id, {
        source: {
          ...source,
          id: newId,
        },
      });
      continue;
    }
    if (target.id === oldId) {
      surface.updateElement(id, {
        target: {
          ...target,
          id: newId,
        },
      });
    }
  }

  next();
};
