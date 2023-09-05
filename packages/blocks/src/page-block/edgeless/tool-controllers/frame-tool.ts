import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import { type FrameTool, type IPoint } from '../../../__internal__/index.js';
import {
  Bound,
  type FrameElement,
  type IVec,
  Vec,
} from '../../../surface-block/index.js';
import { EdgelessToolController } from './index.js';

export class FrameToolController extends EdgelessToolController<FrameTool> {
  readonly tool = <FrameTool>{
    type: 'frame',
  };

  private _startPoint: IVec | null = null;
  private _frameElement: FrameElement | null = null;

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
    const edgeless = this._edgeless;
    const currentPoint = this._toModelCoord(e.point);
    const surface = this._surface;
    assertExists(this._startPoint);
    if (Vec.dist(this._startPoint, currentPoint) < 8 && !this._frameElement)
      return;
    if (!this._frameElement) {
      const frames = surface.frame.frames;

      const id = edgeless.surface.addElement('frame', {
        title: new Y.Text(`Frame ${frames.length + 1}`),
        batch: 'a0',
        xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
      });
      this._frameElement = surface.pickById(id) as FrameElement;
      return;
    }
    assertExists(this._frameElement);

    surface.updateElement(this._frameElement.id, {
      xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
    });
  }
  override onContainerDragEnd(): void {
    if (this._frameElement) {
      this._edgeless.tools.setEdgelessTool({ type: 'default' });
      this._edgeless.selectionManager.setSelection({
        elements: [this._frameElement.id],
        editing: false,
      });
      this._page.captureSync();
    }
    this._frameElement = null;
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
