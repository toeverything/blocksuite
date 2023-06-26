import type { PointerEventState } from '@blocksuite/block-std';

import type { TextTool } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { addText } from '../utils.js';
import { EdgelessToolController } from './index.js';

export class TextToolController extends EdgelessToolController<TextTool> {
  readonly tool = <TextTool>{
    type: 'text',
  };

  onContainerClick(e: PointerEventState): void {
    addText(this._edgeless, e);
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerDblClick(e: PointerEventState): void {
    noop();
  }

  onContainerTripleClick(e: PointerEventState) {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    noop();
  }

  onContainerDragMove(e: PointerEventState) {
    noop();
  }

  onContainerDragEnd(e: PointerEventState) {
    noop();
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
