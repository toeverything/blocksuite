import { StrokeStyle } from '../../consts.js';
import type { Bound } from '../../utils/bound.js';
import type { ITextDelta } from '../text/types.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  wrapText,
} from '../text/utils.js';
import { type GeneralShapeOptions, SHAPE_TEXT_PADDING } from './constants.js';
import type { ShapeElement } from './shape-element.js';
import type { ShapeType } from './types.js';

export function normalizeShapeBound(shape: ShapeElement, bound: Bound): Bound {
  if (!shape.text) return bound;

  const yText = shape.text;
  const { fontFamily, fontSize } = shape;
  const lineHeight = getLineHeight(fontFamily, fontSize);
  const font = getFontString({
    fontSize: fontSize,
    lineHeight: `${lineHeight}px`,
    fontFamily: fontFamily,
  });
  const widestCharWidth =
    [...yText.toString()]
      .map(char => getTextWidth(char, font))
      .sort((a, b) => a - b)
      .pop() ?? getTextWidth('W', font);

  if (bound.w < widestCharWidth + SHAPE_TEXT_PADDING * 2) {
    bound.w = widestCharWidth + SHAPE_TEXT_PADDING * 2;
  }
  const deltas: ITextDelta[] = (yText.toDelta() as ITextDelta[]).flatMap(
    delta => ({
      insert: wrapText(delta.insert, font, bound.w - SHAPE_TEXT_PADDING * 2),
      attributes: delta.attributes,
    })
  ) as ITextDelta[];
  const lines = deltaInsertsToChunks(deltas);

  if (bound.h < lineHeight * lines.length + SHAPE_TEXT_PADDING * 2) {
    bound.h = lineHeight * lines.length + SHAPE_TEXT_PADDING * 2;
  }

  return bound;
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(width * radius, height * radius);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(width / 2, y);
  ctx.lineTo(width, height / 2);
  ctx.lineTo(width / 2, height);
  ctx.lineTo(x, height / 2);
  ctx.closePath();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, 2 * Math.PI);
  ctx.closePath();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(width / 2, y);
  ctx.lineTo(width, height);
  ctx.lineTo(x, height);
  ctx.closePath();
}

export function drawGeneralShpae(
  ctx: CanvasRenderingContext2D,
  shapeType: ShapeType,
  options: GeneralShapeOptions
) {
  switch (shapeType) {
    case 'rect':
      drawRect(
        ctx,
        options.x,
        options.y,
        options.width,
        options.height,
        options.radius ?? 0
      );
      break;
    case 'diamond':
      drawDiamond(ctx, options.x, options.y, options.width, options.height);
      break;
    case 'ellipse':
      drawEllipse(ctx, options.x, options.y, options.width, options.height);
      break;
    case 'triangle':
      drawTriangle(ctx, options.x, options.y, options.width, options.height);
  }

  ctx.lineWidth = options.strokeWidth;
  ctx.strokeStyle = options.strokeColor;
  switch (options.strokeStyle) {
    case StrokeStyle.None:
      ctx.strokeStyle = 'transparent';
      break;
    case StrokeStyle.Dashed:
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = options.strokeStyle;
      break;
    default:
      ctx.strokeStyle = options.strokeStyle;
  }
  ctx.stroke();
}
