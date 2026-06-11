import type {
  CanvasRenderer,
  RoughCanvas,
} from '@labre/affine-block-surface';
import type {
  LocalShapeElementModel,
  ShapeElementModel,
} from '@labre/affine-model';

import { type Colors, drawGeneralShape } from './utils.js';

export function polygon(
  model: ShapeElementModel | LocalShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer,
  rc: RoughCanvas,
  colors: Colors
) {
  const {
    seed,
    strokeWidth,
    filled,
    strokeStyle,
    roughness,
    rotate,
    shapeStyle,
  } = model;
  const [, , w, h] = model.deserializedXYWH;
  const renderOffset = Math.max(strokeWidth, 0) / 2;
  const renderWidth = w - renderOffset * 2;
  const renderHeight = h - renderOffset * 2;
  const cx = renderWidth / 2;
  const cy = renderHeight / 2;

  const { fillColor, strokeColor } = colors;

  ctx.setTransform(
    matrix
      .translateSelf(renderOffset, renderOffset)
      .translateSelf(cx, cy)
      .rotateSelf(rotate)
      .translateSelf(-cx, -cy)
  );

  // Get vertices - use default pentagon if not set
  const vertices =
    'vertices' in model && model.vertices
      ? model.vertices
      : [
          [0.5, 0],
          [1, 0.38],
          [0.81, 1],
          [0.19, 1],
          [0, 0.38],
        ];

  if (shapeStyle === 'General') {
    drawGeneralShape(ctx, model, renderer, filled, fillColor, strokeColor);
  } else {
    // Convert normalized vertices to absolute coordinates for rough.js
    const absPoints: [number, number][] = vertices.map(
      v => [v[0] * renderWidth, v[1] * renderHeight] as [number, number]
    );

    const smoothFlags =
      'smoothFlags' in model && model.smoothFlags
        ? model.smoothFlags
        : null;

    const controlPoints: ((number[] | null)[] | null) =
      'controlPoints' in model && (model as unknown as Record<string, unknown>).controlPoints
        ? (model as unknown as { controlPoints: (number[] | null)[] }).controlPoints
        : null;

    const hasBezier = smoothFlags && smoothFlags.some(f => f);

    if (hasBezier) {
      const count = absPoints.length;
      let pathD = `M ${absPoints[0][0]} ${absPoints[0][1]} `;
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        const currSmooth = smoothFlags[i] ?? false;
        const nextSmooth = smoothFlags[next] ?? false;

        const [cx, cy] = absPoints[i];
        const [nx, ny] = absPoints[next];

        if (!currSmooth && !nextSmooth) {
          pathD += `L ${nx} ${ny} `;
        } else {
          let cp1x: number, cp1y: number;
          const customCurr = controlPoints?.[i];
          if (currSmooth) {
            cp1x = customCurr ? customCurr[2] * renderWidth : cx + (nx - cx) / 3;
            cp1y = customCurr ? customCurr[3] * renderHeight : cy + (ny - cy) / 3;
          } else {
            cp1x = cx;
            cp1y = cy;
          }
          let cp2x: number, cp2y: number;
          const customNext = controlPoints?.[next];
          if (nextSmooth) {
            cp2x = customNext ? customNext[0] * renderWidth : nx + (cx - nx) / 3;
            cp2y = customNext ? customNext[1] * renderHeight : ny + (cy - ny) / 3;
          } else {
            cp2x = nx;
            cp2y = ny;
          }
          pathD += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${nx} ${ny} `;
        }
      }
      pathD += 'Z';

      rc.path(pathD, {
        seed,
        roughness: shapeStyle === 'Scribbled' ? roughness : 0,
        strokeLineDash: strokeStyle === 'dash' ? [12, 12] : undefined,
        stroke: strokeStyle === 'none' ? 'none' : strokeColor,
        strokeWidth,
        fill: filled ? fillColor : undefined,
      });
    } else {
      rc.polygon(absPoints, {
        seed,
        roughness: shapeStyle === 'Scribbled' ? roughness : 0,
        strokeLineDash: strokeStyle === 'dash' ? [12, 12] : undefined,
        stroke: strokeStyle === 'none' ? 'none' : strokeColor,
        strokeWidth,
        fill: filled ? fillColor : undefined,
      });
    }
  }
}
