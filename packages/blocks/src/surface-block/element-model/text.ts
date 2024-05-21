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

export class TextElementModel extends ElementModel<TextElementProps> {
  static override propsToY(props: Record<string, unknown>) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text as string);
    }

    return props;
  }

  @yfield()
  accessor xywh: SerializedXYWH = '[0,0,16,16]';

  @yfield(0)
  accessor rotate: number = 0;

  @yfield()
  accessor text: Y.Text = new DocCollection.Y.Text();

  @yfield()
  accessor color: string = '#000000';

  @yfield()
  accessor fontSize: number = 16;

  @yfield()
  accessor fontFamily: FontFamily = FontFamily.Inter;

  @yfield<FontWeight, TextElementModel>(FontWeight.Regular)
  accessor fontWeight: FontWeight = FontWeight.Regular;

  @yfield<FontStyle, TextElementModel>('normal')
  accessor fontStyle: FontStyle = 'normal';

  @yfield()
  accessor textAlign: TextAlign = 'center';

  @yfield(false)
  accessor hasMaxWidth: boolean = false;

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
