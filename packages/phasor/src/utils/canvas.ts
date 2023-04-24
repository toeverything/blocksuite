import { StrokeStyle } from '../consts.js';

export function setLineDash(
  ctx: CanvasRenderingContext2D,
  strokeStyle: StrokeStyle
) {
  if (strokeStyle === StrokeStyle.Dashed) {
    ctx.setLineDash([12, 12]);
  } else {
    ctx.setLineDash([0, 0]);
  }
}
