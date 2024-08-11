import type { FrameBlockModel, NoteBlockModel } from '@blocksuite/affine-model';
import type { Doc } from '@blocksuite/store';

import { Bound, DisposableGroup, assertExists } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootService } from '../../index.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';

import { Overlay, type RoughCanvas } from '../../surface-block/index.js';
import { GfxBlockModel } from './block-model.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import { isFrameBlock } from './utils/query.js';

const MIN_FRAME_WIDTH = 800;
const MIN_FRAME_HEIGHT = 640;
const FRAME_PADDING = 40;

export function removeContainedFrames(frames: FrameBlockModel[]) {
  return frames.filter(frame => {
    const bound = Bound.deserialize(frame.xywh);
    return frames.some(
      f => f.id === frame.id || !Bound.deserialize(f.xywh).contains(bound)
    );
  });
}

export class FrameOverlay extends Overlay {
  bound: Bound | null = null;

  clear() {
    this.bound = null;
    this._renderer?.refresh();
  }

  highlight(frame: FrameBlockModel) {
    const bound = Bound.deserialize(frame.xywh);

    this.bound = bound;
    this._renderer?.refresh();
  }

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    if (!this.bound) return;
    const { x, y, w, h } = this.bound;
    ctx.beginPath();
    ctx.strokeStyle = '#1E96EB';
    ctx.lineWidth = 2;
    ctx.roundRect(x, y, w, h, 8);
    ctx.stroke();
  }
}

export function isFrameInner(
  frame: FrameBlockModel,
  frames: FrameBlockModel[]
) {
  const bound = Bound.deserialize(frame.xywh);
  return frames.some(
    f => f.id !== frame.id && Bound.deserialize(f.xywh).contains(bound)
  );
}

export class EdgelessFrameManager {
  private _disposable = new DisposableGroup();

  constructor(private _rootService: EdgelessRootService) {}

  createFrameOnSelected() {
    const frames = this._rootService.frames;
    const surfaceModel =
      this._rootService.doc.getBlockByFlavour('affine:surface')[0];

    let bound = edgelessElementsBound(
      this._rootService.selection.selectedElements
    );
    bound = bound.expand(FRAME_PADDING);
    if (bound.w < MIN_FRAME_WIDTH) {
      const offset = (MIN_FRAME_WIDTH - bound.w) / 2;
      bound = bound.expand(offset, 0);
    }
    if (bound.h < MIN_FRAME_HEIGHT) {
      const offset = (MIN_FRAME_HEIGHT - bound.h) / 2;
      bound = bound.expand(0, offset);
    }
    const id = this._rootService.addBlock(
      'affine:frame',
      {
        title: new DocCollection.Y.Text(`Frame ${frames.length + 1}`),
        xywh: bound.serialize(),
      },
      surfaceModel
    );
    const frameModel = this._rootService.getElementById(id);
    this._rootService.doc.captureSync();
    assertExists(frameModel);

    this._rootService.selection.set({
      elements: [frameModel.id],
      editing: false,
    });

    return this._rootService.getElementById(id);
  }

  dispose() {
    this._disposable.dispose();
  }

  getElementsInFrame(frame: FrameBlockModel, fullyContained = true) {
    const bound = Bound.deserialize(frame.xywh);
    const elements: BlockSuite.EdgelessModel[] =
      this._rootService.layer.canvasGrid.search(bound, true);

    return elements.concat(
      getBlocksInFrame(this._rootService.doc, frame, fullyContained)
    );
  }

  selectFrame(eles: BlockSuite.EdgelessModel[]) {
    const frames = this._rootService.frames;
    if (frames.length === 0) return null;

    const selectedFrames = eles.filter(ele => isFrameBlock(ele));
    const bound = edgelessElementsBound(eles);
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];
      if (selectedFrames.includes(frame)) continue;
      if (Bound.deserialize(frame.xywh).contains(bound)) {
        return frame;
      }
    }
    return null;
  }
}

export function getNotesInFrame(
  doc: Doc,
  frame: FrameBlockModel,
  fullyContained: boolean = true
) {
  const bound = Bound.deserialize(frame.xywh);

  return (doc.getBlockByFlavour('affine:note') as NoteBlockModel[]).filter(
    ele => {
      const xywh = Bound.deserialize(ele.xywh);

      return fullyContained
        ? bound.contains(xywh)
        : bound.isPointInBound([xywh.x, xywh.y]);
    }
  ) as NoteBlockModel[];
}

export function getBlocksInFrame(
  doc: Doc,
  model: FrameBlockModel,
  fullyContained: boolean = true
) {
  const bound = Bound.deserialize(model.xywh);
  const surfaceModel = doc.getBlockByFlavour([
    'affine:surface',
  ]) as SurfaceBlockModel[];

  return (
    getNotesInFrame(
      doc,
      model,
      fullyContained
    ) as BlockSuite.EdgelessBlockModelType[]
  ).concat(
    surfaceModel[0].children.filter(ele => {
      if (ele.id === model.id) return;
      if (ele instanceof GfxBlockModel) {
        const blockBound = Bound.deserialize(ele.xywh);
        return fullyContained
          ? bound.contains(blockBound)
          : bound.containsPoint([blockBound.x, blockBound.y]);
      }

      return false;
    }) as BlockSuite.EdgelessBlockModelType[]
  );
}
