import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import type { EdgelessTool, TextTool } from '../../../__internal__/index.js';
import { GET_DEFAULT_TEXT_COLOR } from '../components/panel/color-panel.js';
import { addText } from '../utils/text.js';
import { EdgelessToolController } from './index.js';

export class TextToolController extends EdgelessToolController<TextTool> {
  readonly tool = <TextTool>{
    type: 'text',
    color: GET_DEFAULT_TEXT_COLOR(),
  };

  onContainerClick(e: PointerEventState): void {
    addText(this._edgeless, e, this.tool.color);
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

  afterModeSwitch(newTool: EdgelessTool) {
    this._tryLoadTextStateLocalRecord(newTool);
  }

  private _tryLoadTextStateLocalRecord(tool: EdgelessTool) {
    if (tool.type !== 'text') return;
    const key = 'blocksuite:' + this._edgeless.page.id + ':edgelessText';
    const textData = sessionStorage.getItem(key);
    if (textData) {
      try {
        const { color } = JSON.parse(textData);
        this._edgeless.slots.edgelessToolUpdated.emit({
          type: 'text',
          color: color ?? GET_DEFAULT_TEXT_COLOR(),
        });
      } catch (e) {
        noop();
      }
    }
  }
}
