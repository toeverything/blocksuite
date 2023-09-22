import { sleep } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  Bound,
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
} from '../../../../../index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

interface Shape {
  name: ShapeType | 'roundedRect';
  svg: SVGElement;
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

@customElement('edgeless-shape-element')
export class EdgelessShapeElement extends WithDisposable(LitElement) {
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

  @query('#shape-element')
  private shapeElement!: HTMLElement;

  @query('#backup-shape-element')
  private backupShapeElement!: HTMLElement;

  private transformMap: TransformMap = {
    z1: { x: 0, y: 5, scale: 1, origin: '50% 100%' },
    z2: { x: -15, y: -7, scale: 0.75, origin: '20% 20%' },
    z3: { x: 15, y: -7, scale: 0.75, origin: '80% 20%' },
    hidden: { x: 0, y: 120, scale: 0, origin: '50% 50%' },
  };

  @state()
  private startCoord: Coord = { x: 0, y: 0 };

  @state()
  private dragging: boolean = false;

  @state()
  private isOutside: boolean = false;

  private onDragStart = (coord: Coord) => {
    this.startCoord = { x: coord.x, y: coord.y };
    if (this.order !== 1) {
      return;
    }
    this.dragging = true;
    this.shapeElement.classList.add('dragging');
  };

  private onDragMove = (coord: Coord) => {
    if (!this.dragging) {
      return;
    }
    const { x, y } = coord;
    this.shapeElement.style.setProperty(
      '--offset-x',
      `${x - this.startCoord.x}px`
    );
    this.shapeElement.style.setProperty(
      '--offset-y',
      `${y - this.startCoord.y}px`
    );
    const containerRect = this.getContainerRect();
    const isOut =
      y < containerRect.top ||
      x < containerRect.left ||
      x > containerRect.right;
    if (isOut !== this.isOutside) {
      this.backupShapeElement.style.setProperty('--y', isOut ? '5px' : '100px');
      this.backupShapeElement.style.setProperty('--scale', isOut ? '1' : '0.9');
    }
    this.isOutside = isOut;
  };

  private onDragEnd = async (coord: Coord) => {
    if (this.startCoord.x === coord.x && this.startCoord.y === coord.y) {
      this.handleClick();
      this.dragging = false;
      return;
    }
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    if (this.isOutside) {
      this.backupShapeElement.style.setProperty('transition', 'none');
      this.backupShapeElement.style.setProperty('--y', '100px');
      this.shapeElement.style.setProperty('--offset-x', `${0}px`);
      this.shapeElement.style.setProperty('--offset-y', `${0}px`);
      await sleep(0);
      this.shapeElement.classList.remove('dragging');
      this.backupShapeElement.style.removeProperty('transition');
      this.addShape(coord);
    } else {
      this.shapeElement.classList.remove('dragging');
      this.shapeElement.style.setProperty('--offset-x', `${0}px`);
      this.shapeElement.style.setProperty('--offset-y', `${0}px`);
      this.backupShapeElement.style.setProperty('--y', '100px');
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.dragging) {
      return;
    }
    this.onDragMove({ x: event.clientX, y: event.clientY });
  };

  private touchMove = (event: TouchEvent) => {
    if (!this.dragging) {
      return;
    }
    this.onDragMove({
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    });
  };

  private onMouseUp = (event: MouseEvent) => {
    this.onDragEnd({ x: event.clientX, y: event.clientY });
  };

  private onTouchEnd = (event: TouchEvent) => {
    this.onDragEnd({
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    });
  };

  @state()
  private fillColor: string = DEFAULT_SHAPE_FILL_COLOR;

  @state()
  private strokeColor: string = DEFAULT_SHAPE_STROKE_COLOR;

  @state()
  private shapeStyle: ShapeStyle = ShapeStyle.General;

  private addShape = (coord: Coord) => {
    const [modelX, modelY] = this.edgeless.surface.viewport.toModelCoord(
      coord.x,
      coord.y
    );
    const xywh = new Bound(modelX, modelY, 100, 100).serialize();
    this.edgeless.surface.addElement('shape', {
      shapeType: this.shape.name === 'roundedRect' ? 'rect' : this.shape.name,
      xywh: xywh,
      strokeColor: this.strokeColor,
      fillColor: this.fillColor,
      filled: true,
      radius: this.shape.name === 'roundedRect' ? 0.1 : 0,
      strokeWidth: 4,
      strokeStyle: StrokeStyle.Solid,
      shapeStyle: this.shapeStyle,
    });
  };

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.touchMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchend', this.onTouchEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.touchMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchend', this.onTouchEnd);
  }

  override updated(changedProperties: PropertyValues<this>) {
    if (!changedProperties.has('shape') && !changedProperties.has('order')) {
      return;
    }
    const transform =
      this.transformMap[this.order <= 3 ? `z${this.order}` : 'hidden'];
    this.shapeElement.style.setProperty('--x', `${transform.x}px`);
    this.shapeElement.style.setProperty('--y', `${transform.y}px`);
    this.shapeElement.style.setProperty(
      '--scale',
      String(transform.scale || 1)
    );
    this.shapeElement.style.zIndex = String(999 - this.order);
    this.shapeElement.style.transformOrigin = transform.origin;

    if (this.backupShapeElement) {
      this.backupShapeElement.style.setProperty('--y', '100px');
      this.backupShapeElement.style.setProperty('--scale', '0.9');
      this.backupShapeElement.style.zIndex = '999';
    }

    this.edgeless.slots.edgelessToolUpdated.on(newTool => {
      if (newTool.type !== 'shape') {
        return;
      }
      this.fillColor = newTool.fillColor;
      this.strokeColor = newTool.strokeColor;
      this.shapeStyle = newTool.shapeStyle;
    });
  }

  override render() {
    return html`
      <div
        id="shape-element"
        class="shape"
        @mousedown=${(event: MouseEvent) =>
          this.onDragStart({ x: event.clientX, y: event.clientY })}
        @touchstart=${(event: TouchEvent) => {
          event.preventDefault();
          this.onDragStart({
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
    'edgeless-shape-element': EdgelessShapeElement;
  }
}
