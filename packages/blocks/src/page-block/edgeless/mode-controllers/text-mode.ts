import type { PointerEventState } from '@blocksuite/lit';

import type { TextMouseMode } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { addText } from '../utils.js';
import { MouseModeController } from './index.js';

export class TextModeController extends MouseModeController<TextMouseMode> {
  readonly mouseMode = <TextMouseMode>{
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
}
