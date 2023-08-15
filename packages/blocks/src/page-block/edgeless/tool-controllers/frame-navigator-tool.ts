import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import { type FrameNavigatorTool } from '../../../__internal__/index.js';
import { EdgelessToolController } from './index.js';

export class PresentToolController extends EdgelessToolController<FrameNavigatorTool> {
  override onContainerPointerDown(e: PointerEventState): void {
    noop();
  }
  override onContainerDragStart(e: PointerEventState): void {
    noop();
  }
  override onContainerDragMove(e: PointerEventState): void {
    noop();
  }
  override onContainerDragEnd(e: PointerEventState): void {
    noop();
  }
  override onContainerClick(e: PointerEventState): void {
    noop();
  }
  override onContainerDblClick(e: PointerEventState): void {
    noop();
  }
  override onContainerTripleClick(e: PointerEventState): void {
    noop();
  }
  override onContainerMouseMove(e: PointerEventState): void {
    noop();
  }
  override onContainerMouseOut(e: PointerEventState): void {
    noop();
  }
  override onContainerContextMenu(e: PointerEventState): void {
    noop();
  }
  override onPressShiftKey(pressed: boolean): void {
    noop();
  }
  override beforeModeSwitch(prevMode: FrameNavigatorTool): void {
    noop();
  }
  override afterModeSwitch(newMode: FrameNavigatorTool): void {
    noop();
  }
  readonly tool = <FrameNavigatorTool>{
    type: 'frameNavigator',
  };
}
