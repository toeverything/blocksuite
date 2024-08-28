import { noop } from '@blocksuite/global/utils';

import { EdgelessToolController } from './edgeless-tool.js';

export type TemplateTool = {
  type: 'template';
};

export class TemplateToolController extends EdgelessToolController<TemplateTool> {
  readonly tool = {
    type: 'template',
  } satisfies TemplateTool;

  afterModeSwitch() {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  onContainerClick() {
    noop();
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerDragEnd() {
    noop();
  }

  onContainerDragMove() {
    noop();
  }

  onContainerDragStart() {
    noop();
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut() {
    noop();
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      template: TemplateToolController;
    }
  }
}
