import type { Connectable } from '../../../_common/utils/index.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';

import { isConnectable, isNoteBlock } from './query.js';

export function deleteElements(
  surface: SurfaceBlockComponent,
  elements: BlockSuite.EdgelessModel[]
) {
  const set = new Set(elements);
  const service = surface.edgeless.service;

  elements.forEach(element => {
    if (isConnectable(element)) {
      const connectors = service.getConnectors(element as Connectable);
      connectors.forEach(connector => set.add(connector));
    }
  });

  set.forEach(element => {
    if (isNoteBlock(element)) {
      const children = surface.doc.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        surface.doc.deleteBlock(element);
      }
    } else {
      service.removeElement(element.id);
    }
  });
}
