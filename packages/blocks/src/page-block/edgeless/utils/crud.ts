import type {
  Connectable,
  EdgelessElement,
} from '../../../__internal__/index.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import { isTopLevelBlock } from './query.js';

export function deleteElements(
  surface: SurfaceBlockComponent,
  elements: EdgelessElement[]
) {
  const set = new Set(elements);
  elements.forEach(element => {
    if (isTopLevelBlock(element) || element.connectable) {
      const connectors = surface.connector.getConnecttedConnectors([
        element as Connectable,
      ]);
      connectors.forEach(connector => set.add(connector));
    }
  });

  set.forEach(element => {
    if (isTopLevelBlock(element)) {
      const children = surface.page.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        surface.page.deleteBlock(element);
      }
    } else {
      surface.removeElement(element.id);
    }
  });
}
