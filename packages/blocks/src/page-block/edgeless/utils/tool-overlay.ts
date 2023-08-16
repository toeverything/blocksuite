import { DisposableGroup, noop } from '@blocksuite/global/utils';
import type { Options } from '@blocksuite/phasor';
import type { RoughCanvas } from '@blocksuite/phasor';
import { Overlay } from '@blocksuite/phasor';

import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  NOTE_OVERLAY_CORNER_RADIUS,
  NOTE_OVERLAY_DARK_BACKGROUND_COLOR,
  NOTE_OVERLAY_HEIGHT,
  NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR,
  NOTE_OVERLAY_OFFSET_X,
  NOTE_OVERLAY_OFFSET_Y,
  NOTE_OVERLAY_STOKE_COLOR,
  NOTE_OVERLAY_TEXT_COLOR,
  NOTE_OVERLAY_WIDTH,
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OFFSET_X,
  SHAPE_OVERLAY_OFFSET_Y,
  SHAPE_OVERLAY_WIDTH,
} from '../utils/consts.js';

abstract class Shape {
  x: number;
  y: number;
  type: string;
  options: Options;

  constructor(x: number, y: number, type: string, options: Options) {
    this.x = x;
    this.y = y;
    this.type = 'rect';
    this.options = options;
  }

  abstract draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;
}

class RectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.rectangle(
      this.x + SHAPE_OVERLAY_OFFSET_X,
      this.y + SHAPE_OVERLAY_OFFSET_Y,
      SHAPE_OVERLAY_WIDTH,
      SHAPE_OVERLAY_HEIGHT,
      this.options
    );
  }
}

class TriangleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.polygon(
      [
        [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y],
        [this.x, this.y + SHAPE_OVERLAY_HEIGHT],
        [this.x + SHAPE_OVERLAY_WIDTH, this.y + SHAPE_OVERLAY_HEIGHT],
      ],
      this.options
    );
  }
}

class DiamondShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.polygon(
      [
        [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y],
        [this.x + SHAPE_OVERLAY_WIDTH, this.y + SHAPE_OVERLAY_HEIGHT / 2],
        [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y + SHAPE_OVERLAY_HEIGHT],
        [this.x, this.y + SHAPE_OVERLAY_HEIGHT / 2],
      ],
      this.options
    );
  }
}

class EllipseShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.ellipse(
      this.x + SHAPE_OVERLAY_WIDTH / 2,
      this.y + SHAPE_OVERLAY_HEIGHT / 2,
      SHAPE_OVERLAY_WIDTH,
      SHAPE_OVERLAY_HEIGHT,
      this.options
    );
  }
}

class RoundedRectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    const radius = 0.1;
    const r = Math.min(
      SHAPE_OVERLAY_WIDTH * radius,
      SHAPE_OVERLAY_HEIGHT * radius
    );
    const x0 = this.x + r;
    const x1 = this.x + SHAPE_OVERLAY_WIDTH + 40 - r;
    const y0 = this.y + r;
    const y1 = this.y + SHAPE_OVERLAY_HEIGHT - r;
    const path = `
        M${x0},${this.y} L${x1},${this.y} 
        A${r},${r} 0 0 1 ${x1},${y0} 
        L${x1},${y1} 
        A${r},${r} 0 0 1 ${x1 - r},${y1} 
        L${x0 + r},${y1} 
        A${r},${r} 0 0 1 ${x0},${y1 - r} 
        L${x0},${y0} 
        A${r},${r} 0 0 1 ${x0 + r},${this.y}
      `;

    rc.path(path, this.options);
  }
}

class ShapeFactory {
  static createShape(
    x: number,
    y: number,
    type: string,
    options: Options
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(x, y, type, options);
      case 'triangle':
        return new TriangleShape(x, y, type, options);
      case 'diamond':
        return new DiamondShape(x, y, type, options);
      case 'ellipse':
        return new EllipseShape(x, y, type, options);
      case 'roundedRect':
        return new RoundedRectShape(x, y, type, options);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}

class ToolOverlay extends Overlay {
  public x: number;
  public y: number;
  public globalAlpha: number;
  protected edgeless: EdgelessPageBlockComponent;
  protected disposables!: DisposableGroup;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.x = 0;
    this.y = 0;
    this.globalAlpha = 0;
    this.edgeless = edgeless;
    this.disposables = new DisposableGroup();
    this.disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        // when viewport is updated, we should keep the overlay in the same position
        // to get last mouse position and convert it to model coordinates
        const lastX = this.edgeless.tools.lastMousePos.x;
        const lastY = this.edgeless.tools.lastMousePos.y;
        const [x, y] = this.edgeless.surface.toModelCoord(lastX, lastY);
        this.x = x;
        this.y = y;
      })
    );
  }

  dispose(): void {
    this.disposables.dispose();
  }

  render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    noop();
  }
}

export class ShapeOverlay extends ToolOverlay {
  public shape: Shape;

  constructor(
    edgeless: EdgelessPageBlockComponent,
    type: string,
    options: Options
  ) {
    super(edgeless);
    this.shape = ShapeFactory.createShape(this.x, this.y, type, options);
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        if (edgelessTool.type !== 'shape') return;
        const shapeType = edgelessTool.shape;
        const computedStyle = getComputedStyle(edgeless);
        const strokeColor = computedStyle.getPropertyValue(
          edgelessTool.strokeColor
        );
        const newOptions = {
          ...options,
          stroke: strokeColor,
        };

        this.shape = ShapeFactory.createShape(
          this.x,
          this.y,
          shapeType,
          newOptions
        );
        this.edgeless.surface.refresh();
      })
    );
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    ctx.globalAlpha = this.globalAlpha;
    this.shape.x = this.x;
    this.shape.y = this.y;
    this.shape.draw(ctx, rc);
  }
}

export class NoteOverlay extends ToolOverlay {
  public text = '';
  public themeMode = 'light';

  private _getOverlayText(text: string): string {
    return text[0].toUpperCase() + text.slice(1);
  }

  constructor(edgeless: EdgelessPageBlockComponent) {
    super(edgeless);
    this.globalAlpha = 0;
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        // when change note child type, update overlay text
        if (edgelessTool.type !== 'note') return;
        this.text = this._getOverlayText(edgelessTool.tip);
        this.edgeless.surface.refresh();
      })
    );
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.globalAlpha;
    const overlayX = this.x + NOTE_OVERLAY_OFFSET_X;
    const overlayY = this.y + NOTE_OVERLAY_OFFSET_Y;
    // Draw the overlay rectangle
    ctx.strokeStyle = NOTE_OVERLAY_STOKE_COLOR;
    ctx.fillStyle =
      this.themeMode === 'light'
        ? NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR
        : NOTE_OVERLAY_DARK_BACKGROUND_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(overlayX + NOTE_OVERLAY_CORNER_RADIUS, overlayY);
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      overlayY
    );
    ctx.quadraticCurveTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY,
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.quadraticCurveTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_HEIGHT,
      overlayX + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      overlayY + NOTE_OVERLAY_HEIGHT
    );
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_CORNER_RADIUS,
      overlayY + NOTE_OVERLAY_HEIGHT
    );
    ctx.quadraticCurveTo(
      overlayX,
      overlayY + NOTE_OVERLAY_HEIGHT,
      overlayX,
      overlayY + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(overlayX, overlayY + NOTE_OVERLAY_CORNER_RADIUS);
    ctx.quadraticCurveTo(
      overlayX,
      overlayY,
      overlayX + NOTE_OVERLAY_CORNER_RADIUS,
      overlayY
    );
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Draw the overlay text
    ctx.fillStyle = NOTE_OVERLAY_TEXT_COLOR;
    let fontSize = 16;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // measure the width of the text
    // if the text is wider than the rectangle, reduce the maximum width of the text
    while (ctx.measureText(this.text).width > NOTE_OVERLAY_WIDTH - 20) {
      fontSize -= 1;
      ctx.font = `${fontSize}px Arial`;
    }

    ctx.fillText(this.text, overlayX + 10, overlayY + NOTE_OVERLAY_HEIGHT / 2);
  }
}
