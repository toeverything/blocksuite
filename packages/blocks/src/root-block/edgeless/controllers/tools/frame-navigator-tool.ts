import { noop } from '@blocksuite/global/utils';

import type { FrameNavigatorTool } from '../../../../_common/utils/index.js';
import { EdgelessToolController } from './index.js';

export class PresentToolController extends EdgelessToolController<FrameNavigatorTool> {
  readonly tool = {
    type: 'frameNavigator',
  } as FrameNavigatorTool;

  override onContainerPointerDown(): void {
    noop();
  }

  override onContainerDragStart(): void {
    noop();
  }

  override onContainerDragMove(): void {
    noop();
  }

  override onContainerDragEnd(): void {
    noop();
  }

  override onContainerClick(): void {
    noop();
  }

  override onContainerDblClick(): void {
    noop();
  }

  override onContainerTripleClick(): void {
    noop();
  }

  override onContainerMouseMove(): void {
    noop();
  }

  override onContainerMouseOut(): void {
    noop();
  }

  override onContainerContextMenu(): void {
    noop();
  }

  override onPressShiftKey(): void {
    noop();
  }

  override onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  override beforeModeSwitch(): void {
    noop();
  }

  override afterModeSwitch(): void {
    noop();
  }
}
