import { assertExists } from '@blocksuite/global/utils';
import {
  Bound,
  deserializeXYWH,
  getBrushBoundFromPoints,
} from '@blocksuite/phasor';

import type {
  ConnectorMouseMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import type { SelectionArea } from '../selection-manager.js';
import { getXYWH, pickTopBlock } from '../utils.js';
import { Direction } from './connector/constants.js';
import { createRoute } from './connector/route.js';
import { MouseModeController } from './index.js';

function findDirection(x: number, y: number, bound: Bound) {
  const c = {
    [Direction.LEFT]: Math.abs(x - bound.x),
    [Direction.RIGHT]: Math.abs(x - bound.x - bound.w),
    [Direction.TOP]: Math.abs(y - bound.y),
    [Direction.BOTTOM]: Math.abs(y - bound.y - bound.h),
  };
  let min: number;
  let d: Direction = Direction.TOP;
  Object.entries(c).forEach(([k, v]) => {
    if (min === undefined) {
      min = v;
      d = k as Direction;
    } else {
      if (v < min) {
        min = v;
        d = k as Direction;
      }
    }
  });
  return d;
}

function getAnchorPoint(bound: Bound, direction: Direction) {
  switch (direction) {
    case Direction.TOP: {
      return [bound.x + bound.w / 2, bound.y];
    }
    case Direction.RIGHT: {
      return [bound.x + bound.w, bound.y + bound.h / 2];
    }
    case Direction.BOTTOM: {
      return [bound.x + bound.w / 2, bound.y + bound.h];
    }
    case Direction.LEFT: {
      return [bound.x, bound.y + bound.h / 2];
    }
  }
}

export class ConnectorModeController extends MouseModeController<ConnectorMouseMode> {
  readonly mouseMode = <ConnectorMouseMode>{
    type: 'connector',
  };

  private _draggingElementId: string | null = null;

  protected _draggingArea: SelectionArea | null = null;

  private _pick(x: number, y: number) {
    const { surface } = this._edgeless;
    const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
    const selectedShape = surface.pickTop(modelX, modelY);
    return selectedShape
      ? selectedShape
      : pickTopBlock(this._blocks, modelX, modelY);
  }

  onContainerClick(e: SelectionEvent): void {
    noop();
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    this._page.captureSync();
    const { viewport } = this._edgeless.surface;

    // create a block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const bound = new Bound(modelX, modelY, 1, 1);
    const id = this._surface.addConnectorElement(bound, [0, 0, 1, 1]);
    this._draggingElementId = id;

    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragMove(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingArea);

    const { viewport } = this._edgeless.surface;

    this._draggingArea.end = new DOMPoint(e.x, e.y);

    const id = this._draggingElementId;

    const [startX, startY] = viewport.toModelCoord(
      this._draggingArea.start.x,
      this._draggingArea.start.y
    );
    const start = this._pick(
      this._draggingArea.start.x,
      this._draggingArea.start.y
    );
    const [sx, sy, sw, sh] =
      start && start.id !== id ? deserializeXYWH(getXYWH(start)) : [0, 0, 0, 0];
    const startBox =
      start && start.id !== id
        ? [
            [sx, sy],
            [sx + sw, sy],
            [sx + sw, sy + sh],
            [sx, sy + sh],
          ]
        : [
            [startX - 10, startY - 10],
            [startX + 10, startY - 10],
            [startX + 10, startY + 10],
            [startX - 10, startY + 10],
          ];
    const startBound = {
      x: startBox[0][0],
      y: startBox[0][1],
      w: startBox[1][0] - startBox[0][0],
      h: startBox[2][1] - startBox[1][1],
    };
    const sDirection = findDirection(startX, startY, startBound);
    const sAnchor = getAnchorPoint(startBound, sDirection);

    const [endX, endY] = viewport.toModelCoord(e.x, e.y);
    const end = this._pick(e.x, e.y);
    const [ex, ey, ew, eh] =
      end && end.id !== id ? deserializeXYWH(getXYWH(end)) : [0, 0, 0, 0];
    const endBox =
      end && end.id !== id
        ? [
            [ex, ey],
            [ex + ew, ey],
            [ex + ew, ey + eh],
            [ex, ey + eh],
          ]
        : [
            [endX - 10, endY - 10],
            [endX + 10, endY - 10],
            [endX + 10, endY + 10],
            [endX - 10, endY + 10],
          ];
    const endBound = {
      x: endBox[0][0],
      y: endBox[0][1],
      w: endBox[1][0] - endBox[0][0],
      h: endBox[2][1] - endBox[1][1],
    };
    const eDirection = findDirection(endX, endY, endBound);
    const eAnchor = getAnchorPoint(endBound, eDirection);

    const d = createRoute(
      {
        box: startBox,
        direction: sDirection,
        origin: sAnchor,
      },
      {
        box: endBox,
        direction: eDirection,
        origin: eAnchor,
      },
      20
    );

    const b = getBrushBoundFromPoints(d.path.path, 0);
    const controllers = [...d.path.path.flat()].map((v, index) => {
      return index % 2 ? v - b.y : v - b.x;
    });

    this._surface.updateConnectorElement(id, b, controllers);
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragEnd(e: SelectionEvent) {
    this._draggingElementId = null;
    this._draggingArea = null;
    this._page.captureSync();
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerMouseMove(e: SelectionEvent) {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent) {
    noop();
  }

  clearSelection() {
    noop();
  }
}
