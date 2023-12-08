import { noop } from '@blocksuite/global/utils';

import { FILL_SCREEN_KEY } from '../../../../_common/edgeless/frame/consts.js';
import {
  type EdgelessTool,
  type FrameNavigatorTool,
} from '../../../../_common/utils/index.js';
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

  private _tryLoadNavigatorStateLocalRecord(tool: EdgelessTool) {
    if (tool.type !== 'frameNavigator') return;
    const mode =
      sessionStorage.getItem(FILL_SCREEN_KEY) === 'true' ? 'fill' : 'fit';

    this._edgeless.slots.edgelessToolUpdated.emit({
      type: 'frameNavigator',
      mode,
    });
  }
}
