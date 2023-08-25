import { DisposableGroup, noop } from '@blocksuite/global/utils';
import type { Options, RoughCanvas } from '@blocksuite/phasor';
import { ShapeStyle } from '@blocksuite/phasor';
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

const drawRectangle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.rect(
    x + SHAPE_OVERLAY_OFFSET_X,
    y + SHAPE_OVERLAY_OFFSET_Y,
    SHAPE_OVERLAY_WIDTH,
    SHAPE_OVERLAY_HEIGHT
  );
};

const drawTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.moveTo(x + SHAPE_OVERLAY_WIDTH / 2, y);
  ctx.lineTo(x, y + SHAPE_OVERLAY_HEIGHT);
  ctx.lineTo(x + SHAPE_OVERLAY_WIDTH, y + SHAPE_OVERLAY_HEIGHT);
};

const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.lineTo(x + SHAPE_OVERLAY_WIDTH / 2, y);
  ctx.lineTo(x + SHAPE_OVERLAY_WIDTH, y + SHAPE_OVERLAY_HEIGHT / 2);
  ctx.lineTo(x + SHAPE_OVERLAY_WIDTH / 2, y + SHAPE_OVERLAY_HEIGHT);
  ctx.lineTo(x, y + SHAPE_OVERLAY_HEIGHT / 2);
};

const drawEllipse = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.ellipse(
    x + SHAPE_OVERLAY_WIDTH / 2,
    y + SHAPE_OVERLAY_HEIGHT / 2,
    SHAPE_OVERLAY_WIDTH / 2,
    SHAPE_OVERLAY_HEIGHT / 2,
    0,
    0,
    2 * Math.PI
  );
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) => {
  const width = SHAPE_OVERLAY_WIDTH + 40;
  const height = SHAPE_OVERLAY_HEIGHT;
  const radius = 0.1;
  const cornerRadius = Math.min(width * radius, height * radius);
  ctx.moveTo(x + cornerRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, cornerRadius);
  ctx.arcTo(x + width, y + height, x, y + height, cornerRadius);
  ctx.arcTo(x, y + height, x, y, cornerRadius);
  ctx.arcTo(x, y, x + width, y, cornerRadius);
};

const drawGeneralShape = (
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  options: Options
) => {
  ctx.strokeStyle = options.stroke ?? '';
  ctx.lineWidth = options.strokeWidth ?? 2;
  ctx.fillStyle = options.fill ?? '#FFFFFF00';

  ctx.beginPath();

  switch (type) {
    case 'rect':
      drawRectangle(ctx, x, y);
      break;
    case 'triangle':
      drawTriangle(ctx, x, y);
      break;
    case 'diamond':
      drawDiamond(ctx, x, y);
      break;
    case 'ellipse':
      drawEllipse(ctx, x, y);
      break;
    case 'roundedRect':
      drawRoundedRect(ctx, x, y);
      break;
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }

  ctx.closePath();

  ctx.fill();
  ctx.stroke();
};

abstract class Shape {
  x: number;
  y: number;
  type: string;
  options: Options;
  shapeStyle: ShapeStyle;

  constructor(
    x: number,
    y: number,
    _type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ) {
    this.x = x;
    this.y = y;
    this.type = 'rect';
    this.options = options;
    this.shapeStyle = shapeStyle;
  }

  abstract draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;
}

class RectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      rc.rectangle(
        this.x + SHAPE_OVERLAY_OFFSET_X,
        this.y + SHAPE_OVERLAY_OFFSET_Y,
        SHAPE_OVERLAY_WIDTH,
        SHAPE_OVERLAY_HEIGHT,
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'rect', this.x, this.y, this.options);
    }
  }
}

class TriangleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      rc.polygon(
        [
          [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y],
          [this.x, this.y + SHAPE_OVERLAY_HEIGHT],
          [this.x + SHAPE_OVERLAY_WIDTH, this.y + SHAPE_OVERLAY_HEIGHT],
        ],
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'triangle', this.x, this.y, this.options);
    }
  }
}

class DiamondShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      rc.polygon(
        [
          [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y],
          [this.x + SHAPE_OVERLAY_WIDTH, this.y + SHAPE_OVERLAY_HEIGHT / 2],
          [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y + SHAPE_OVERLAY_HEIGHT],
          [this.x, this.y + SHAPE_OVERLAY_HEIGHT / 2],
        ],
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'diamond', this.x, this.y, this.options);
    }
  }
}

class EllipseShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      rc.ellipse(
        this.x + SHAPE_OVERLAY_WIDTH / 2,
        this.y + SHAPE_OVERLAY_HEIGHT / 2,
        SHAPE_OVERLAY_WIDTH,
        SHAPE_OVERLAY_HEIGHT,
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'ellipse', this.x, this.y, this.options);
    }
  }
}

class RoundedRectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
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
    } else {
      drawGeneralShape(ctx, 'roundedRect', this.x, this.y, this.options);
    }
  }
}

class ShapeFactory {
  static createShape(
    x: number,
    y: number,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(x, y, type, options, shapeStyle);
      case 'triangle':
        return new TriangleShape(x, y, type, options, shapeStyle);
      case 'diamond':
        return new DiamondShape(x, y, type, options, shapeStyle);
      case 'ellipse':
        return new EllipseShape(x, y, type, options, shapeStyle);
      case 'roundedRect':
        return new RoundedRectShape(x, y, type, options, shapeStyle);
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

  render(_ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    noop();
  }
}

export class ShapeOverlay extends ToolOverlay {
  public shape: Shape;

  constructor(
    edgeless: EdgelessPageBlockComponent,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ) {
    super(edgeless);
    this.shape = ShapeFactory.createShape(
      this.x,
      this.y,
      type,
      options,
      shapeStyle
    );
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        if (edgelessTool.type !== 'shape') return;
        const shapeType = edgelessTool.shape;
        const shapeStyle = edgelessTool.shapeStyle;
        const computedStyle = getComputedStyle(edgeless);
        const strokeColor = computedStyle.getPropertyValue(
          edgelessTool.strokeColor
        );
        const fillColor = computedStyle.getPropertyValue(
          edgelessTool.fillColor
        );
        const newOptions = {
          ...options,
          stroke: strokeColor,
          fill: fillColor,
        };

        this.shape = ShapeFactory.createShape(
          this.x,
          this.y,
          shapeType,
          newOptions,
          shapeStyle
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
