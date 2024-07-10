import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { IPoint } from '../../../../_common/utils/index.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import { Bound, type IVec, Vec } from '../../../../surface-block/index.js';
import { EdgelessToolController } from './edgeless-tool.js';

type FrameTool = {
  type: 'frame';
};

export class FrameToolController extends EdgelessToolController<FrameTool> {
  private _startPoint: IVec | null = null;

  private _frame: FrameBlockModel | null = null;

  readonly tool = {
    type: 'frame',
  } as FrameTool;

  private _toModelCoord(p: IPoint): IVec {
    return this._service.viewport.toModelCoord(p.x, p.y);
  }

  override onContainerPointerDown(): void {
    noop();
  }

  override onContainerDragStart(e: PointerEventState): void {
    this._doc.captureSync();
    const { point } = e;
    this._startPoint = this._toModelCoord(point);
  }

  override onContainerDragMove(e: PointerEventState): void {
    const currentPoint = this._toModelCoord(e.point);
    assertExists(this._startPoint);
    if (Vec.dist(this._startPoint, currentPoint) < 8 && !this._frame) return;
    if (!this._frame) {
      const frames = this._service.frames;

      const id = this._service.addBlock(
        'affine:frame',
        {
          title: new DocCollection.Y.Text(`Frame ${frames.length + 1}`),
          xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
        },
        this._service.surface
      );
      this._service.telemetryService?.track('CanvasElementAdded', {
        control: 'canvas:draw',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: 'frame',
      });
      this._frame = this._service.getElementById(id) as FrameBlockModel;
      this._frame.stash('xywh');
      return;
    }
    assertExists(this._frame);

    this._service.updateElement(this._frame.id, {
      xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
    });
  }

  override onContainerDragEnd(): void {
    if (this._frame) {
      const frame = this._frame;
      this._doc.transact(() => {
        frame.pop('xywh');
      });
      this._edgeless.tools.setEdgelessTool({ type: 'default' });
      this._edgeless.service.selection.set({
        elements: [this._frame.id],
        editing: false,
      });
      this._doc.captureSync();
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

  override onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  override beforeModeSwitch(): void {
    noop();
  }

  override afterModeSwitch(): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      frame: FrameToolController;
    }
  }
}
