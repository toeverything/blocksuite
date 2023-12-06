import type { TemplateTool } from '../../../../_common/utils/types.js';
import { EdgelessToolController } from './index.js';

export class TemplateToolController extends EdgelessToolController<TemplateTool> {
  readonly tool: TemplateTool = {
    type: 'template',
  };

  onContainerPointerDown(): void {}
  onContainerDragStart(): void {}
  onContainerDragMove(): void {}
  onContainerDragEnd(): void {}
  onContainerClick(): void {}
  onContainerDblClick(): void {}
  onContainerTripleClick(): void {}
  onContainerMouseMove(): void {}
  override onContainerContextMenu(): void {}
  override onPressShiftKey(): void {}
  override onContainerMouseOut(): void {}

  override beforeModeSwitch(): void {}
  override afterModeSwitch(): void {}
}
