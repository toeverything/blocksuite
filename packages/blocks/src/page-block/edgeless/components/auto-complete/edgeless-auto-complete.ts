import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import {
  Bound,
  type Connection,
  type ConnectorElement,
  ConnectorMode,
  type IVec,
  normalizeDegAngle,
  Overlay,
  rotatePoints,
  type RoughCanvas,
  ShapeElement,
  ShapeMethodsMap,
  toDegree,
  Vec,
} from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { AutoCompleteArrowIcon } from '../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { SelectedRect } from '../rects/edgeless-selected-rect.js';
import { getGridBound } from '../utils.js';

enum Direction {
  Right,
  Bottom,
  Left,
  Top,
}

class AutoCompleteOverlay extends Overlay {
  linePoints: IVec[] = [];
  shapePoints: IVec[] = [];
  stroke = '';
  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas) {
    if (this.linePoints.length && this.shapePoints.length) {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = this.stroke;
      ctx.beginPath();
      this.linePoints.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      this.shapePoints.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }
}

const MAIN_GAP = 100;
const SECOND_GAP = 20;

function nextBound(
  type: Direction,
  curShape: ShapeElement,
  elements: ShapeElement[]
) {
  const bound = Bound.deserialize(curShape.xywh);
  const { x, y, w, h } = bound;
  let nextBound: Bound;
  let angle = 0;
  switch (type) {
    case Direction.Right:
      angle = 0;
      break;
    case Direction.Bottom:
      angle = 90;
      break;
    case Direction.Left:
      angle = 180;
      break;
    case Direction.Top:
      angle = 270;
      break;
  }
  angle = normalizeDegAngle(angle + curShape.rotate);

  if (angle >= 45 && angle <= 135) {
    nextBound = new Bound(x, y + h + MAIN_GAP, w, h);
  } else if (angle >= 135 && angle <= 225) {
    nextBound = new Bound(x - w - MAIN_GAP, y, w, h);
  } else if (angle >= 225 && angle <= 315) {
    nextBound = new Bound(x, y - h - MAIN_GAP, w, h);
  } else {
    nextBound = new Bound(x + w + MAIN_GAP, y, w, h);
  }

  function isValidBound(bound: Bound) {
    return !elements.some(e => bound.isIntersectWithBound(getGridBound(e)));
  }

  let count = 0;
  function findValidBound() {
    count++;
    const number = Math.ceil(count / 2);
    const next = nextBound.clone();
    switch (type) {
      case Direction.Right:
      case Direction.Left:
        next.y =
          count % 2 === 1
            ? nextBound.y - (h + SECOND_GAP) * number
            : nextBound.y + (h + SECOND_GAP) * number;
        break;
      case Direction.Bottom:
      case Direction.Top:
        next.x =
          count % 2 === 1
            ? nextBound.x - (w + SECOND_GAP) * number
            : nextBound.x + (w + SECOND_GAP) * number;
        break;
    }
    if (isValidBound(next)) return next;
    return findValidBound();
  }

  return isValidBound(nextBound) ? nextBound : findValidBound();
}

function getPosition(type: Direction) {
  let startPosition: Connection['position'] = [],
    endPosition: Connection['position'] = [];
  switch (type) {
    case Direction.Right:
      startPosition = [1, 0.5];
      endPosition = [0, 0.5];
      break;
    case Direction.Bottom:
      startPosition = [0.5, 1];
      endPosition = [0.5, 0];
      break;
    case Direction.Left:
      startPosition = [0, 0.5];
      endPosition = [1, 0.5];
      break;
    case Direction.Top:
      startPosition = [0.5, 0];
      endPosition = [0.5, 1];
      break;
  }
  return { startPosition, endPosition };
}

@customElement('edgeless-auto-complete')
export class EdgelessAutoComplete extends WithDisposable(LitElement) {
  static override styles = css`
    .edgeless-auto-complete-container {
      position: absolute;
      z-index: 1;
      pointer-events: none;
    }
    .edgeless-auto-complete-arrow {
      width: 16px;
      height: 16px;
      position: absolute;
      z-index: 1;
      opacity: 0.6;
      cursor: pointer;
      pointer-events: auto;
    }
    .edgeless-auto-complete-arrow:hover {
      opacity: 1;
      background: #0000000a;
      border-radius: 4px;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  selectedRect!: SelectedRect;

  @state()
  private _isMoving = false;

  private _overlay = new AutoCompleteOverlay();
  private _timer: ReturnType<typeof setTimeout> | null = null;

  private get _selected() {
    return this.edgeless.selectionManager.elements;
  }

  private get _current() {
    return this._selected[0] as ShapeElement;
  }

  override firstUpdated() {
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() => {
        this._overlay.linePoints = [];
        this._overlay.shapePoints = [];
      })
    );
  }

  private _onPointerDown = (e: PointerEvent, type: Direction) => {
    const { surface } = this.edgeless;
    const viewportRect = surface.viewport.boundingClientRect;
    const start = surface.viewport.toModelCoord(
      e.clientX - viewportRect.left,
      e.clientY - viewportRect.top
    );

    if (!this.edgeless.dispatcher) return;

    let connector: ConnectorElement | null;

    this._disposables.addFromEvent(document, 'pointermove', e => {
      const point = surface.viewport.toModelCoord(
        e.clientX - viewportRect.left,
        e.clientY - viewportRect.top
      );
      if (Vec.dist(start, point) > 8 && !this._isMoving) {
        this._isMoving = true;
        const { startPosition } = getPosition(type);
        connector = this._addConnector(
          {
            id: this._current.id,
            position: startPosition,
          },
          {
            position: point,
          }
        );
      }
      if (this._isMoving) {
        assertExists(connector);
        this.edgeless.connector.updateConnection(connector, point, 'target');
      }
    });

    this._disposables.addFromEvent(document, 'pointerup', () => {
      if (!this._isMoving) {
        this._generateShapeOnClick(type);
      } else if (connector && !connector.target.id) {
        this._generateShapeOnDrag(type, connector);
      }
      this._isMoving = false;
      this.edgeless.connector.clear();
      this._disposables.dispose();
      this._disposables = new DisposableGroup();
    });
  };

  private _addConnector(source: Connection, target: Connection) {
    const { surface } = this.edgeless;
    const id = surface.addElement('connector', {
      mode: ConnectorMode.Orthogonal,
      strokeWidth: 2,
      stroke: this._current.strokeColor,
      source,
      target,
    });
    return surface.pickById(id) as ConnectorElement;
  }

  private _generateShapeOnClick(type: Direction) {
    const { surface } = this.edgeless;
    const bound = this._computeNextShape(type);
    const id = surface.addElement(
      this._current.type,
      this._current.serialize() as unknown as Record<string, unknown>
    );
    surface.updateElement(id, { xywh: bound.serialize() });

    const { startPosition, endPosition } = getPosition(type);
    this._addConnector(
      {
        id: this._current.id,
        position: startPosition,
      },
      {
        id,
        position: endPosition,
      }
    );

    this.edgeless.selectionManager.setSelection({
      elements: [id],
      editing: false,
    });
  }

  private _generateShapeOnDrag(_type: Direction, connector: ConnectorElement) {
    const { surface } = this.edgeless;
    const bound = Bound.deserialize(this._current.xywh);
    const { w, h } = bound;
    const point = connector.target.position;
    assertExists(point);
    const len = connector.path.length;
    const angle = normalizeDegAngle(
      toDegree(Vec.angle(connector.path[len - 2], connector.path[len - 1]))
    );
    const id = surface.addElement(
      this._current.type,
      this._current.serialize() as unknown as Record<string, unknown>
    );
    let nextBound: Bound;
    let position: Connection['position'];

    if (angle >= 45 && angle <= 135) {
      nextBound = new Bound(point[0] - w / 2, point[1], w, h);
      position = [0.5, 0];
    } else if (angle >= 135 && angle <= 225) {
      nextBound = new Bound(point[0] - w, point[1] - h / 2, w, h);
      position = [1, 0.5];
    } else if (angle >= 225 && angle <= 315) {
      nextBound = new Bound(point[0] - w / 2, point[1] - h, w, h);
      position = [0.5, 1];
    } else {
      nextBound = new Bound(point[0], point[1] - h / 2, w, h);
      position = [0, 0.5];
    }

    surface.updateElement(id, { xywh: nextBound.serialize() });
    surface.updateElement<'connector'>(connector.id, {
      target: { id, position },
    });
    this.edgeless.selectionManager.setSelection({
      elements: [id],
      editing: false,
    });
    this.edgeless.page.captureSync();
  }

  private _showNextShape(type: Direction) {
    const { surface } = this.edgeless;
    surface.viewport.addOverlay(this._overlay);
    const bound = this._computeNextShape(type);
    const path = this._computeLine(type, this._current, bound);

    this._overlay.stroke = this.edgeless.computeValue(
      this._current.strokeColor
    );
    this._overlay.linePoints = path;
    this._overlay.shapePoints = rotatePoints(
      ShapeMethodsMap[this._current.shapeType].points(bound),
      bound.center,
      this._current.rotate
    );
    surface.refresh();
  }

  private _computeNextShape(type: Direction) {
    const connectedShapes = this.edgeless.connector
      .getConnecttedElements(this._current)
      .filter(e => e instanceof ShapeElement) as ShapeElement[];
    return nextBound(type, this._current, connectedShapes);
  }

  private _computeLine(
    type: Direction,
    curShape: ShapeElement,
    nextBound: Bound
  ) {
    const startBound = getGridBound(this._current);
    const { startPosition, endPosition } = getPosition(type);
    const nextShape = {
      xywh: nextBound.serialize(),
      rotate: curShape.rotate,
      shapeType: curShape.shapeType,
    };
    const startPoint = curShape.getRelativePointLocation(startPosition);
    const endPoint = curShape.getRelativePointLocation.call(
      nextShape,
      endPosition
    );

    return this.edgeless.connector.generateOrthogonalConnectorPath({
      startBound,
      endBound: nextBound,
      startPoint,
      endPoint,
    });
  }

  override render() {
    if (
      !(
        this._selected.length === 1 &&
        this._selected[0] instanceof ShapeElement &&
        !this._isMoving
      )
    ) {
      this.edgeless.surface.viewport.removeOverlay(this._overlay);
      return nothing;
    }
    const { selectedRect } = this;
    const Arrows = [
      Direction.Right,
      Direction.Bottom,
      Direction.Left,
      Direction.Top,
    ].map(type => {
      let top = 0,
        left = 0,
        transform = '';
      const width = 16;
      const offset = 4;
      switch (type) {
        case Direction.Right:
          top = selectedRect.height / 2 - width / 2;
          left = selectedRect.width + offset;
          break;
        case Direction.Bottom:
          top = selectedRect.height + offset;
          left = selectedRect.width / 2 - width / 2;
          transform = `rotate(90deg)`;
          break;
        case Direction.Left:
          top = selectedRect.height / 2 - width / 2 + 1;
          left = -width - offset;
          transform = `rotate(180deg)`;
          break;
        case Direction.Top:
          top = -width - offset;
          left = selectedRect.width / 2 - width / 2;
          transform = `rotate(-90deg)`;
      }
      return html`<div
        class="edgeless-auto-complete-arrow"
        style=${styleMap({
          top: top + 'px',
          left: left + 'px',
          transform,
        })}
        @mouseenter=${() => {
          this._timer = setTimeout(() => this._showNextShape(type), 300);
        }}
        @mouseleave=${() => {
          this._timer && clearTimeout(this._timer);
          this.edgeless.surface.viewport.removeOverlay(this._overlay);
        }}
        @pointerdown=${(e: PointerEvent) => {
          this._onPointerDown(e, type);
        }}
      >
        ${AutoCompleteArrowIcon}
      </div>`;
    });
    return html`<div
      class="edgeless-auto-complete-container"
      style=${styleMap({
        top: selectedRect.top + 'px',
        left: selectedRect.left + 'px',
        width: selectedRect.width + 'px',
        height: selectedRect.height + 'px',
        transform: `rotate(${selectedRect.rotate}deg)`,
      })}
    >
      ${Arrows}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-auto-complete': EdgelessAutoComplete;
  }
}
