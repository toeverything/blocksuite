import { noop } from '@blocksuite/global/utils';

import { EdgelessToolController } from './edgeless-tool.js';

export type TemplateTool = {
  type: 'template';
};

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

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      template: TemplateToolController;
    }
  }
}
