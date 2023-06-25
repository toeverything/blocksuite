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
  flipX: 1 | -1;
  flipY: 1 | -1;

  color: string;
}

export const DebugElementDefaultProps: IElementDefaultProps<'debug'> = {
  type: 'debug',
  xywh: '[0,0,0,0]',

  rotate: 0,
  flipX: 1,
  flipY: 1,

  color: '#000000',
};

export class DebugElement extends SurfaceElement<IDebug> {
  get color() {
    const color = this.yMap.get('color') as IDebug['color'];
    return color;
  }

  override intersectWithLine(start: IVec, end: IVec): boolean {
    throw new Error('Method not implemented.');
  }

  override render(ctx: CanvasRenderingContext2D, matrix: DOMMatrix): void {
    const {
      color,
      rotate,
      flipX,
      flipY,
      widthAndHeight: [w, h],
    } = this;
    const cx = w / 2;
    const cy = h / 2;

    matrix
      .translateSelf(cx, cy)
      .rotateSelf(rotate)
      .scaleSelf(flipX, flipY)
      .translateSelf(-cx, -cy);
    ctx.setTransform(matrix);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }
}
