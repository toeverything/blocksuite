import { noop } from '@blocksuite/global/utils';

import type { TemplateTool } from '../../../../_common/types.js';
import { EdgelessToolController } from './index.js';

export class TemplateToolController extends EdgelessToolController<TemplateTool> {
  readonly tool = {
    type: 'template',
  } satisfies TemplateTool;

  onContainerClick() {
    noop();
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onContainerDragStart() {
    noop();
  }

  onContainerDragMove() {
    noop();
  }

  onContainerDragEnd() {
    noop();
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut() {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
