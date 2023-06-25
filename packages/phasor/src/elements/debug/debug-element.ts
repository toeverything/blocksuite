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

  matrix: number[];

  color: string;
}

export const DebugElementDefaultProps: IElementDefaultProps<'debug'> = {
  type: 'debug',
  xywh: '[0,0,0,0]',

  matrix: [1, 0, 0, 1, 0, 0],

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
      matrix: localMatrix,
      widthAndHeight: [w, h],
    } = this;
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix
        .translateSelf(cx, cy)
        .multiplySelf(new DOMMatrix(localMatrix))
        .translateSelf(-cx, -cy)
    );

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }
}
