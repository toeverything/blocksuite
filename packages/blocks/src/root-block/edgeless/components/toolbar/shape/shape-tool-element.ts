import { WithDisposable } from '@blocksuite/block-std';
import { sleep } from '@blocksuite/global/utils';
import {
  css,
  html,
  LitElement,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { ShapeType } from '../../../../../surface-block/elements/shape/consts.js';
import type { ShapeStyle } from '../../../../../surface-block/index.js';
import {
  Bound,
  CanvasElementType,
} from '../../../../../surface-block/index.js';
import { ShapeToolController } from '../../../controllers/tools/shape-tool.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';

export type ShapeName = ShapeType | 'roundedRect';

export interface Shape {
  name: ShapeName;
  svg: TemplateResult<1>;
}

interface Coord {
  x: number;
  y: number;
}

type TransformMap = Record<
  string,
  {
    x: number;
    y: number;
    scale: number;
    origin: string;
  }
>;

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

  @query('#shape-tool-element')
  private accessor _shapeElement!: HTMLElement;

  @query('#backup-shape-element')
  private accessor _backupShapeElement!: HTMLElement;

  private _transformMap: TransformMap = {
    z1: { x: 0, y: 5, scale: 1.1, origin: '50% 100%' },
    z2: { x: -15, y: 0, scale: 0.75, origin: '20% 20%' },
    z3: { x: 15, y: 0, scale: 0.75, origin: '80% 20%' },
    hidden: { x: 0, y: 120, scale: 0, origin: '50% 50%' },
  };

  @state()
  private accessor _startCoord: Coord = { x: -1, y: -1 };

  @state()
  private accessor _dragging: boolean = false;

  @state()
  private accessor _isOutside: boolean = false;

  @property({ attribute: false })
  accessor shape!: Shape;

  @property({ attribute: false })
  accessor order!: number;

  @property({ attribute: false })
  accessor getContainerRect!: () => DOMRect;

  @property({ attribute: false })
  accessor handleClick!: () => void;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor shapeType!: ShapeName;

  @property({ attribute: false })
  accessor shapeStyle!: ShapeStyle;

  @property({ attribute: false })
  accessor radius!: number;

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
    this.edgeless.tools.setEdgelessTool({ type: 'default' });
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
    this._onDragEnd({ x: event.clientX, y: event.clientY }).catch(
      console.error
    );
  };

  private _onTouchEnd = (event: TouchEvent) => {
    this._onDragEnd({
      // https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent#touchend
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    }).catch(console.error);
  };

  private _addShape = (coord: Coord, padding: Coord) => {
    const width = 100;
    const height = 100;
    const { x: edgelessX, y: edgelessY } =
      this.edgeless.getBoundingClientRect();
    const zoom = this.edgeless.service.viewport.zoom;
    const [modelX, modelY] = this.edgeless.service.viewport.toModelCoord(
      coord.x - edgelessX - width * padding.x * zoom,
      coord.y - edgelessY - height * padding.y * zoom
    );
    const xywh = new Bound(modelX, modelY, width, height).serialize();
    this.edgeless.service.addElement(CanvasElementType.SHAPE, {
      shapeType: this.shape.name === 'roundedRect' ? 'rect' : this.shape.name,
      xywh: xywh,
      radius: this.radius,
    });
  };

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(
      this.edgeless.host,
      'mousemove',
      this._onMouseMove
    );
    this._disposables.addFromEvent(
      this.edgeless.host,
      'touchmove',
      this._touchMove
    );
    this._disposables.addFromEvent(
      this.edgeless.host,
      'mouseup',
      this._onMouseUp
    );
    this._disposables.addFromEvent(
      this.edgeless.host,
      'touchend',
      this._onTouchEnd
    );
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
