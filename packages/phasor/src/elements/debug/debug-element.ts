import { type SerializedXYWH } from '../../utils/xywh.js';
import type { ElementDefaultProps } from '../index.js';
import { SurfaceElement } from '../surface-element.js';

export interface IDebug {
  id: string;
  type: string;
  xywh: SerializedXYWH;
  seed: number;
  zIndex: string;

  color: string;
}

export const DebugElementDefaultProps: ElementDefaultProps<'debug'> = {
  type: 'debug',
  xywh: '[0,0,0,0]',

  color: '#000000',
};

export class DebugElement extends SurfaceElement<IDebug> {
  get color() {
    const color = this.yMap.get('color') as IDebug['color'];
    return color;
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.w, this.h);
  }
}
