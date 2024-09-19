import type {
  Connection,
  ConnectorElementModel,
  NoteBlockModel,
  ShapeType,
} from '@blocksuite/affine-model';
import type { Bound, IVec } from '@blocksuite/global/utils';

import {
  CanvasElementType,
  Overlay,
  type RoughCanvas,
} from '@blocksuite/affine-block-surface';
import { ConnectorPathGenerator } from '@blocksuite/affine-block-surface';
import {
  AutoCompleteArrowIcon,
  MindMapChildIcon,
  MindMapSiblingIcon,
  NoteAutoCompleteIcon,
} from '@blocksuite/affine-components/icons';
import {
  DEFAULT_SHAPE_STROKE_COLOR,
  LayoutType,
  MindmapElementModel,
  ShapeElementModel,
  shapeMethods,
} from '@blocksuite/affine-model';
import { handleNativeRangeAtPoint } from '@blocksuite/affine-shared/utils';
import {
  assertExists,
  DisposableGroup,
  Vec,
  WithDisposable,
} from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import type { SelectedRect } from '../rects/edgeless-selected-rect.js';

import { NOTE_INIT_HEIGHT } from '../../utils/consts.js';
import { isNoteBlock } from '../../utils/query.js';
import { mountShapeTextEditor } from '../../utils/text.js';
import { EdgelessAutoCompletePanel } from './auto-complete-panel.js';
import {
  createEdgelessElement,
  Direction,
  getPosition,
  isShape,
  MAIN_GAP,
  nextBound,
} from './utils.js';

class AutoCompleteOverlay extends Overlay {
  linePoints: IVec[] = [];

  renderShape: ((ctx: CanvasRenderingContext2D) => void) | null = null;

  stroke = '';

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas) {
    if (this.linePoints.length && this.renderShape) {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = this.stroke;
      ctx.beginPath();
      this.linePoints.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.stroke();

      this.renderShape(ctx);
      ctx.stroke();
    }
  }
}

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
    .edgeless-auto-complete-arrow-wrapper.hidden {
      display: none;
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

    .edgeless-auto-complete-arrow-wrapper.mindmap
      > .edgeless-auto-complete-arrow {
      border: 1px solid var(--affine-border-color);
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-white);

      transition:
        background 0.3s linear,
        color 0.2s linear;
    }

    .edgeless-auto-complete-arrow-wrapper.mindmap
      > .edgeless-auto-complete-arrow:hover {
      border: 1px solid var(--affine-white-10);
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-primary-color);
    }

    .edgeless-auto-complete-arrow svg {
      fill: #77757d;
      color: #77757d;
    }
    .edgeless-auto-complete-arrow:hover svg {
      fill: #ffffff;
      color: #ffffff;
    }
  `;

  private _autoCompleteOverlay: AutoCompleteOverlay = new AutoCompleteOverlay();

  private _onPointerDown = (e: PointerEvent, type: Direction) => {
    const { service } = this.edgeless;
    const viewportRect = service.viewport.boundingClientRect;
    const start = service.viewport.toModelCoord(
      e.clientX - viewportRect.left,
      e.clientY - viewportRect.top
    );

    if (!this.edgeless.dispatcher) return;

    let connector: ConnectorElementModel | null;

    this._disposables.addFromEvent(document, 'pointermove', e => {
      const point = service.viewport.toModelCoord(
        e.clientX - viewportRect.left,
        e.clientY - viewportRect.top
      );
      if (Vec.dist(start, point) > 8 && !this._isMoving) {
        if (!this.canShowAutoComplete) return;
        this._isMoving = true;
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
        const otherSideId = connector.source.id;

        connector.target =
          this.edgeless.service.connectorOverlay.renderConnector(
            point,
            otherSideId ? [otherSideId] : []
          );
      }
    });

    this._disposables.addFromEvent(document, 'pointerup', e => {
      if (!this._isMoving) {
        this._generateElementOnClick(type);
      } else if (connector && !connector.target.id) {
        this.edgeless.service.selection.clear();
        this._createAutoCompletePanel(e, connector);
      }

      this._isMoving = false;
      this.edgeless.service.connectorOverlay.clear();
      this._disposables.dispose();
      this._disposables = new DisposableGroup();
    });
  };

  private _pathGenerator!: ConnectorPathGenerator;

  private _timer: ReturnType<typeof setTimeout> | null = null;

  get canShowAutoComplete() {
    const { current } = this;
    return isShape(current) || isNoteBlock(current);
  }

  private _addConnector(source: Connection, target: Connection) {
    const { edgeless } = this;
    const id = edgeless.service.addElement(CanvasElementType.CONNECTOR, {
      source,
      target,
    });
    return edgeless.service.getElementById(id) as ConnectorElementModel;
  }

  private _addMindmapNode(target: 'sibling' | 'child') {
    const mindmap = this.current.group;

    if (!(mindmap instanceof MindmapElementModel)) return;

    const parentNode =
      target === 'sibling'
        ? (mindmap.getParentNode(this.current.id) ?? this.current)
        : this.current;

    const newNode = mindmap.addNode(
      parentNode.id,
      target === 'sibling' ? this.current.id : undefined,
      undefined,
      undefined
    );

    requestAnimationFrame(() => {
      mountShapeTextEditor(
        this.edgeless.service.getElementById(newNode) as ShapeElementModel,
        this.edgeless
      );
    });
  }

  private _computeLine(
    type: Direction,
    curShape: ShapeElementModel,
    nextBound: Bound
  ) {
    const startBound = this.current.elementBound;
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

    return this._pathGenerator.generateOrthogonalConnectorPath({
      startBound,
      endBound: nextBound,
      startPoint,
      endPoint,
    });
  }

  private _computeNextBound(type: Direction) {
    if (isShape(this.current)) {
      const connectedShapes = this._getConnectedElements(this.current).filter(
        e => e instanceof ShapeElementModel
      ) as ShapeElementModel[];
      return nextBound(type, this.current, connectedShapes);
    } else {
      const bound = this.current.elementBound;
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

  private _createAutoCompletePanel(
    e: PointerEvent,
    connector: ConnectorElementModel
  ) {
    if (!this.canShowAutoComplete) return;

    const position = this.edgeless.service.viewport.toModelCoord(
      e.clientX,
      e.clientY
    );
    const autoCompletePanel = new EdgelessAutoCompletePanel(
      position,
      this.edgeless,
      this.current,
      connector
    );

    this.edgeless.append(autoCompletePanel);
  }

  private _generateElementOnClick(type: Direction) {
    const { doc, service } = this.edgeless;
    const bound = this._computeNextBound(type);
    const id = createEdgelessElement(this.edgeless, this.current, bound);
    if (isShape(this.current)) {
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

      mountShapeTextEditor(
        service.getElementById(id) as ShapeElementModel,
        this.edgeless
      );
    } else {
      const model = doc.getBlockById(id);
      assertExists(model);
      const [x, y] = service.viewport.toViewCoord(
        bound.center[0],
        bound.y + NOTE_INIT_HEIGHT / 2
      );
      requestAnimationFrame(() => {
        handleNativeRangeAtPoint(x, y);
      });
    }

    this.edgeless.service.selection.set({
      elements: [id],
      editing: true,
    });
    this.removeOverlay();
  }

  private _getConnectedElements(element: ShapeElementModel) {
    const service = this.edgeless.service;

    return service.getConnectors(element.id).reduce((prev, current) => {
      if (current.target.id === element.id && current.source.id) {
        prev.push(
          service.getElementById(current.source.id) as ShapeElementModel
        );
      }
      if (current.source.id === element.id && current.target.id) {
        prev.push(
          service.getElementById(current.target.id) as ShapeElementModel
        );
      }

      return prev;
    }, [] as ShapeElementModel[]);
  }

  private _getMindmapButtons():
    | [Direction, 'child' | 'sibling', LayoutType.LEFT | LayoutType.RIGHT][]
    | null {
    const mindmap = this.current.group as MindmapElementModel;
    const mindmapDirection =
      this.current instanceof ShapeElementModel &&
      mindmap instanceof MindmapElementModel
        ? mindmap.getLayoutDir(this.current.id)
        : null;
    const isRoot = mindmap?.tree.id === this.current.id;

    let result: ReturnType<typeof this._getMindmapButtons> = null;

    switch (mindmapDirection) {
      case LayoutType.LEFT:
        result = [[Direction.Left, 'child', LayoutType.LEFT]];

        if (!isRoot) {
          result.push([Direction.Bottom, 'sibling', mindmapDirection]);
        }
        return result;
      case LayoutType.RIGHT:
        result = [[Direction.Right, 'child', LayoutType.RIGHT]];

        if (!isRoot) {
          result.push([Direction.Bottom, 'sibling', mindmapDirection]);
        }
        return result;
      case LayoutType.BALANCE:
        result = [
          [Direction.Right, 'child', LayoutType.RIGHT],
          [Direction.Left, 'child', LayoutType.LEFT],
        ];
        return result;
      default:
        result = null;
    }

    return result;
  }

  private _renderArrow() {
    const isShape = this.current instanceof ShapeElementModel;
    const { selectedRect } = this;
    const { zoom } = this.edgeless.service.viewport;
    const width = 72;
    const height = 44;

    // Auto-complete arrows for shape and note are different
    // Shape: right, bottom, left, top
    // Note: right, left
    const arrowDirections = isShape
      ? [Direction.Right, Direction.Bottom, Direction.Left, Direction.Top]
      : [Direction.Right, Direction.Left];
    const arrowMargin = isShape ? height / 2 : height * (2 / 3);
    const Arrows = arrowDirections.map(type => {
      let transform = '';

      const icon = isShape ? AutoCompleteArrowIcon : NoteAutoCompleteIcon;

      switch (type) {
        case Direction.Top:
          transform += `translate(${
            selectedRect.width / 2
          }px, ${-arrowMargin}px)`;
          break;
        case Direction.Right:
          transform += `translate(${selectedRect.width + arrowMargin}px, ${
            selectedRect.height / 2
          }px)`;

          isShape && (transform += `rotate(90deg)`);
          break;
        case Direction.Bottom:
          transform += `translate(${selectedRect.width / 2}px, ${
            selectedRect.height + arrowMargin
          }px)`;
          isShape && (transform += `rotate(180deg)`);
          break;
        case Direction.Left:
          transform += `translate(${-arrowMargin}px, ${
            selectedRect.height / 2
          }px)`;
          isShape && (transform += `rotate(-90deg)`);
          break;
      }
      transform += `translate(${-width / 2}px, ${-height / 2}px)`;
      const arrowWrapperClasses = classMap({
        'edgeless-auto-complete-arrow-wrapper': true,
        hidden: !isShape && type === Direction.Left && zoom >= 1.5,
      });

      return html`<div
        class=${arrowWrapperClasses}
        style=${styleMap({
          transform,
          transformOrigin: 'left top',
        })}
      >
        <div
          class="edgeless-auto-complete-arrow"
          @mouseenter=${() => {
            this._timer = setTimeout(() => {
              if (this.current instanceof ShapeElementModel) {
                const bound = this._computeNextBound(type);
                const path = this._computeLine(type, this.current, bound);
                this._showNextShape(
                  this.current,
                  bound,
                  path,
                  this.current.shapeType
                );
              }
            }, 300);
          }}
          @mouseleave=${() => {
            this.removeOverlay();
          }}
          @pointerdown=${(e: PointerEvent) => {
            this._onPointerDown(e, type);
          }}
        >
          ${icon}
        </div>
      </div>`;
    });

    return Arrows;
  }

  private _renderMindMapButtons() {
    const mindmapButtons = this._getMindmapButtons();

    if (!mindmapButtons) {
      return;
    }

    const { selectedRect } = this;
    const { zoom } = this.edgeless.service.viewport;
    const width = 72;
    const height = 44;
    const buttonMargin = height / 2;

    return mindmapButtons.map(type => {
      let transform = '';

      const [position, target, layout] = type;
      const isLeftLayout = layout === LayoutType.LEFT;
      const icon = target === 'child' ? MindMapChildIcon : MindMapSiblingIcon;

      switch (position) {
        case Direction.Bottom:
          transform += `translate(${selectedRect.width / 2}px, ${
            selectedRect.height + buttonMargin
          }px)`;
          isLeftLayout && (transform += `scale(-1)`);
          break;
        case Direction.Right:
          transform += `translate(${selectedRect.width + buttonMargin}px, ${
            selectedRect.height / 2
          }px)`;
          break;
        case Direction.Left:
          transform += `translate(${-buttonMargin}px, ${
            selectedRect.height / 2
          }px)`;

          transform += `scale(-1)`;
          break;
      }

      transform += `translate(${-width / 2}px, ${-height / 2}px)`;

      const arrowWrapperClasses = classMap({
        'edgeless-auto-complete-arrow-wrapper': true,
        hidden: position === Direction.Left && zoom >= 1.5,
        mindmap: true,
      });

      return html`<div
        class=${arrowWrapperClasses}
        style=${styleMap({
          transform,
          transformOrigin: 'left top',
        })}
      >
        <div
          class="edgeless-auto-complete-arrow"
          @pointerdown=${() => {
            this._addMindmapNode(target);
          }}
        >
          ${icon}
        </div>
      </div>`;
    });
  }

  private _showNextShape(
    current: ShapeElementModel,
    bound: Bound,
    path: IVec[],
    targetType: ShapeType
  ) {
    const { surface } = this.edgeless;
    surface.renderer.addOverlay(this._autoCompleteOverlay);

    this._autoCompleteOverlay.stroke = surface.renderer.getColorValue(
      current.strokeColor,
      DEFAULT_SHAPE_STROKE_COLOR,
      true
    );
    this._autoCompleteOverlay.linePoints = path;
    this._autoCompleteOverlay.renderShape = ctx => {
      shapeMethods[targetType].draw(ctx, { ...bound, rotate: current.rotate });
    };
    surface.refresh();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._pathGenerator = new ConnectorPathGenerator({
      getElementById: id => this.edgeless.service.getElementById(id),
    });
  }

  override firstUpdated() {
    const { _disposables, edgeless } = this;

    _disposables.add(
      this.edgeless.service.selection.slots.updated.on(() => {
        this._autoCompleteOverlay.linePoints = [];
        this._autoCompleteOverlay.renderShape = null;
      })
    );

    _disposables.add(() => this.removeOverlay());

    _disposables.add(
      edgeless.host.event.add('pointerMove', () => {
        const state = edgeless.tools.getHoverState();

        if (!state) {
          this._isHover = false;
          return;
        }

        this._isHover = state.content === this.current ? true : false;
      })
    );

    this.edgeless.handleEvent('dragStart', () => {
      this._isMoving = true;
    });
    this.edgeless.handleEvent('dragEnd', () => {
      this._isMoving = false;
    });
  }

  removeOverlay() {
    this._timer && clearTimeout(this._timer);
    this.edgeless.surface.renderer.removeOverlay(this._autoCompleteOverlay);
  }

  override render() {
    const isShape = this.current instanceof ShapeElementModel;
    const isMindMap = this.current.group instanceof MindmapElementModel;

    if (this._isMoving || (this._isHover && !isShape)) {
      this.removeOverlay();
      return nothing;
    }
    const { selectedRect } = this;

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
      ${isMindMap ? this._renderMindMapButtons() : this._renderArrow()}
    </div>`;
  }

  @state()
  private accessor _isHover = true;

  @state()
  private accessor _isMoving = false;

  @property({ attribute: false })
  accessor current!: ShapeElementModel | NoteBlockModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor selectedRect!: SelectedRect;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-auto-complete': EdgelessAutoComplete;
  }
}
