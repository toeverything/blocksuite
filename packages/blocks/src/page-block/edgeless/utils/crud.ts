import type {
  Connectable,
  EdgelessModel,
} from '../../../_common/utils/index.js';
import type { ShapeElementModel } from '../../../surface-block/index.js';
import { Bound, GroupElementModel } from '../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import { isConnectable, isNoteBlock } from './query.js';

export function deleteElements(
  surface: SurfaceBlockComponent,
  elements: EdgelessModel[]
) {
  const set = new Set(elements);
  const service = surface.edgeless.service;

  elements.forEach(element => {
    if (isConnectable(element)) {
      const connectors = service.getConnectors(element as Connectable);
      connectors.forEach(connector => set.add(connector));
    }

    if (element instanceof GroupElementModel) {
      element.decendants().forEach(child => {
        set.add(child);
      });
    }
  });

  set.forEach(element => {
    if (isNoteBlock(element)) {
      const children = surface.page.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        surface.page.deleteBlock(element);
      }
    } else {
      service.removeElement(element.id);
    }
  });
}

export function duplicateElements(
  surface: SurfaceBlockComponent,
  element: ShapeElementModel
) {
  const delta = [0, 0];
  const bound = new Bound(
    element.x + delta[0],
    element.y + delta[1],
    element.w,
    element.h
  );
  const service = surface.edgeless.service;
  service.addElement(element.type, {
    shapeType: element.shapeType,
    xywh: bound.serialize(),
  });
}
