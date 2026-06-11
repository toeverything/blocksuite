import type { RoughCanvas } from '@labre/affine-block-surface';

import { Shape } from './shape';
import { drawGeneralShape } from './utils';

export class PolygonShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    const [x, y, w, h] = this.xywh;

    // Default pentagon vertices (normalized 0-1)
    const vertices = [
      [0.5, 0],
      [1, 0.38],
      [0.81, 1],
      [0.19, 1],
      [0, 0.38],
    ];

    if (this.shapeStyle === 'Scribbled') {
      const absPoints: [number, number][] = vertices.map(
        v => [x + v[0] * w, y + v[1] * h] as [number, number]
      );
      rc.polygon(absPoints, this.options);
    } else {
      drawGeneralShape(ctx, 'polygon', this.xywh, this.options);
    }
  }
}
