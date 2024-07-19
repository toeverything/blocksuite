import { noop } from '@blocksuite/global/utils';

import type { NavigatorMode } from '../../../../_common/edgeless/frame/consts.js';

import { EdgelessToolController } from './edgeless-tool.js';

type FrameNavigatorTool = {
  type: 'frameNavigator';
  mode?: NavigatorMode;
};

export class PresentToolController extends EdgelessToolController<FrameNavigatorTool> {
  readonly tool = {
    type: 'frameNavigator',
  } as FrameNavigatorTool;

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
      'frame-navigator': PresentToolController;
    }
  }
}
