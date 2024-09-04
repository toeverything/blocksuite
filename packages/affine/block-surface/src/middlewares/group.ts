import type { SurfaceBlockModel, SurfaceMiddleware } from '../surface-model.js';

import { SurfaceGroupLikeModel } from '../element-model/base.js';

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
