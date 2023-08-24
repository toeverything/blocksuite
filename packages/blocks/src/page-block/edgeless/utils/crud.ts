import type {
  Connectable,
  EdgelessElement,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { isTopLevelBlock } from './query.js';

export function deleteElements(
  edgeless: EdgelessPageBlockComponent,
  elements: EdgelessElement[]
) {
  const set = new Set(elements);
  elements.forEach(element => {
    if (isTopLevelBlock(element) || element.connectable) {
      const connectors = edgeless.connector.getConnecttedConnectors([
        element as Connectable,
      ]);
      connectors.forEach(connector => set.add(connector));
    }
  });

  set.forEach(element => {
    if (isTopLevelBlock(element)) {
      const children = edgeless.page.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        edgeless.page.deleteBlock(element);
      }
    } else {
      edgeless.surface.removeElement(element.id);
    }
  });
}
