import {
  type SurfaceBlockModel,
  type SurfaceMiddleware,
  surfaceMiddlewareExtension,
} from '@labre/affine-block-surface';
import {
  type ConnectorElementModel,
  ShapeElementModel,
  ShapeType,
} from '@labre/affine-model';
import { Bound, Vec } from '@labre/global/gfx';
import type { IVec } from '@labre/global/gfx';
import type { GfxModel } from '@labre/std/gfx';

import { ConnectorPathGenerator, getAnchors } from './connector-manager';

/**
 * Re-anchor connector endpoints that are attached to the given polygon element.
 *
 * When polygon vertices are edited (moved, added, or deleted), the normalized
 * bounding-box positions stored in `connector.source.position` /
 * `connector.target.position` may no longer correspond to any vertex or edge
 * midpoint of the updated polygon.  This function projects each stored
 * position into absolute model space, finds the nearest valid anchor on the
 * updated polygon boundary (vertex or edge midpoint), and writes the new
 * normalized coordinate back to the connector, persisting it in the CRDT.
 *
 * Must be called BEFORE `addToUpdateList` so that the path generator uses
 * the freshly re-anchored positions when it runs in the next microtask.
 */
function reanchorConnectorsForPolygon(
  surface: SurfaceBlockModel,
  polygonId: string,
  elementGetter: (id: string) => GfxModel | null
): void {
  const element = elementGetter(polygonId);
  if (
    !(element instanceof ShapeElementModel) ||
    element.shapeType !== ShapeType.Polygon
  ) {
    return;
  }

  // Compute the polygon's current anchor points (vertices + edge midpoints).
  const anchors = getAnchors(element);
  if (anchors.length === 0) return;

  const bound = Bound.deserialize(element.xywh);
  const connectors = surface.getConnectors(polygonId);

  for (const connector of connectors) {
    for (const endpointType of ['source', 'target'] as const) {
      const connection = connector[endpointType];

      // Only process endpoints that are explicitly anchored to this polygon
      // at a specific normalized position.
      if (connection?.id !== polygonId) continue;
      if (!connection.position) continue;

      // Convert the stored normalized [0-1] position to absolute model coords.
      const [nx, ny] = connection.position;
      const absPos: IVec = [
        bound.x + nx * bound.w,
        bound.y + ny * bound.h,
      ];

      // Find the nearest anchor on the updated polygon boundary.
      let nearestCoord: [number, number] = connection.position as [number, number];
      let minDist = Infinity;
      for (const anchor of anchors) {
        const d = Vec.dist(absPos, anchor.point as IVec);
        if (d < minDist) {
          minDist = d;
          nearestCoord = anchor.coord as [number, number];
        }
      }

      // Persist the new anchor position only if it actually changed.
      const [oldNx, oldNy] = connection.position;
      const [newNx, newNy] = nearestCoord;
      if (Math.abs(oldNx - newNx) > 1e-6 || Math.abs(oldNy - newNy) > 1e-6) {
        connector[endpointType] = { ...connection, position: nearestCoord };
      }
    }
  }
}

export const connectorWatcher: SurfaceMiddleware = (
  surface: SurfaceBlockModel
) => {
  const hasElementById = (id: string) =>
    surface.hasElementById(id) || surface.store.hasBlock(id);
  const elementGetter = (id: string) =>
    surface.getElementById(id) ?? (surface.store.getModelById(id) as GfxModel);
  const updateConnectorPath = (connector: ConnectorElementModel) => {
    if (
      ((connector.source?.id && hasElementById(connector.source.id)) ||
        (!connector.source?.id && connector.source?.position)) &&
      ((connector.target?.id && hasElementById(connector.target.id)) ||
        (!connector.target?.id && connector.target?.position))
    ) {
      ConnectorPathGenerator.updatePath(connector, null, elementGetter);
    }
  };
  const pendingList = new Set<ConnectorElementModel>();
  let pendingFlag = false;
  const addToUpdateList = (connector: ConnectorElementModel) => {
    pendingList.add(connector);

    if (!pendingFlag) {
      pendingFlag = true;
      queueMicrotask(() => {
        pendingList.forEach(updateConnectorPath);
        pendingList.clear();
        pendingFlag = false;
      });
    }
  };

  const disposables = [
    surface.elementAdded.subscribe(({ id }) => {
      const element = elementGetter(id);

      if (!element) return;

      if ('type' in element && element.type === 'connector') {
        addToUpdateList(element as ConnectorElementModel);
      } else {
        surface.getConnectors(id).forEach(addToUpdateList);
      }
    }),
    surface.elementUpdated.subscribe(({ id, props }) => {
      const element = elementGetter(id);

      if (props['vertices']) {
        // When polygon vertices change, re-anchor connected connectors to the
        // nearest valid boundary point BEFORE scheduling the path update, so
        // the path generator uses the corrected anchor positions.
        reanchorConnectorsForPolygon(surface, id, elementGetter);
      }

      if (props['xywh'] || props['rotate'] || props['vertices']) {
        surface.getConnectors(id).forEach(addToUpdateList);
      }

      if (
        'type' in element &&
        element.type === 'connector' &&
        (props['mode'] !== undefined ||
          props['target'] ||
          props['source'] ||
          props['curveControlPoint'] !== undefined)
      ) {
        const connector = element as ConnectorElementModel;

        // Clear custom handle data when connector mode changes
        if (props['mode'] !== undefined) {
          if (connector.curveControlPoint !== null) {
            connector.curveControlPoint = null;
          }
        }

        addToUpdateList(connector);
      }
    }),
    surface.store.slots.blockUpdated.subscribe(payload => {
      if (
        payload.type === 'add' ||
        (payload.type === 'update' && payload.props.key === 'xywh')
      ) {
        surface.getConnectors(payload.id).forEach(addToUpdateList);
      }
    }),
  ];

  surface
    .getElementsByType('connector')
    .forEach(connector =>
      updateConnectorPath(connector as ConnectorElementModel)
    );

  return () => {
    disposables.forEach(d => d.unsubscribe());
  };
};

export const connectorWatcherExtension = surfaceMiddlewareExtension(
  'connector-watcher',
  connectorWatcher
);
