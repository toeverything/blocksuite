import { SurfaceGroupLikeModel } from '../element-model/base.js';
import type { SurfaceBlockModel, SurfaceMiddleware } from '../surface-model.js';
import type { Bound } from '../utils/bound.js';

export const groupSizeMiddleware: SurfaceMiddleware = (
  surface: SurfaceBlockModel
) => {
  const getElementById = (id: string) =>
    surface.getElementById(id) ??
    (surface.doc.getBlockById(id) as BlockSuite.EdgelessModelType);
  let pending = false;
  const groupSet = new Set<SurfaceGroupLikeModel>();
  const calculateGroupSize = (group: SurfaceGroupLikeModel) => {
    let bound: Bound | undefined;
    group.childIds.forEach(childId => {
      const elementBound = getElementById(childId)?.elementBound;

      if (elementBound) {
        bound = bound ? bound.unite(elementBound) : elementBound;
      }
    });

    group.xywh = bound?.serialize() ?? '[0,0,0,0]';
  };
  const addGroupSizeUpdateList = (group: SurfaceGroupLikeModel) => {
    groupSet.add(group);

    if (!pending) {
      pending = true;
      queueMicrotask(() => {
        groupSet.forEach(group => {
          calculateGroupSize(group);
        });
        groupSet.clear();
        pending = false;
      });
    }
  };

  const disposables = [
    surface.doc.slots.blockUpdated.on(payload => {
      if (payload.type === 'update') {
        const group = surface.getGroup(payload.id);

        if (
          group instanceof SurfaceGroupLikeModel &&
          payload.props.key === 'xywh'
        ) {
          addGroupSizeUpdateList(group);
        }
      }
    }),
    surface.elementUpdated.on(({ id, props }) => {
      // update the group's xywh when children's xywh updated
      const group = surface.getGroup(id);
      if (group instanceof SurfaceGroupLikeModel && props['xywh']) {
        addGroupSizeUpdateList(group);
      }

      const element = surface.getElementById(id);
      if (element instanceof SurfaceGroupLikeModel && props['childIds']) {
        addGroupSizeUpdateList(element);
      }
    }),
    surface.elementAdded.on(({ id }) => {
      // update the group's xywh when added
      const group = surface.getElementById(id);

      if (group instanceof SurfaceGroupLikeModel) {
        addGroupSizeUpdateList(group);
      }
    }),
  ];

  surface.elementModels.forEach(model => {
    if (model instanceof SurfaceGroupLikeModel) {
      addGroupSizeUpdateList(model);
    }
  });

  return () => {
    disposables.forEach(d => d.dispose());
  };
};

export const groupRelationMiddleware: SurfaceMiddleware = (
  surface: SurfaceBlockModel
) => {
  const disposables = [
    surface.elementUpdated
      .filter(payload => payload.local)
      .on(({ id, props }) => {
        const element = surface.getElementById(id)!;

        // remove the group if it has no children
        if (element instanceof SurfaceGroupLikeModel && props['childIds']) {
          if (element.childIds.length === 0) {
            surface.removeElement(id);
          }
        }
      }),
  ];

  return () => {
    disposables.forEach(d => d.dispose());
  };
};
