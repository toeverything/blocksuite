import { noop } from '@blocksuite/global/utils';

import { EdgelessToolController } from './edgeless-tool.js';

type MindmapTool = {
  type: 'mindmap';
};

export class MindmapToolController extends EdgelessToolController<MindmapTool> {
  readonly tool = {
    type: 'mindmap',
  } as MindmapTool;

  override afterModeSwitch(): void {
    noop();
  }

  override beforeModeSwitch(): void {
    noop();
  }

  override onContainerClick(): void {
    noop();
  }

  override onContainerContextMenu(): void {
    noop();
  }

  override onContainerDblClick(): void {
    noop();
  }

  override onContainerDragEnd(): void {
    noop();
  }

  override onContainerDragMove(): void {
    noop();
  }

  override onContainerDragStart(): void {
    noop();
  }

  override onContainerMouseMove(): void {
    noop();
  }

  override onContainerMouseOut(): void {
    noop();
  }

  override onContainerPointerDown(): void {
    noop();
  }

  override onContainerTripleClick(): void {
    noop();
  }

  override onPressShiftKey(): void {
    noop();
  }

  override onPressSpaceBar(_pressed: boolean): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      mindmap: MindmapToolController;
    }
  }
}
