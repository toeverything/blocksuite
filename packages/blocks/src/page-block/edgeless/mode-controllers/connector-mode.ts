import {
  createGraph,
  Rectangle,
  route,
  simplifyPath,
} from '@blocksuite/connector';
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
import type { Selectable, SelectionArea } from '../selection-manager.js';
import { getXYWH, pickTopBlock } from '../utils.js';
import { MouseModeController } from './index.js';

function getPointByDirection(
  { x, y, w, h }: Rectangle,
  direction: 'top' | 'right' | 'bottom' | 'left'
) {
  switch (direction) {
    case 'top': {
      return { x: x + w / 2, y };
    }
    case 'right': {
      return { x: x + w, y: y + h / 2 };
    }
    case 'bottom': {
      return { x: x + w / 2, y: y + h };
    }
    case 'left': {
      return { x, y: y + h / 2 };
    }
  }
}

function getPoint(x: number, y: number, rect?: Rectangle | null) {
  if (!rect) {
    return { x, y };
  }
  const direction = rect.relativeDirection(x, y);
  const point = getPointByDirection(rect, direction);
  return point;
}

export class ConnectorModeController extends MouseModeController<ConnectorMouseMode> {
  readonly mouseMode = <ConnectorMouseMode>{
    type: 'connector',
  };

  private _draggingElementId: string | null = null;

  protected _draggingArea: SelectionArea | null = null;
  private _draggingStartElement: Selectable | null = null;
  private _draggingStartRect: Rectangle | null = null;
  // must assign value when dragging start
  private _draggingStartPoint!: { x: number; y: number };

  private _pickBy(
    x: number,
    y: number,
    filter: (element: Selectable) => boolean
  ) {
    const { surface } = this._edgeless;
    const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
    const selectedShapes = surface.pickByPoint(modelX, modelY).filter(filter);

    return selectedShapes.length
      ? selectedShapes[selectedShapes.length - 1]
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

    this._draggingStartElement = this._pickBy(
      e.x,
      e.y,
      ele => ele.id !== id && ele.type !== 'connector'
    );
    this._draggingStartRect = this._draggingStartElement
      ? new Rectangle(...deserializeXYWH(getXYWH(this._draggingStartElement)))
      : null;

    this._draggingStartPoint = getPoint(
      modelX,
      modelY,
      this._draggingStartRect
    );

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

    const startX = this._draggingStartPoint.x;
    const startY = this._draggingStartPoint.y;

    const [endModelX, endModelY] = viewport.toModelCoord(e.x, e.y);
    const end = this._pickBy(
      e.x,
      e.y,
      ele => ele.id !== id && ele.type !== 'connector'
    );
    const endRect =
      end && end.id !== id
        ? new Rectangle(...deserializeXYWH(getXYWH(end)))
        : null;

    const { x: endX, y: endY } = getPoint(endModelX, endModelY, endRect);

    const graphCollection = createGraph(
      [this._draggingStartRect, endRect].filter(r => !!r) as Rectangle[],
      [
        { x: startX, y: startY },
        { x: endX, y: endY },
      ]
    );
    const { graph } = graphCollection;
    const routed = route(
      graph,
      graph.getNode(startX, startY),
      graph.getNode(endX, endY)
    );
    const simplifiedRoute = simplifyPath(routed);

    const bound = getBrushBoundFromPoints(
      simplifiedRoute.map(r => [r.x, r.y]),
      0
    );
    const controllers = simplifiedRoute
      .map(r => [r.x, r.y])
      .flat()
      .map((v, index) => {
        return index % 2 ? v - bound.y : v - bound.x;
      });

    this._surface.updateConnectorElement(id, bound, controllers);
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
