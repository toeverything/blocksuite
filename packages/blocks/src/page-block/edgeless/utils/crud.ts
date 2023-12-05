import type {
  Connectable,
  EdgelessElement,
} from '../../../_common/utils/index.js';
import { GroupElement } from '../../../surface-block/index.js';
import { getElementsFromGroup } from '../../../surface-block/managers/group-manager.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import { isConnectable, isNoteBlock } from './query.js';

export function deleteElements(
  surface: SurfaceBlockComponent,
  elements: EdgelessElement[]
) {
  const set = new Set(elements);
  elements.forEach(element => {
    if (isConnectable(element)) {
      const connectors = surface.connector.getConnecttedConnectors([
        element as Connectable,
      ]);
      connectors.forEach(connector => set.add(connector));
    }

    if (element instanceof GroupElement) {
      getElementsFromGroup(element).forEach(child => {
        set.add(child);
      });
    }
  });

  set.forEach(element => {
    if (isNoteBlock(element)) {
      const children = surface.page.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        surface.page.deleteBlock(surface.unwrap(element));
      }
    } else {
      surface.removeElement(element.id);
    }
  });
}
