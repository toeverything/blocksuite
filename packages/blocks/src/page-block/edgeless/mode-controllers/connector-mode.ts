import { Rectangle } from '@blocksuite/connector';
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
import {
  generateConnectorPath,
  getAttachedPoint,
  getXYWH,
  pickBy,
} from '../utils.js';
import { MouseModeController } from './index.js';

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
    return pickBy(surface, this._page, x, y, filter);
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
    const { mode, color } = this.mouseMode;

    // create a block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);

    this._draggingStartElement = this._pickBy(
      e.x,
      e.y,
      ele => ele.type !== 'connector'
    );
    this._draggingStartRect = this._draggingStartElement
      ? new Rectangle(...deserializeXYWH(getXYWH(this._draggingStartElement)))
      : null;

    const { point: startPoint, direction: startDirection } = getAttachedPoint(
      modelX,
      modelY,
      this._draggingStartRect
    );

    this._draggingStartPoint = startPoint;

    const bound = new Bound(modelX, modelY, 1, 1);
    const id = this._surface.addConnectorElement(
      bound,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      {
        mode,
        color,
        startElement: this._draggingStartElement
          ? {
              id: this._draggingStartElement.id,
              direction: startDirection,
            }
          : undefined,
      }
    );
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
    const { mode } = this.mouseMode;

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

    const {
      point: { x: endX, y: endY },
      direction: endDirection,
    } = getAttachedPoint(endModelX, endModelY, endRect);

    const routes = generateConnectorPath(
      this._draggingStartRect,
      endRect,
      { x: startX, y: startY },
      { x: endX, y: endY },
      [],
      mode
    );

    const bound = getBrushBoundFromPoints(
      routes.map(r => [r.x, r.y]),
      0
    );
    const controllers = routes.map(v => {
      return {
        ...v,
        x: v.x - bound.x,
        y: v.y - bound.y,
      };
    });

    this._surface.updateConnectorElement(id, bound, controllers, {
      endElement: end ? { id: end.id, direction: endDirection } : undefined,
    });
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
