import { SurfaceGroupLikeModel } from '../element-model/base.js';
import type { SurfaceBlockModel, SurfaceMiddleware } from '../surface-model.js';

export const groupRelationWatcher: SurfaceMiddleware = (
  surface: SurfaceBlockModel
) => {
  const disposables = [
    surface.elementUpdated.subscribe(({ id, props, local }) => {
      if (!local) return;

      const element = surface.getElementById(id)!;

      // remove the group if it has no children
      if (
        element instanceof SurfaceGroupLikeModel &&
        props['childIds'] &&
        element.childIds.length === 0
      ) {
        surface.deleteElement(id);
      }
    }),
  ];

  return () => {
    disposables.forEach(d => d.unsubscribe());
  };
};
