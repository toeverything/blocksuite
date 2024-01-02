import {
  Bound,
  getBoundFromPoints,
  inflateBound,
  transformPointsToNewBound,
} from '../utils/bound.js';
import { type SerializedXYWH } from '../utils/xywh.js';
import { type BaseProps, ElementModel } from './base.js';
import { derive, ymap } from './decorators.js';

export type BrushProps = BaseProps & {
  /**
   * [[x0,y0],[x1,y1]...]
   */
  points: number[][];
  color: string;
  lineWidth: number;
};

export class BrushElementModel extends ElementModel<BrushProps> {
  @derive((instance: BrushElementModel) => {
    const lineWidth = instance.lineWidth;
    const bound = getBoundFromPoints(instance.points);
    const boundWidthLineWidth = inflateBound(bound, lineWidth);

    return {
      xywh: boundWidthLineWidth.serialize(),
    };
  })
  @ymap()
  points: number[][] = [];

  @derive((instance: BrushElementModel) => {
    const bound = Bound.deserialize(instance.xywh);
    const { lineWidth } = instance;
    const transformed = transformPointsToNewBound(
      instance.points.map(([x, y]) => ({ x, y })),
      instance,
      lineWidth / 2,
      bound,
      lineWidth / 2
    );

    return {
      points: transformed.points.map(p => [p.x, p.y]),
    };
  })
  @ymap()
  xywh: SerializedXYWH = '[0,0,0,0]';

  @ymap()
  rotate: number = 0;

  @ymap()
  color: string = '#000000';

  @ymap()
  lineWidth: number = 4;

  override get type() {
    return 'brush';
  }
}
