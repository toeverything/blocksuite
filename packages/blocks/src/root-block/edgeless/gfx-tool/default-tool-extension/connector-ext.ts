import { ConnectorElementModel } from '@blocksuite/affine-model';

import {
  type DragBehaviorContext,
  DragBehaviorExtension,
} from '../default-tool.js';

export class ConnectorDragExtension extends DragBehaviorExtension {
  static toolName = 'connector-drag';

  override initializeDragEvent(context: DragBehaviorContext) {
    const elms = new Set(context.dragElements);

    context.dragElements = context.dragElements.filter(elm => {
      if (
        elm instanceof ConnectorElementModel &&
        elm.source?.id &&
        elm.target?.id
      ) {
        if (
          elms.has(this.gfx.getElementById(elm.source.id)!) &&
          elms.has(this.gfx.getElementById(elm.target.id)!)
        ) {
          return false;
        }
      }
      return true;
    });

    // connector needs to be updated first
    context.dragElements.sort(a =>
      a instanceof ConnectorElementModel ? -1 : 1
    );

    return {};
  }
}
