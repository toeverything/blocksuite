import type { GroupElementModel } from '../element-model/group.js';
import type { SurfaceBlockModel } from '../surface-model.js';

export function groupMiddleware(surface: SurfaceBlockModel) {
  const disposables = [
    surface.elementRemoved.on(({ id }) => {
      const group = surface.getGroup(id)!;

      group?.removeChild(id);
    }),
    surface.elementUpdated.on(({ id, props }) => {
      const element = surface.getElementById(id)!;

      if (element.type === 'group' && props['childIds']) {
        if ((element as GroupElementModel).childIds.length === 0) {
          surface.removeElement(id);
        }
      }
    }),
  ];

  return () => {
    disposables.forEach(d => d.dispose());
  };
}
