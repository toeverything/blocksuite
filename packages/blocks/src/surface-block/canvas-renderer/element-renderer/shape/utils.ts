import type { ShapeElementModel } from '../../../element-model/shape.js';

export function drawGeneralShape(
  ctx: CanvasRenderingContext2D,
  shapeModel: ShapeElementModel
) {
  const { x, y, w, h } = shapeModel;
  switch (shapeModel.type) {
    case 'rect':
      drawRect(ctx, x, y, w, h, shapeModel.radius ?? 0);
      break;
    case 'diamond':
      drawDiamond(ctx, x, y, w, h);
      break;
    case 'ellipse':
      drawEllipse(ctx, x, y, w, h);
      break;
    case 'triangle':
      drawTriangle(ctx, x, y, w, h);
  }

  ctx.lineWidth = shapeModel.strokeWidth;
  ctx.strokeStyle = shapeModel.strokeColor;
  ctx.fillStyle = shapeModel.fillColor;

  switch (shapeModel.strokeStyle) {
    case 'none':
      ctx.strokeStyle = 'transparent';
      break;
    case 'dash':
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = shapeModel.strokeStyle;
      break;
    default:
      ctx.strokeStyle = shapeModel.strokeStyle;
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
