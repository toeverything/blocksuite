import { DocCollection, type Y } from '@blocksuite/store';

import type { SerializedXYWH } from '../index.js';
import { Bound } from '../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonNearestPoint,
} from '../utils/math-utils.js';
import type { IVec2 } from '../utils/vec.js';
import { type BaseProps, ElementModel } from './base.js';
import {
  FontFamily,
  type FontStyle,
  FontWeight,
  type TextAlign,
} from './common.js';
import { yfield } from './decorators.js';

export type TextElementProps = BaseProps & {
  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textAlign: 'left' | 'center' | 'right';
  hasMaxWidth?: boolean;
};

export class TextElementModel<
  T extends TextElementProps,
> extends ElementModel<T> {
  static override propsToY(props: Record<string, unknown>) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text as string);
    }

    return props;
  }

  @yfield()
  xywh: SerializedXYWH = '[0,0,16,16]';

  @yfield(0)
  rotate: number = 0;

  @yfield()
  text: Y.Text = new DocCollection.Y.Text();

  @yfield()
  color: string = '#000000';

  @yfield()
  fontSize: number = 16;

  @yfield()
  fontFamily: FontFamily = FontFamily.Inter;

  @yfield()
  fontWeight: FontWeight = FontWeight.Regular;

  @yfield()
  fontStyle: FontStyle = 'normal';

  @yfield()
  textAlign: TextAlign = 'center';

  @yfield()
  hasMaxWidth?: boolean;

  get type() {
    return 'text';
  }

  override getNearestPoint(point: IVec2): IVec2 {
    return polygonNearestPoint(
      Bound.deserialize(this.xywh).points,
      point
    ) as IVec2;
  }

  override containedByBounds(bounds: Bound): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override intersectWithLine(start: IVec2, end: IVec2) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  override hitTest(x: number, y: number): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return pointInPolygon([x, y], points);
  }
}
