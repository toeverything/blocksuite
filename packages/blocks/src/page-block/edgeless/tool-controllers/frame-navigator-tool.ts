import { noop } from '@blocksuite/global/utils';

import { type FrameNavigatorTool } from '../../../__internal__/index.js';
import { EdgelessToolController } from './index.js';

export class PresentToolController extends EdgelessToolController<FrameNavigatorTool> {
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
  override beforeModeSwitch(): void {
    noop();
  }
  override afterModeSwitch(): void {
    noop();
  }
  readonly tool = <FrameNavigatorTool>{
    type: 'frameNavigator',
  };
}
