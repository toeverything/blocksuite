import type { ConnectorElementModel } from '../index.js';
import type { SurfaceBlockModel, SurfaceMiddleware } from '../surface-model.js';

import { ConnectorPathGenerator } from '../managers/connector-manager.js';

export const connectorMiddleware: SurfaceMiddleware = (
  surface: SurfaceBlockModel
) => {
  const hasElementById = (id: string) =>
    surface.hasElementById(id) || surface.doc.hasBlockById(id);
  const getElementById = (id: string) =>
    surface.getElementById(id) ??
    (surface.doc.getBlockById(id) as BlockSuite.EdgelessModel);
  const pathGenerator = new ConnectorPathGenerator({
    getElementById: getElementById,
  });
  const updateConnectorPath = (connector: ConnectorElementModel) => {
    if (
      ((connector.source?.id && hasElementById(connector.source.id)) ||
        (!connector.source?.id && connector.source?.position)) &&
      ((connector.target?.id && hasElementById(connector.target.id)) ||
        (!connector.target?.id && connector.target?.position))
    ) {
      pathGenerator.updatePath(connector);
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
    surface.elementAdded.on(({ id }) => {
      const element = getElementById(id);

      if (!element) return;

      if ('type' in element && element.type === 'connector') {
        addToUpdateList(element as ConnectorElementModel);
      } else {
        surface.getConnectors(id).forEach(addToUpdateList);
      }
    }),
    surface.elementUpdated.on(({ id, props }) => {
      const element = getElementById(id);

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
    surface.doc.slots.blockUpdated.on(payload => {
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
    disposables.forEach(d => d.dispose());
  };
};
