import type { FrameBlockModel } from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';
import type { IPoint, IVec } from '@blocksuite/global/utils';

import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { Bound, noop, Vec } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import { getTopElements } from '../utils/tree.js';
import { EdgelessToolController } from './edgeless-tool.js';

type FrameTool = {
  type: 'frame';
};

export class FrameToolController extends EdgelessToolController<FrameTool> {
  private _frame: FrameBlockModel | null = null;

  private _startPoint: IVec | null = null;

  readonly tool = {
    type: 'frame',
  } as FrameTool;

  private _toModelCoord(p: IPoint): IVec {
    return this._service.viewport.toModelCoord(p.x, p.y);
  }

  override afterModeSwitch(): void {
    noop();
  }

  override beforeModeSwitch(): void {
    noop();
  }

  override onContainerClick(): void {
    noop();
  }

  override onContainerContextMenu(): void {
    noop();
  }

  override onContainerDblClick(): void {
    noop();
  }

  override onContainerDragEnd(): void {
    if (this._frame) {
      const frame = this._frame;
      this._doc.transact(() => {
        frame.pop('xywh');
      });
      this._edgeless.tools.setEdgelessTool({ type: 'default' });
      this._edgeless.service.selection.set({
        elements: [frame.id],
        editing: false,
      });

      const frameManager = this._edgeless.service.frame;
      frameManager.addElementsToFrame(
        frame,
        getTopElements(frameManager.getElementsInFrameBound(frame))
      );

      this._doc.captureSync();
    }

    this._frame = null;
    this._startPoint = null;
    this._service.frameOverlay.clear();
  }

  override onContainerDragMove(e: PointerEventState): void {
    if (!this._startPoint) return;

    const currentPoint = this._toModelCoord(e.point);
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
      this._service.std
        .getOptional(TelemetryProvider)
        ?.track('CanvasElementAdded', {
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

    this._service.updateElement(this._frame.id, {
      xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
    });

    this._service.frameOverlay.highlight(this._frame, true, false);
  }

  override onContainerDragStart(e: PointerEventState): void {
    this._doc.captureSync();
    const { point } = e;
    this._startPoint = this._toModelCoord(point);
  }

  override onContainerMouseMove(): void {
    noop();
  }

  override onContainerMouseOut(): void {
    noop();
  }

  override onContainerPointerDown(): void {
    noop();
  }

  override onContainerTripleClick(): void {
    noop();
  }

  override onPressShiftKey(): void {
    noop();
  }

  override onPressSpaceBar(_pressed: boolean): void {
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
