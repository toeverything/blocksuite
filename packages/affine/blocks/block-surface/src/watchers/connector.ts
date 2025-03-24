import type { ConnectorElementModel } from '@blocksuite/affine-model';
import type { GfxModel } from '@blocksuite/block-std/gfx';

import { ConnectorPathGenerator } from '../managers/connector-manager.js';
import type { SurfaceBlockModel, SurfaceMiddleware } from '../surface-model.js';

export const connectorWatcher: SurfaceMiddleware = (
  surface: SurfaceBlockModel
) => {
  const hasElementById = (id: string) =>
    surface.hasElementById(id) || surface.doc.hasBlock(id);
  const elementGetter = (id: string) =>
    surface.getElementById(id) ?? (surface.doc.getModelById(id) as GfxModel);
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

      if (props['xywh'] || props['rotate']) {
        surface.getConnectors(id).forEach(addToUpdateList);
      }

      if (
        'type' in element &&
        element.type === 'connector' &&
        (props['mode'] !== undefined ||
          props['target'] ||
          props['source'] ||
          (props['xywh'] && !(element as ConnectorElementModel).updatingPath))
      ) {
        addToUpdateList(element as ConnectorElementModel);
      }
    }),
    surface.doc.slots.blockUpdated.subscribe(payload => {
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
