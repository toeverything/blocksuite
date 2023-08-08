import { AutoCompleteArrowIcon } from '@blocksuite/global/config';
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
import { assertExists, DisposableGroup } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

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
  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas) {
    if (this.linePoints.length && this.shapePoints.length) {
      ctx.setLineDash([2, 2]);

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
  let startPoisition: Connection['position'] = [],
    endPosition: Connection['position'] = [];
  switch (type) {
    case Direction.Right:
      startPoisition = [1, 0.5];
      endPosition = [0, 0.5];
      break;
    case Direction.Bottom:
      startPoisition = [0.5, 1];
      endPosition = [0.5, 0];
      break;
    case Direction.Left:
      startPoisition = [0, 0.5];
      endPosition = [1, 0.5];
      break;
    case Direction.Top:
      startPoisition = [0.5, 0];
      endPosition = [0.5, 1];
      break;
  }
  return { startPoisition, endPosition };
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
  private _isMove = false;

  private _overlay = new AutoCompleteOverlay();
  private _timeId: NodeJS.Timeout | null = null;

  private get _selected() {
    return this.edgeless.selection.elements;
  }

  private get _current() {
    return this._selected[0] as ShapeElement;
  }

  private _onPointerDown = (e: PointerEvent, type: Direction) => {
    const { surface } = this.edgeless;
    const start = surface.viewport.toModelCoord(e.clientX, e.clientY);

    if (this.edgeless.dispatcher) {
      let connector: ConnectorElement | null;
      this._disposables.addFromEvent(document, 'pointermove', e => {
        const point = surface.viewport.toModelCoord(e.clientX, e.clientY);
        if (Vec.dist(start, point) > 8 && !this._isMove) {
          this._isMove = true;
          const { startPoisition } = getPosition(type);
          const id = surface.addElement('connector', {
            mode: ConnectorMode.Orthogonal,
            source: {
              id: this._current.id,
              position: startPoisition,
            },
            target: {
              position: point,
            },
            strokeWidth: 2,
          });
          connector = surface.pickById(id) as ConnectorElement;
        }
        if (this._isMove) {
          assertExists(connector);
          this.edgeless.connector.updateConnection(connector, point, 'target');
        }
      });
      this._disposables.addFromEvent(document, 'pointerup', e => {
        if (!this._isMove) {
          this._generateShapeOnClick(type);
        } else if (connector && !connector.target.id) {
          this._generateShapeOnDrag(type, connector);
        }
        this._isMove = false;
        this.edgeless.connector.clear();
        this._disposables.dispose();
        this._disposables = new DisposableGroup();
      });
    }
  };

  private _generateShapeOnClick(type: Direction) {
    const { surface } = this.edgeless;
    const bound = this._computeNextShape(type);
    const id = surface.addElement(
      this._current.type,
      this._current.serialize() as unknown as Record<string, unknown>
    );
    surface.updateElement(id, { xywh: bound.serialize() });

    const { startPoisition, endPosition } = getPosition(type);
    surface.addElement('connector', {
      mode: ConnectorMode.Orthogonal,
      source: {
        id: this._current.id,
        position: startPoisition,
      },
      target: {
        id,
        position: endPosition,
      },
      strokeWidth: 2,
      // stroke: color,
      //   strokeStyle: StrokeStyle.Solid,
    });
    this.edgeless.selection.setSelection({
      elements: [id],
      editing: false,
    });
  }

  private _generateShapeOnDrag(type: Direction, connector: ConnectorElement) {
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
    this.edgeless.selection.setSelection({
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
    const { startPoisition, endPosition } = getPosition(type);
    const nextShape = {
      xywh: nextBound.serialize(),
      rotate: curShape.rotate,
      shapeType: curShape.shapeType,
    };
    const startPoint = curShape.getRelativePointLocation(startPoisition);
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
        !this._isMove
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
          this._timeId = setTimeout(() => this._showNextShape(type), 300);
        }}
        @mouseleave=${() => {
          this._timeId && clearTimeout(this._timeId);
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
