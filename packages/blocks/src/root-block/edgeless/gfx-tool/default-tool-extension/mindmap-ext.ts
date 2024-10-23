import {
  type DragBehaviorContext,
  DragBehaviorExtension,
} from '../default-tool.js';

export class MindMapDragExtension extends DragBehaviorExtension {
  static override key = 'mindmap-drag';

  override initializeDragEvent(_: DragBehaviorContext) {
    return {};
  }
}
