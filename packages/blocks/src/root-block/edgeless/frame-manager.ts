import type { SurfaceBlockModel } from '@blocksuite/affine-block-surface';
import type { Doc } from '@blocksuite/store';

import { Overlay } from '@blocksuite/affine-block-surface';
import {
  GroupElementModel,
  MindmapElementModel,
} from '@blocksuite/affine-model';
import {
  type GfxModel,
  isGfxContainerElm,
  renderableInEdgeless,
} from '@blocksuite/block-std/gfx';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  Bound,
  deserializeXYWH,
  DisposableGroup,
  type IVec,
} from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type {
  EdgelessRootService,
  FrameBlockModel,
  NoteBlockModel,
} from '../../index.js';

import { GfxBlockModel } from './block-model.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import { areSetsEqual } from './utils/misc.js';
import { isFrameBlock } from './utils/query.js';
import { getAllDescendantElements, getTopElements } from './utils/tree.js';

const MIN_FRAME_WIDTH = 800;
const MIN_FRAME_HEIGHT = 640;
const FRAME_PADDING = 40;

export class FrameOverlay extends Overlay {
  private _disposable = new DisposableGroup();

  private _frame: FrameBlockModel | null = null;

  private _innerElements = new Set<GfxModel>();

  private get _frameManager() {
    return this._edgelessService.frame;
  }

  constructor(private _edgelessService: EdgelessRootService) {
    super();
  }

  private _reset() {
    this._disposable.dispose();
    this._disposable = new DisposableGroup();

    this._frame = null;
    this._innerElements.clear();
  }

  override clear() {
    if (this._frame === null && this._innerElements.size === 0) return;
    this._reset();
    this._renderer?.refresh();
  }

  highlight(
    frame: FrameBlockModel,
    highlightElementsInBound = false,
    highlightOutline = true
  ) {
    if (!highlightElementsInBound && !highlightOutline) return;

    let needRefresh = false;

    if (highlightOutline && this._frame !== frame) {
      needRefresh = true;
    }

    let innerElements = new Set<GfxModel>();
    if (highlightElementsInBound) {
      innerElements = new Set(
        getTopElements(
          this._frameManager.getElementsInFrameBound(frame)
        ).concat(
          this._frameManager.getChildElementsInFrame(frame).filter(child => {
            return frame.intersectsBound(child.elementBound);
          })
        )
      );
      if (!areSetsEqual(this._innerElements, innerElements)) {
        needRefresh = true;
      }
    }

    if (!needRefresh) return;

    this._reset();
    if (highlightOutline) this._frame = frame;
    if (highlightElementsInBound) this._innerElements = innerElements;

    this._disposable.add(
      frame.deleted.once(() => {
        this.clear();
      })
    );
    this._renderer?.refresh();
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.strokeStyle = '#1E96EB';
    ctx.lineWidth = 2 / this._edgelessService.viewport.zoom;
    const radius = 2 / this._edgelessService.viewport.zoom;

    if (this._frame) {
      const { x, y, w, h } = this._frame.elementBound;
      ctx.roundRect(x, y, w, h, radius);
      ctx.stroke();
    }

    this._innerElements.forEach(element => {
      const [x, y, w, h] = deserializeXYWH(element.xywh);
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(element.rotate);
      ctx.roundRect(-w / 2, -h / 2, w, h, radius);
      ctx.translate(-x - w / 2, -y - h / 2);
      ctx.stroke();
    });
  }
}

export class EdgelessFrameManager {
  private _disposable = new DisposableGroup();

  /**
   * Get all sorted frames
   */
  get frames() {
    return this._rootService.frames;
  }

  constructor(private _rootService: EdgelessRootService) {
    this._watchElementAddedOrDeleted();
  }

  private _addChildrenToLegacyFrame(frame: FrameBlockModel) {
    if (frame.childElementIds !== undefined) return;
    const elements = this.getElementsInFrameBound(frame);
    const childElements = elements.filter(
      element => this.getParentFrame(element) === null && element !== frame
    );

    frame.addChildren(childElements);
  }

  private _addFrameBlock(bound: Bound) {
    const surfaceModel = this._rootService.doc.getBlocksByFlavour(
      'affine:surface'
    )[0].model as SurfaceBlockModel;

    const id = this._rootService.addBlock(
      'affine:frame',
      {
        title: new DocCollection.Y.Text(`Frame ${this.frames.length + 1}`),
        xywh: bound.serialize(),
      },
      surfaceModel
    );
    const frameModel = this._rootService.getElementById(id);

    if (!frameModel || !isFrameBlock(frameModel)) {
      throw new BlockSuiteError(
        ErrorCode.GfxBlockElementError,
        'Frame model is not found'
      );
    }

    return frameModel;
  }

  private _watchElementAddedOrDeleted() {
    this._disposable.add(
      this._rootService.surface.elementAdded.on(({ id, local }) => {
        let element = this._rootService.surface.getElementById(id);
        if (element && local) {
          const frame = this.getFrameFromPoint(element.elementBound.center);

          // TODO(@L-Sun): refactor this in a tree manager
          if (element.group instanceof MindmapElementModel) {
            element = element.group;
          }

          // TODO(@L-Sun): refactor this in a tree manager
          if (element instanceof GroupElementModel) {
            if (frame && element.hasChild(frame)) return;
            element.childElements.forEach(child => {
              // The children of new group may already have a parent frame
              this.removeParentFrame(child);
            });
          }

          frame && this.addElementsToFrame(frame, [element]);
        }
      })
    );

    this._disposable.add(
      this._rootService.surface.elementRemoved.on(({ model, local }) => {
        local && this.removeParentFrame(model);
      })
    );

    this._disposable.add(
      this._rootService.doc.slots.blockUpdated.on(payload => {
        if (
          payload.type === 'add' &&
          payload.model instanceof GfxBlockModel &&
          renderableInEdgeless(
            this._rootService.doc,
            this._rootService.surface,
            payload.model
          )
        ) {
          const frame = this.getFrameFromPoint(
            payload.model.elementBound.center,
            isFrameBlock(payload.model) ? [payload.model] : []
          );
          if (!frame) return;

          if (
            isFrameBlock(payload.model) &&
            payload.model.containsBound(frame.elementBound)
          ) {
            return;
          }
          this.addElementsToFrame(frame, [payload.model]);
        }
        if (payload.type === 'delete') {
          const element = this._rootService.getElementById(payload.model.id);
          if (element) this.removeParentFrame(element);
        }
      })
    );
  }

  /**
   * Reset parent of elements to the frame
   */
  addElementsToFrame(frame: FrameBlockModel, elements: GfxModel[]) {
    if (frame.childElementIds === undefined) {
      this._addChildrenToLegacyFrame(frame);
    }

    elements = elements.filter(
      ({ id }) => id !== frame.id && !frame.childIds.includes(id)
    );

    if (elements.length === 0) return;

    // Remove other relations
    elements.forEach(element => {
      // TODO(@L-Sun): refactor this. This branch is avoid circle, but it's better to handle in a tree manager
      if (isGfxContainerElm(element) && element.childIds.includes(frame.id)) {
        if (isFrameBlock(element)) {
          this.removeParentFrame(frame);
        } else if (element instanceof GroupElementModel) {
          // eslint-disable-next-line unicorn/prefer-dom-node-remove
          element.removeChild(frame.id);
        }
      }

      const parentFrame = this.getParentFrame(element);
      if (parentFrame) {
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        parentFrame.removeChild(element);
      }
    });

    frame.addChildren(elements);
  }

  createFrameOnBound(bound: Bound) {
    const frameModel = this._addFrameBlock(bound);

    this.addElementsToFrame(
      frameModel,
      getTopElements(this.getElementsInFrameBound(frameModel))
    );

    this._rootService.doc.captureSync();

    this._rootService.selection.set({
      elements: [frameModel.id],
      editing: false,
    });

    return frameModel;
  }

  createFrameOnElements(elements: GfxModel[]) {
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

    const frameModel = this._addFrameBlock(bound);

    this.addElementsToFrame(frameModel, getTopElements(elements));

    this._rootService.doc.captureSync();

    this._rootService.selection.set({
      elements: [frameModel.id],
      editing: false,
    });

    return frameModel;
  }

  createFrameOnSelected() {
    return this.createFrameOnElements(
      this._rootService.selection.selectedElements
    );
  }

  createFrameOnViewportCenter(wh: [number, number]) {
    const center = this._rootService.viewport.center;
    const bound = new Bound(
      center.x - wh[0] / 2,
      center.y - wh[1] / 2,
      wh[0],
      wh[1]
    );

    this.createFrameOnBound(bound);
  }

  dispose() {
    this._disposable.dispose();
  }

  /**
   * Get all elements in the frame, there are three cases:
   * 1. The frame doesn't have `childElements`, return all elements in the frame bound but not owned by another frame.
   * 2. Return all child elements of the frame if `childElements` exists.
   */
  getChildElementsInFrame(frame: FrameBlockModel): GfxModel[] {
    if (frame.childElementIds === undefined) {
      return this.getElementsInFrameBound(frame).filter(
        element => this.getParentFrame(element) !== null
      );
    }

    const childElements = frame.childIds
      .map(id => this._rootService.getElementById(id))
      .filter(element => element !== null);

    return childElements;
  }

  /**
   * Get all elements in the frame bound,
   * whatever the element already has another parent frame or not.
   */
  getElementsInFrameBound(frame: FrameBlockModel, fullyContained = true) {
    const bound = Bound.deserialize(frame.xywh);
    const elements: GfxModel[] = this._rootService.gfx.grid
      .search(bound, fullyContained)
      .filter(element => element !== frame);

    return elements;
  }

  /**
   * Get most top frame from the point.
   */
  getFrameFromPoint([x, y]: IVec, ignoreFrames: FrameBlockModel[] = []) {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const frame = this.frames[i];
      if (frame.includesPoint(x, y, {}) && !ignoreFrames.includes(frame)) {
        return frame;
      }
    }
    return null;
  }

  getParentFrame(element: GfxModel) {
    return this.frames.find(frame => {
      return frame.childIds.includes(element.id);
    });
  }

  removeAllChildrenFromFrame(frame: FrameBlockModel) {
    this._rootService.doc.transact(() => {
      frame.childElementIds = {};
    });
  }

  removeParentFrame(element: GfxModel) {
    // TODO(@L-Sun): refactor this with tree manager
    // since current implementation may cause one element has multiple parent containers
    // this is a workaround to avoid this
    if (element.group instanceof MindmapElementModel) element = element.group;
    if (element instanceof MindmapElementModel) {
      [element, ...getAllDescendantElements(element)].forEach(child => {
        const parentFrame = this.getParentFrame(child);
        if (!parentFrame) return;
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        parentFrame.removeChild(child);
      });
      return;
    }

    const parentFrame = this.getParentFrame(element);
    if (!parentFrame) return;

    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    parentFrame.removeChild(element);
  }
}

export function getNotesInFrameBound(
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

export function getBlocksInFrameBound(
  doc: Doc,
  model: FrameBlockModel,
  fullyContained: boolean = true
) {
  const bound = Bound.deserialize(model.xywh);
  const surfaceModel = doc.getBlockByFlavour([
    'affine:surface',
  ]) as SurfaceBlockModel[];

  return (
    getNotesInFrameBound(
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
