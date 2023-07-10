import type { Bound } from '../../utils/bound.js';
import type { PointLocation } from '../../utils/point-location.js';
import type { IVec } from '../../utils/vec.js';
import { type SerializedXYWH } from '../../utils/xywh.js';
import type { IElementDefaultProps } from '../index.js';
import { SurfaceElement } from '../surface-element.js';

export interface IDebug {
  id: string;
  type: 'debug';
  xywh: SerializedXYWH;
  index: string;
  seed: number;

  rotate: number;

  color: string;
}

export const DebugElementDefaultProps: IElementDefaultProps<'debug'> = {
  type: 'debug',
  xywh: '[0,0,0,0]',

  rotate: 0,

  color: '#000000',
};

export class DebugElement extends SurfaceElement<IDebug> {
  get color() {
    const color = this.yMap.get('color') as IDebug['color'];
    return color;
  }

  override containedByBounds(bounds: Bound): boolean {
    throw new Error('Method not implemented.');
  }

  override getNearestPoint(point: IVec): IVec {
    throw new Error('Method not implemented.');
  }

  override intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    throw new Error('Method not implemented.');
  }

  getRelativePointLocation(point: IVec): PointLocation {
    throw new Error('Method not implemented.');
  }

  override render(ctx: CanvasRenderingContext2D, matrix: DOMMatrix): void {
    const { color, rotate } = this;
    const [, , w, h] = this.deserializeXYWH();
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }
}
