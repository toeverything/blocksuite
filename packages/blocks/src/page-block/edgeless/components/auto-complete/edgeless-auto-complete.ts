import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  AutoCompleteArrowIcon,
  NoteAutoCompleteIcon,
} from '../../../../_common/icons/index.js';
import { getBlockClipboardInfo } from '../../../../_legacy/clipboard/index.js';
import type { NoteBlockModel } from '../../../../index.js';
import {
  Bound,
  type Connection,
  type ConnectorElement,
  ConnectorMode,
  GroupElement,
  type IVec,
  normalizeDegAngle,
  Overlay,
  PhasorElementType,
  rotatePoints,
  type RoughCanvas,
  ShapeElement,
  ShapeMethodsMap,
  toDegree,
  Vec,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getGridBound } from '../../utils/bound-utils.js';
import { mountShapeEditor } from '../../utils/text.js';
import type { SelectedRect } from '../rects/edgeless-selected-rect.js';

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
    return !elements.some(e => bound.isOverlapWithBound(getGridBound(e)));
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

const autoCompleteOverlay = new AutoCompleteOverlay();

@customElement('edgeless-auto-complete')
export class EdgelessAutoComplete extends WithDisposable(LitElement) {
  static override styles = css`
    .edgeless-auto-complete-container {
      position: absolute;
      z-index: 1;
      pointer-events: none;
    }
    .edgeless-auto-complete-arrow-wrapper {
      width: 72px;
      height: 44px;
      position: absolute;
      z-index: 1;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .edgeless-auto-complete-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 19px;
      cursor: pointer;
      pointer-events: auto;
      transition:
        background 0.3s linear,
        box-shadow 0.2s linear;
    }
    .edgeless-auto-complete-arrow-wrapper:hover
      > .edgeless-auto-complete-arrow {
      border: 1px solid var(--affine-border-color);
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-white);
    }

    .edgeless-auto-complete-arrow-wrapper
      > .edgeless-auto-complete-arrow:hover {
      border: 1px solid var(--affine-white-10);
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-primary-color);
    }

    .edgeless-auto-complete-arrow svg {
      fill: #77757d;
    }
    .edgeless-auto-complete-arrow:hover svg {
      fill: #ffffff;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  selectedRect!: SelectedRect;

  @property({ attribute: false })
  current!: ShapeElement | NoteBlockModel;

  @state()
  private _isMoving = false;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  private get _selected() {
    return this.edgeless.selectionManager.elements;
  }

  private get _surface() {
    return this.edgeless.surface;
  }

  override firstUpdated() {
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() => {
        autoCompleteOverlay.linePoints = [];
        autoCompleteOverlay.shapePoints = [];
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
        if (!this._isShape(this.current)) return;
        const { startPosition } = getPosition(type);
        connector = this._addConnector(
          {
            id: this.current.id,
            position: startPosition,
          },
          {
            position: point,
          }
        );
      }
      if (this._isMoving) {
        assertExists(connector);
        this._surface.connector.updateConnection(connector, point, 'target');
      }
    });

    this._disposables.addFromEvent(document, 'pointerup', async () => {
      if (!this._isMoving) {
        await this._generateElementOnClick(type);
      } else if (connector && !connector.target.id) {
        await this._generateShapeOnDrag(type, connector);
      }
      this._isMoving = false;
      this._surface.connector.clear();
      this._disposables.dispose();
      this._disposables = new DisposableGroup();
    });
  };

  private _addConnector(source: Connection, target: Connection) {
    const { surface } = this.edgeless;
    const id = surface.addElement(PhasorElementType.CONNECTOR, {
      mode: ConnectorMode.Orthogonal,
      strokeWidth: 2,
      stroke: (<ShapeElement>this.current).strokeColor,
      source,
      target,
    });
    return surface.pickById(id) as ConnectorElement;
  }

  private async _createEdgelessElement() {
    let id;
    const { surface } = this.edgeless;
    if (this._isShape(this.current)) {
      id = this.edgeless.surface.addElement(this.current.type, {
        ...this.current.serialize(),
        text: new Workspace.Y.Text(),
      });
    } else {
      const { page } = this.edgeless;
      id = page.addBlock(
        'affine:note',
        { background: this.current.background },
        this.edgeless.model.id
      );
      const noteService = this.edgeless.getService('affine:note');
      const note = page.getBlockById(id) as NoteBlockModel;
      assertExists(note);
      const serializedBlock = (await getBlockClipboardInfo(this.current)).json;
      await noteService.json2Block(note, serializedBlock.children);
    }
    const group = surface.pickById(surface.getGroup(this.current));
    if (group instanceof GroupElement) {
      group.addChild(id);
    }
    return id;
  }

  private async _generateElementOnClick(type: Direction) {
    const { surface, page } = this.edgeless;
    const bound = this._computeNextBound(type);
    const id = await this._createEdgelessElement();
    if (this._isShape(this.current)) {
      surface.updateElement(id, { xywh: bound.serialize() });
      const { startPosition, endPosition } = getPosition(type);
      this._addConnector(
        {
          id: this.current.id,
          position: startPosition,
        },
        {
          id,
          position: endPosition,
        }
      );

      mountShapeEditor(surface.pickById(id) as ShapeElement, this.edgeless);
    } else {
      const model = page.getBlockById(id);
      assertExists(model);
      page.updateBlock(model, { xywh: bound.serialize() });
    }

    this.edgeless.selectionManager.setSelection({
      elements: [id],
      editing: true,
    });
    this._removeOverlay();
  }

  private async _generateShapeOnDrag(
    _type: Direction,
    connector: ConnectorElement
  ) {
    const { surface } = this.edgeless;
    const bound = Bound.deserialize(this.current.xywh);
    const { w, h } = bound;
    const point = connector.target.position;
    assertExists(point);
    const len = connector.path.length;
    const angle = normalizeDegAngle(
      toDegree(Vec.angle(connector.path[len - 2], connector.path[len - 1]))
    );
    const id = await this._createEdgelessElement();
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
    surface.updateElement<PhasorElementType.CONNECTOR>(connector.id, {
      target: { id, position },
    });
    this.edgeless.selectionManager.setSelection({
      elements: [id],
      editing: false,
    });
    this.edgeless.page.captureSync();
  }

  private _showNextShape(type: Direction) {
    if (this._isShape(this.current)) {
      const { surface } = this.edgeless;
      surface.viewport.addOverlay(autoCompleteOverlay);
      const bound = this._computeNextBound(type);
      const path = this._computeLine(type, this.current, bound);

      autoCompleteOverlay.stroke = this._surface.getCSSPropertyValue(
        this.current.strokeColor
      );
      autoCompleteOverlay.linePoints = path;
      autoCompleteOverlay.shapePoints = rotatePoints(
        ShapeMethodsMap[this.current.shapeType].points(bound),
        bound.center,
        this.current.rotate
      );
      surface.refresh();
    }
  }

  private _computeNextBound(type: Direction) {
    if (this._isShape(this.current)) {
      const connectedShapes = this._surface.connector
        .getConnecttedElements(this.current)
        .filter(e => e instanceof ShapeElement) as ShapeElement[];
      return nextBound(type, this.current, connectedShapes);
    } else {
      const bound = getGridBound(this.current);
      switch (type) {
        case Direction.Right: {
          bound.x += bound.w + MAIN_GAP;
          break;
        }
        case Direction.Bottom: {
          bound.y += bound.h + MAIN_GAP;
          break;
        }
        case Direction.Left: {
          bound.x -= bound.w + MAIN_GAP;
          break;
        }
        case Direction.Top: {
          bound.y -= bound.h + MAIN_GAP;
          break;
        }
      }
      return bound;
    }
  }

  private _isShape(element: typeof this.current): element is ShapeElement {
    return element instanceof ShapeElement;
  }

  private _computeLine(
    type: Direction,
    curShape: ShapeElement,
    nextBound: Bound
  ) {
    const startBound = getGridBound(this.current);
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

    return this._surface.connector.generateOrthogonalConnectorPath({
      startBound,
      endBound: nextBound,
      startPoint,
      endPoint,
    });
  }

  private _removeOverlay() {
    this._timer && clearTimeout(this._timer);
    this.edgeless.surface.viewport.removeOverlay(autoCompleteOverlay);
  }

  override render() {
    if (this._isMoving) {
      this._removeOverlay();
      return nothing;
    }
    const { selectedRect } = this;
    const isShape = this._selected[0] instanceof ShapeElement;
    const width = 72;
    const height = 44;
    const Arrows = [
      Direction.Right,
      Direction.Bottom,
      Direction.Left,
      Direction.Top,
    ].map(type => {
      let transform = '';

      switch (type) {
        case Direction.Top:
          transform += `translate(${selectedRect.width / 2}px, ${
            -height / 2
          }px)`;
          break;
        case Direction.Right:
          transform += `translate(${selectedRect.width + height / 2}px, ${
            selectedRect.height / 2
          }px)`;

          isShape && (transform += `rotate(90deg)`);
          break;
        case Direction.Bottom:
          transform += `translate(${selectedRect.width / 2}px, ${
            selectedRect.height + height / 2
          }px)`;
          isShape && (transform += `rotate(180deg)`);
          break;
        case Direction.Left:
          transform += `translate(${-height / 2}px, ${
            selectedRect.height / 2
          }px)`;
          isShape && (transform += `rotate(-90deg)`);
          break;
      }
      transform += `translate(${-width / 2}px, ${-height / 2}px)`;
      return html`<div
        class="edgeless-auto-complete-arrow-wrapper"
        style=${styleMap({
          transform,
          transformOrigin: 'left top',
        })}
      >
        <div
          class="edgeless-auto-complete-arrow"
          @mouseenter=${() => {
            this._timer = setTimeout(() => this._showNextShape(type), 300);
          }}
          @mouseleave=${() => {
            this._removeOverlay();
          }}
          @pointerdown=${(e: PointerEvent) => {
            this._onPointerDown(e, type);
          }}
        >
          ${isShape ? AutoCompleteArrowIcon : NoteAutoCompleteIcon}
        </div>
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
