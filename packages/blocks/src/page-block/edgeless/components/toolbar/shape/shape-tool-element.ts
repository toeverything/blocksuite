import { sleep } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import {
  css,
  html,
  LitElement,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../_common/utils/index.js';
import {
  Bound,
  CanvasElementType,
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
} from '../../../../../surface-block/index.js';
import { ShapeToolController } from '../../../controllers/tools/shape-tool.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../../component-toolbar/change-shape-button.js';

export type ShapeName = ShapeType | 'roundedRect';

export interface Shape {
  name: ShapeName;
  svg: TemplateResult<1>;
}

interface Coord {
  x: number;
  y: number;
}

interface TransformMap {
  [key: string]: {
    x: number;
    y: number;
    scale: number;
    origin: string;
  };
}

@customElement('edgeless-shape-tool-element')
export class EdgelessShapeToolElement extends WithDisposable(LitElement) {
  static override styles = css`
    .shape {
      --x: 0px;
      --y: 0px;
      --offset-x: 0px;
      --offset-y: 0px;
      --scale: 1;
      transform: translateX(calc(var(--offset-x) + var(--x)))
        translateY(calc(var(--y) + var(--offset-y))) scale(var(--scale));
      height: 60px;
      width: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 12px;
      left: 16px;
      transition: all 0.5s cubic-bezier(0, -0.01, 0.01, 1.01);
    }
    .shape.dragging {
      transition: none;
    }
    .shape svg {
      height: 100%;
      filter: drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.15));
    }
  `;

  @property({ attribute: false })
  shape!: Shape;

  @property({ attribute: false })
  order!: number;

  @property({ attribute: false })
  getContainerRect!: () => DOMRect;

  @property({ attribute: false })
  handleClick!: () => void;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @query('#shape-tool-element')
  private _shapeElement!: HTMLElement;

  @query('#backup-shape-element')
  private _backupShapeElement!: HTMLElement;

  private _transformMap: TransformMap = {
    z1: { x: 0, y: 5, scale: 1.1, origin: '50% 100%' },
    z2: { x: -15, y: 0, scale: 0.75, origin: '20% 20%' },
    z3: { x: 15, y: 0, scale: 0.75, origin: '80% 20%' },
    hidden: { x: 0, y: 120, scale: 0, origin: '50% 50%' },
  };

  @state()
  private _startCoord: Coord = { x: -1, y: -1 };

  @state()
  private _dragging: boolean = false;

  @state()
  private _isOutside: boolean = false;

  private _onDragStart = (coord: Coord) => {
    this._startCoord = { x: coord.x, y: coord.y };
    if (this.order !== 1) {
      return;
    }
    this._dragging = true;
    this._shapeElement.classList.add('dragging');
  };

  private _onDragMove = (coord: Coord) => {
    if (!this._dragging) {
      return;
    }
    const controller = this.edgeless.tools.currentController;
    if (controller instanceof ShapeToolController) {
      controller.clearOverlay();
    }
    const { x, y } = coord;
    this._shapeElement.style.setProperty(
      '--offset-x',
      `${x - this._startCoord.x}px`
    );
    this._shapeElement.style.setProperty(
      '--offset-y',
      `${y - this._startCoord.y}px`
    );
    const containerRect = this.getContainerRect();
    const isOut =
      y < containerRect.top ||
      x < containerRect.left ||
      x > containerRect.right;
    if (isOut !== this._isOutside) {
      this._backupShapeElement.style.setProperty(
        '--y',
        isOut ? '5px' : '100px'
      );
      this._backupShapeElement.style.setProperty(
        '--scale',
        isOut ? '1' : '0.9'
      );
    }
    this._isOutside = isOut;
  };

  private _onDragEnd = async (coord: Coord) => {
    if (this._startCoord.x === coord.x && this._startCoord.y === coord.y) {
      this.handleClick();
      this._dragging = false;
      return;
    }
    if (!this._dragging) {
      return;
    }
    this._dragging = false;
    this.setEdgelessTool({ type: 'default' });
    if (this._isOutside) {
      const rect = this._shapeElement.getBoundingClientRect();
      this._backupShapeElement.style.setProperty('transition', 'none');
      this._backupShapeElement.style.setProperty('--y', '100px');
      this._shapeElement.style.setProperty('--offset-x', `${0}px`);
      this._shapeElement.style.setProperty('--offset-y', `${0}px`);
      await sleep(0);
      this._shapeElement.classList.remove('dragging');
      this._backupShapeElement.style.removeProperty('transition');
      const padding = {
        x: (coord.x - rect.left) / rect.width,
        y: (coord.y - rect.top) / rect.height,
      };
      this._addShape(coord, padding);
    } else {
      this._shapeElement.classList.remove('dragging');
      this._shapeElement.style.setProperty('--offset-x', `${0}px`);
      this._shapeElement.style.setProperty('--offset-y', `${0}px`);
      this._backupShapeElement.style.setProperty('--y', '100px');
    }
  };

  private _onMouseMove = (event: MouseEvent) => {
    if (!this._dragging) {
      return;
    }
    this._onDragMove({ x: event.clientX, y: event.clientY });
  };

  private _touchMove = (event: TouchEvent) => {
    if (!this._dragging) {
      return;
    }
    this._onDragMove({
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    });
  };

  private _onMouseUp = (event: MouseEvent) => {
    this._onDragEnd({ x: event.clientX, y: event.clientY });
  };

  private _onTouchEnd = (event: TouchEvent) => {
    this._onDragEnd({
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    });
  };

  @state()
  private _fillColor: string = DEFAULT_SHAPE_FILL_COLOR;

  @state()
  private _strokeColor: string = DEFAULT_SHAPE_STROKE_COLOR;

  @state()
  private _shapeStyle: ShapeStyle = ShapeStyle.General;

  private _addShape = (coord: Coord, padding: Coord) => {
    const width = 100;
    const height = 100;
    const { x: edgelessX, y: edgelessY } =
      this.edgeless.getBoundingClientRect();
    const zoom = this.edgeless.surface.viewport.zoom;
    const [modelX, modelY] = this.edgeless.surface.viewport.toModelCoord(
      coord.x - edgelessX - width * padding.x * zoom,
      coord.y - edgelessY - height * padding.y * zoom
    );
    const xywh = new Bound(modelX, modelY, width, height).serialize();
    this.edgeless.surface.addElement(CanvasElementType.SHAPE, {
      shapeType: this.shape.name === 'roundedRect' ? 'rect' : this.shape.name,
      xywh: xywh,
      strokeColor: this._strokeColor,
      fillColor: this._fillColor,
      filled: true,
      radius: this.shape.name === 'roundedRect' ? 0.1 : 0,
      strokeWidth: 4,
      strokeStyle: StrokeStyle.Solid,
      shapeStyle: this._shapeStyle,
    });
  };

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(window, 'mousemove', this._onMouseMove);
    this._disposables.addFromEvent(window, 'touchmove', this._touchMove);
    this._disposables.addFromEvent(window, 'mouseup', this._onMouseUp);
    this._disposables.addFromEvent(window, 'touchend', this._onTouchEnd);
  }

  override firstUpdated() {
    const key = 'blocksuite:' + this.edgeless.page.id + ':edgelessShape';
    const shapeData = sessionStorage.getItem(key);
    if (shapeData) {
      const shapeToolState = JSON.parse(shapeData);
      this._fillColor = shapeToolState.fillColor;
      this._strokeColor = shapeToolState.strokeColor;
      this._shapeStyle = shapeToolState.shapeStyle;
    }
  }

  override updated(changedProperties: PropertyValues<this>) {
    if (!changedProperties.has('shape') && !changedProperties.has('order')) {
      return;
    }
    const transform =
      this._transformMap[this.order <= 3 ? `z${this.order}` : 'hidden'];
    this._shapeElement.style.setProperty('--x', `${transform.x}px`);
    this._shapeElement.style.setProperty('--y', `${transform.y}px`);
    this._shapeElement.style.setProperty(
      '--scale',
      String(transform.scale || 1)
    );
    this._shapeElement.style.zIndex = String(999 - this.order);
    this._shapeElement.style.transformOrigin = transform.origin;

    if (this._backupShapeElement) {
      this._backupShapeElement.style.setProperty('--y', '100px');
      this._backupShapeElement.style.setProperty('--scale', '0.9');
      this._backupShapeElement.style.zIndex = '999';
    }

    this.edgeless.slots.edgelessToolUpdated.on(newTool => {
      if (newTool.type !== 'shape') {
        return;
      }
      this._fillColor = newTool.fillColor;
      this._strokeColor = newTool.strokeColor;
      this._shapeStyle = newTool.shapeStyle;
    });
  }

  override render() {
    return html`
      <div
        id="shape-tool-element"
        class="shape"
        @mousedown=${(event: MouseEvent) =>
          this._onDragStart({ x: event.clientX, y: event.clientY })}
        @touchstart=${(event: TouchEvent) => {
          event.preventDefault();
          this._onDragStart({
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          });
        }}
      >
        ${this.shape.svg}
      </div>
      ${this.order === 1
        ? html`<div id="backup-shape-element" class="shape">
            ${this.shape.svg}
          </div>`
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-element': EdgelessShapeToolElement;
  }
}
