import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import { addText } from '../../utils/text.js';
import { EdgelessToolController } from './edgeless-tool.js';

export type TextTool = {
  type: 'text';
};

export class TextToolController extends EdgelessToolController<TextTool> {
  readonly tool = {
    type: 'text',
  } as TextTool;

  onContainerClick(e: PointerEventState): void {
    const textFlag = this._edgeless.doc.awarenessStore.getFlag(
      'enable_edgeless_text'
    );

    if (textFlag) {
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
    } else {
      addText(this._edgeless, e);
    }
    this._service.telemetryService?.track('CanvasElementAdded', {
      control: 'canvas:draw',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: 'text',
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

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      text: TextToolController;
    }
  }
}
