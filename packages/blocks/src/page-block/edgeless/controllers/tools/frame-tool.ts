import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import {
  type FrameTool,
  type IPoint,
} from '../../../../_common/utils/index.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import { EdgelessBlockType } from '../../../../surface-block/edgeless-types.js';
import { Bound, type IVec, Vec } from '../../../../surface-block/index.js';
import { EdgelessToolController } from './index.js';

export class FrameToolController extends EdgelessToolController<FrameTool> {
  readonly tool = <FrameTool>{
    type: 'frame',
  };

  private _startPoint: IVec | null = null;
  private _frame: FrameBlockModel | null = null;

  private _toModelCoord(p: IPoint): IVec {
    return this._surface.viewport.toModelCoord(p.x, p.y);
  }

  override onContainerPointerDown(): void {
    noop();
  }
  override onContainerDragStart(e: PointerEventState): void {
    this._page.captureSync();
    const { point } = e;
    this._startPoint = this._toModelCoord(point);
  }
  override onContainerDragMove(e: PointerEventState): void {
    const currentPoint = this._toModelCoord(e.point);
    const surface = this._surface;
    assertExists(this._startPoint);
    if (Vec.dist(this._startPoint, currentPoint) < 8 && !this._frame) return;
    if (!this._frame) {
      const frames = surface.frame.frames;

      const id = surface.addElement(
        EdgelessBlockType.FRAME,
        {
          title: new Workspace.Y.Text(`Frame ${frames.length + 1}`),
          xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
        },
        surface.model
      );
      this._frame = surface.pickById(id) as FrameBlockModel;
      return;
    }
    assertExists(this._frame);

    this._edgeless.updateElementInLocal(this._frame.id, {
      xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
    });
  }
  override onContainerDragEnd(): void {
    if (this._frame) {
      this._edgeless.applyLocalRecord([this._frame.id]);
      this._edgeless.tools.setEdgelessTool({ type: 'default' });
      this._edgeless.selectionManager.setSelection({
        elements: [this._frame.id],
        editing: false,
      });
      this._page.captureSync();
    }
    this._frame = null;
    this._startPoint = null;
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
}
