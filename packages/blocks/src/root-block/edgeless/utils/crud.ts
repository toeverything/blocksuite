import type { Connectable } from '../../../_common/utils/index.js';
import type { EdgelessRootBlockComponent } from '../index.js';

import { isConnectable, isNoteBlock } from './query.js';

export function deleteElements(
  edgeless: EdgelessRootBlockComponent,
  elements: BlockSuite.EdgelessModel[]
) {
  const set = new Set(elements);
  const { service } = edgeless;

  elements.forEach(element => {
    if (isConnectable(element)) {
      const connectors = service.getConnectors(element as Connectable);
      connectors.forEach(connector => set.add(connector));
    }
  });

  set.forEach(element => {
    if (isNoteBlock(element)) {
      const children = edgeless.doc.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        edgeless.doc.deleteBlock(element);
      }
    } else {
      service.removeElement(element.id);
    }
  });
}
