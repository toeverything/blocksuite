import { AutoCompleteArrowIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type {
  ConnectorElement,
  RoughCanvas} from '@blocksuite/phasor';
import {
  Bound,
  type Connection,
  ConnectorMode,
  type IVec,
  Overlay,
  PointLocation,
  ShapeElement,
  Vec,
} from '@blocksuite/phasor';
import { assertExists,DisposableGroup } from '@blocksuite/store/index.js';
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

function nextBound(type: Direction, bound: Bound, elements: ShapeElement[]) {
  const { x, y, w, h } = bound;
  let nextBound: Bound;
  switch (type) {
    case Direction.Right:
      nextBound = new Bound(x + w + MAIN_GAP, y, w, h);
      break;
    case Direction.Bottom:
      nextBound = new Bound(x, y + h + MAIN_GAP, w, h);
      break;
    case Direction.Left:
      nextBound = new Bound(x - w - MAIN_GAP, y, w, h);
      break;
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
  }
  return { startPoisition, endPosition };
}

@customElement('edgeless-auto-complete')
export class EdgelessAutoComplete extends WithDisposable(LitElement) {
  static override styles = css`
    .edgeless-auto-complete-arrow {
      width: 16px;
      height: 16px;
      position: absolute;
      z-index: 1;
      opacity: 0.6;
      cursor: pointer;
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

  private _showNextShape(type: Direction) {
    const { surface } = this.edgeless;
    surface.viewport.addOverlay(this._overlay);
    const bound = this._computeNextShape(type);
    const path = this._computeLine(type, bound);
    this._overlay.linePoints = path;
    this._overlay.shapePoints = bound.points;
    surface.refresh();
  }

  private _computeNextShape(type: Direction) {
    const connectedShapes = this.edgeless.connector
      .getConnecttedElements(this._current)
      .filter(e => e instanceof ShapeElement) as ShapeElement[];
    const bound = (<ShapeElement>this._current).gridBound;
    return nextBound(type, bound, connectedShapes);
  }

  private _computeLine(type: Direction, nextBound: Bound) {
    let startPoint: PointLocation, endPoint: PointLocation;
    const startBound = getGridBound(this._current);
    switch (type) {
      case Direction.Right:
        startPoint = new PointLocation([
          startBound.x + startBound.w,
          startBound.y + startBound.h / 2,
        ]);
        endPoint = new PointLocation([
          nextBound.x,
          nextBound.y + nextBound.h / 2,
        ]);
        break;
      case Direction.Bottom:
        startPoint = new PointLocation([
          startBound.x + startBound.w / 2,
          startBound.y + startBound.h,
        ]);
        endPoint = new PointLocation([
          nextBound.x + nextBound.w / 2,
          nextBound.y,
        ]);
        break;
      case Direction.Left:
        startPoint = new PointLocation([
          startBound.x,
          startBound.y + startBound.h / 2,
        ]);
        endPoint = new PointLocation([
          nextBound.x + nextBound.w,
          nextBound.y + nextBound.h / 2,
        ]);
    }

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
    const Arrows = [Direction.Right, Direction.Bottom, Direction.Left].map(
      (type, index) => {
        let top = 0,
          left = 0,
          transform = '';
        const width = 16;
        const offset = 4;
        switch (type) {
          case Direction.Right:
            top =
              this.selectedRect.top + this.selectedRect.height / 2 - width / 2;
            left = this.selectedRect.left + this.selectedRect.width + offset;
            break;
          case Direction.Bottom:
            top = this.selectedRect.top + this.selectedRect.height + offset;
            left =
              this.selectedRect.left + this.selectedRect.width / 2 - width / 2;
            transform = `rotate(90deg)`;
            break;
          case Direction.Left:
            top =
              this.selectedRect.top +
              this.selectedRect.height / 2 -
              width / 2 +
              1;
            left = this.selectedRect.left - width - offset;
            transform = `rotate(180deg)`;
            break;
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
      }
    );
    return html`${Arrows}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-auto-complete': EdgelessAutoComplete;
  }
}
