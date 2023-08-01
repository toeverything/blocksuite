import type { PointerEventState } from '@blocksuite/block-std';

import { noop, type PresentTool } from '../../../__internal__/index.js';
import { EdgelessToolController } from './index.js';

export class PresentToolController extends EdgelessToolController<PresentTool> {
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
  override beforeModeSwitch(prevMode: PresentTool): void {
    noop();
  }
  override afterModeSwitch(newMode: PresentTool): void {
    noop();
  }
  readonly tool = <PresentTool>{
    type: 'present',
  };
}
