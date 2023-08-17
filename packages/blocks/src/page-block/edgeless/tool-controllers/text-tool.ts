import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import type { TextTool } from '../../../__internal__/index.js';
import { addText } from '../utils/text.js';
import { EdgelessToolController } from './index.js';

export class TextToolController extends EdgelessToolController<TextTool> {
  readonly tool = <TextTool>{
    type: 'text',
  };

  onContainerClick(e: PointerEventState): void {
    addText(this._edgeless, e);
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

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
