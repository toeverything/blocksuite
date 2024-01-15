import type {
  TextAlign,
  VerticalAlign,
} from '../../../element-model/common.js';
import type { ShapeElementModel } from '../../../element-model/shape.js';
import type { Renderer } from '../../renderer.js';
import type { TextDelta } from '../text/utils.js';

const SHAPE_TEXT_PADDING = 20;

export function drawGeneralShape(
  ctx: CanvasRenderingContext2D,
  shapeModel: ShapeElementModel,
  renderer: Renderer
) {
  const sizeOffset = Math.max(shapeModel.strokeWidth, 0);
  const w = shapeModel.w - sizeOffset;
  const h = shapeModel.h - sizeOffset;

  switch (shapeModel.shapeType) {
    case 'rect':
      drawRect(ctx, 0, 0, w, h, shapeModel.radius ?? 0);
      break;
    case 'diamond':
      drawDiamond(ctx, 0, 0, w, h);
      break;
    case 'ellipse':
      drawEllipse(ctx, 0, 0, w, h);
      break;
    case 'triangle':
      drawTriangle(ctx, 0, 0, w, h);
  }

  ctx.lineWidth = shapeModel.strokeWidth;
  ctx.strokeStyle = renderer.getVariableColor(shapeModel.strokeColor);
  ctx.fillStyle = renderer.getVariableColor(shapeModel.fillColor);

  switch (shapeModel.strokeStyle) {
    case 'none':
      ctx.strokeStyle = 'transparent';
      break;
    case 'dash':
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = renderer.getVariableColor(shapeModel.strokeStyle);
      break;
    default:
      ctx.strokeStyle = renderer.getVariableColor(shapeModel.strokeStyle);
  }
  ctx.fill();
  ctx.stroke();
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(Math.min(width * radius, height * radius), 0);
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
  _x: number,
  _y: number,
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

export function horizontalOffset(width: number, textAlign: TextAlign) {
  return textAlign === 'center'
    ? width / 2
    : textAlign === 'right'
      ? width - SHAPE_TEXT_PADDING
      : SHAPE_TEXT_PADDING;
}

export function verticalOffset(
  lines: TextDelta[][],
  lineHeight: number,
  height: number,
  textVerticalAlign: VerticalAlign
) {
  return textVerticalAlign === 'center'
    ? (height - lineHeight * lines.length) / 2
    : textVerticalAlign === 'top'
      ? SHAPE_TEXT_PADDING
      : height - lineHeight * lines.length - SHAPE_TEXT_PADDING;
}
