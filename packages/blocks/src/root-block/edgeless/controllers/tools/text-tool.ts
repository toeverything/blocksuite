import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import { type TextTool } from '../../../../_common/utils/index.js';
import { EdgelessToolController } from './index.js';

export class TextToolController extends EdgelessToolController<TextTool> {
  readonly tool = <TextTool>{
    type: 'text',
  };

  onContainerClick(e: PointerEventState): void {
    // old: canvas text element
    // addText(this._edgeless, e);

    // new: edgeless text block
    const [x, y] = this._service.viewport.toModelCoord(e.x, e.y);
    const textService = this._edgeless.host.spec.getService(
      'affine:edgeless-text'
    );
    textService.initEdgelessTextBlock({
      edgeless: this._edgeless,
      x,
      y,
    });
    this._service.tool.setEdgelessTool({
      type: 'default',
    });
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
