import type { EdgelessModel } from '../../root-block/edgeless/type.js';
import { GroupLikeModel } from '../element-model/base.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { Bound } from '../utils/bound.js';

export function groupSizeMiddleware(surface: SurfaceBlockModel) {
  const getElementById = (id: string) =>
    surface.getElementById(id) ??
    (surface.doc.getBlockById(id) as EdgelessModel);
  let pending = false;
  const groupSet = new Set<GroupLikeModel>();
  const calculateGroupSize = (group: GroupLikeModel) => {
    let bound: Bound | undefined;
    group.childIds.forEach(childId => {
      const elementBound = getElementById(childId)?.elementBound;

      if (elementBound) {
        bound = bound ? bound.unite(elementBound) : elementBound;
      }
    });

    group.xywh = bound?.serialize() ?? '[0,0,0,0]';
  };
  const addGroupUpdateList = (group: GroupLikeModel) => {
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
    surface.elementUpdated.on(({ id, props }) => {
      // update the group's xywh when children's xywh updated
      const group = surface.getGroup(id);

      if (group instanceof GroupLikeModel && props['xywh']) {
        addGroupUpdateList(group);
      }
    }),
    surface.elementAdded.on(({ id }) => {
      // update the group's xywh when added
      const group = surface.getElementById(id);

      if (group instanceof GroupLikeModel) {
        addGroupUpdateList(group);
      }
    }),
  ];

  return () => {
    disposables.forEach(d => d.dispose());
  };
}

export function groupRelationMiddleware(surface: SurfaceBlockModel) {
  const disposables = [
    surface.elementRemoved
      .filter(payload => payload.local)
      .on(({ id }) => {
        // remove the child from group when child is removed
        const group = surface.getGroup(id)!;

        group?.removeDescendant(id);
      }),
    surface.elementUpdated
      .filter(payload => payload.local)
      .on(({ id, props }) => {
        const element = surface.getElementById(id)!;

        // remove the group if it has no children
        if (element instanceof GroupLikeModel && props['childIds']) {
          if (element.childIds.length === 0) {
            surface.removeElement(id);
          }
        }
      }),
  ];

  return () => {
    disposables.forEach(d => d.dispose());
  };
}
