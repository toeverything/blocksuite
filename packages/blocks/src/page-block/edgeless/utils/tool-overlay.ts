import { DisposableGroup } from '@blocksuite/global/utils';
import type { Options } from '@blocksuite/phasor';
import type { RoughCanvas } from '@blocksuite/phasor';
import { Overlay } from '@blocksuite/phasor';

import { noop } from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  NOTE_OVERLAY_CORNER_RADIUS,
  NOTE_OVERLAY_DARK_BACKGROUND_COLOR,
  NOTE_OVERLAY_HEIGHT,
  NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR,
  NOTE_OVERLAY_STOKE_COLOR,
  NOTE_OVERLAY_TEXT_COLOR,
  NOTE_OVERLAY_WIDTH,
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OFFSET_X,
  SHAPE_OVERLAY_OFFSET_Y,
  SHAPE_OVERLAY_OPTIONS,
  SHAPE_OVERLAY_WIDTH,
} from '../utils/consts.js';

abstract class Shape {
  x: number;
  y: number;
  globalAlpha: number;
  options: Options;

  constructor(x: number, y: number, globalAlpha: number, options: Options) {
    this.x = x;
    this.y = y;
    this.globalAlpha = globalAlpha;
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
    globalAlpha: number,
    type: string,
    options: Options
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(x, y, globalAlpha, options);
      case 'triangle':
        return new TriangleShape(x, y, globalAlpha, options);
      case 'diamond':
        return new DiamondShape(x, y, globalAlpha, options);
      case 'ellipse':
        return new EllipseShape(x, y, globalAlpha, options);
      case 'roundedRect':
        return new RoundedRectShape(x, y, globalAlpha, options);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}

class ToolOverlay extends Overlay {
  protected edgeless: EdgelessPageBlockComponent;
  protected disposables!: DisposableGroup;
  protected lastViewportX: number;
  protected lastViewportY: number;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
    this.disposables = new DisposableGroup();
    this.lastViewportX = edgeless.surface.viewport.viewportX;
    this.lastViewportY = edgeless.surface.viewport.viewportY;
  }

  render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    noop();
  }
}

export class ShapeOverlay extends ToolOverlay {
  private _shape: Shape;
  private _x: number;
  private _y: number;
  private _globalAlpha: number;
  private _options: Options;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super(edgeless);
    this._x = 0;
    this._y = 0;
    this._globalAlpha = 0;
    this._options = SHAPE_OVERLAY_OPTIONS;
    this._shape = ShapeFactory.createShape(
      this._x,
      this._y,
      this._globalAlpha,
      'rect',
      this._options
    );
    this.disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        // TODO: consoder zoom in zoom out
        // get current viewport position
        const currentViewportX = this.edgeless.surface.viewport.viewportX;
        const currentViewportY = this.edgeless.surface.viewport.viewportY;
        // calculate position delta
        const deltaX = currentViewportX - this.lastViewportX;
        const deltaY = currentViewportY - this.lastViewportY;
        // update overlay current position
        this.x += deltaX;
        this.y += deltaY;
        // update last viewport position
        this.lastViewportX = currentViewportX;
        this.lastViewportY = currentViewportY;
        // refresh to show new overlay
        this.edgeless.surface.refresh();
      })
    );
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        if (edgelessTool.type !== 'shape') return;
        this.setShape(edgelessTool.shape, this._options);
        this.edgeless.surface.refresh();
      })
    );
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this._shape.x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this._shape.y = value;
  }

  get globalAlpha(): number {
    return this._globalAlpha;
  }

  set globalAlpha(value: number) {
    this._globalAlpha = value;
    this._shape.globalAlpha = value;
  }

  get options(): Options {
    return this._options;
  }

  set options(value: Options) {
    this._options = value;
    this._shape.options = value;
  }

  setShape(type: string, options: Options): void {
    this._shape = ShapeFactory.createShape(
      this._x,
      this._y,
      this._globalAlpha,
      type,
      options
    );
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    ctx.globalAlpha = this._shape.globalAlpha;
    this._shape.draw(ctx, rc);
  }
}

export class NoteOverlay extends ToolOverlay {
  x: number;
  y: number;
  globalAlpha: number;
  text = '';
  themeMode = 'light';

  private _getOverlayText(text: string): string {
    return text[0].toUpperCase() + text.slice(1);
  }

  constructor(edgeless: EdgelessPageBlockComponent) {
    super(edgeless);
    this.x = 0;
    this.y = 0;
    this.globalAlpha = 0;
    this.disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        console.log('viewportUpdated');
        // get current viewport position
        const currentViewportX = this.edgeless.surface.viewport.viewportX;
        const currentViewportY = this.edgeless.surface.viewport.viewportY;
        // calculate position delta
        const deltaX = currentViewportX - this.lastViewportX;
        const deltaY = currentViewportY - this.lastViewportY;
        // update overlay current position
        this.x += deltaX;
        this.y += deltaY;
        // update last viewport position
        this.lastViewportX = currentViewportX;
        this.lastViewportY = currentViewportY;
        // refresh to show new overlay
        this.edgeless.surface.refresh();
      })
    );
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
    // Draw the overlay rectangle
    ctx.strokeStyle = NOTE_OVERLAY_STOKE_COLOR;
    ctx.fillStyle =
      this.themeMode === 'light'
        ? NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR
        : NOTE_OVERLAY_DARK_BACKGROUND_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + NOTE_OVERLAY_CORNER_RADIUS, this.y);
    ctx.lineTo(
      this.x + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      this.y
    );
    ctx.quadraticCurveTo(
      this.x + NOTE_OVERLAY_WIDTH,
      this.y,
      this.x + NOTE_OVERLAY_WIDTH,
      this.y + NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(
      this.x + NOTE_OVERLAY_WIDTH,
      this.y + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.quadraticCurveTo(
      this.x + NOTE_OVERLAY_WIDTH,
      this.y + NOTE_OVERLAY_HEIGHT,
      this.x + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      this.y + NOTE_OVERLAY_HEIGHT
    );
    ctx.lineTo(
      this.x + NOTE_OVERLAY_CORNER_RADIUS,
      this.y + NOTE_OVERLAY_HEIGHT
    );
    ctx.quadraticCurveTo(
      this.x,
      this.y + NOTE_OVERLAY_HEIGHT,
      this.x,
      this.y + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(this.x, this.y + NOTE_OVERLAY_CORNER_RADIUS);
    ctx.quadraticCurveTo(
      this.x,
      this.y,
      this.x + NOTE_OVERLAY_CORNER_RADIUS,
      this.y
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

    ctx.fillText(this.text, this.x + 10, this.y + NOTE_OVERLAY_HEIGHT / 2);
  }
}
