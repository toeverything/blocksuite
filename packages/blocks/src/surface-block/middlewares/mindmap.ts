import type { EdgelessModel } from '../../root-block/edgeless/type.js';
import { MindmapElementModel } from '../element-model/mindmap.js';
import type { SurfaceBlockModel, SurfaceMiddleware } from '../surface-model.js';

export const mindmapMiddleware: SurfaceMiddleware = (
  surface: SurfaceBlockModel,
  hooks
) => {
  const getElementById = (id: string) =>
    surface.getElementById(id) ??
    (surface.doc.getBlockById(id) as EdgelessModel);
  let layoutUpdPending = false;
  const layoutUpdList = new Set<MindmapElementModel>();
  const updateLayout = (mindmap: MindmapElementModel) => {
    layoutUpdList.add(mindmap);

    if (layoutUpdPending) {
      return;
    }

    layoutUpdPending = true;
    queueMicrotask(() => {
      layoutUpdList.forEach(mindmap => {
        if (mindmap.childIds.every(id => getElementById(id))) {
          mindmap['buildTree']();
          mindmap.layout();
        }
      });
      layoutUpdList.clear();
      layoutUpdPending = false;
    });
  };

  let connUpdPending = false;
  const connUpdList = new Set<MindmapElementModel>();
  const updateConnection = (mindmap: MindmapElementModel) => {
    if (!layoutUpdList.has(mindmap)) connUpdList.add(mindmap);

    if (connUpdPending) {
      return;
    }

    connUpdPending = true;
    queueMicrotask(() => {
      connUpdList.forEach(mindmap => {
        if (mindmap.isConnected) {
          mindmap['buildTree']();
          mindmap.calcConnection();
        }
      });
      connUpdList.clear();
      connUpdPending = false;
    });
  };

  const disposables = [
    surface.elementAdded.on(({ id }) => {
      /**
       * When loading an existing doc, the elements' loading order is not guaranteed
       * So we need to update the mindmap when a new element is added
       */
      const group = surface.getGroup(id);
      if (group instanceof MindmapElementModel) {
        updateConnection(group);
      }

      const element = surface.getElementById(id);
      if (element instanceof MindmapElementModel) {
        updateConnection(element);
      }
    }),
    surface.elementUpdated.on(({ id, props }) => {
      if (props['childIds'] || props['style']) {
        const element = surface.getElementById(id);

        if (element instanceof MindmapElementModel) {
          updateConnection(element);
        }
      }

      if (props['xywh']) {
        const element = surface.getElementById(id);

        if (element?.group instanceof MindmapElementModel) {
          updateConnection(element.group);
        }
      }
    }),
    hooks.update.on(({ id, props }) => {
      // Recalculate mindmap connectors when child xywh is updated
      const mindmap = surface.getGroup(id);
      if (mindmap instanceof MindmapElementModel && props['xywh']) {
        updateLayout(mindmap);
      }
    }),
    hooks.remove.on(({ id }) => {
      const mindmap = surface.getGroup(id);

      if (mindmap instanceof MindmapElementModel) {
        updateLayout(mindmap);
      }
    }),
  ];

  surface.elementModels.forEach(model => {
    if (model instanceof MindmapElementModel) {
      updateConnection(model);
    }
  });

  return () => {
    disposables.forEach(disposable => disposable.dispose());
  };
};
