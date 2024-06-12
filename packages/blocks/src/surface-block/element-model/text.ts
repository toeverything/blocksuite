import { DocCollection, type Y } from '@blocksuite/store';

import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../consts.js';
import type { SerializedXYWH } from '../index.js';
import { Bound } from '../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonNearestPoint,
} from '../utils/math-utils.js';
import type { IVec2 } from '../utils/vec.js';
import { type IBaseProps, SurfaceElementModel } from './base.js';
import { yfield } from './decorators.js';

export type TextElementProps = IBaseProps & {
  text: Y.Text;
  hasMaxWidth?: boolean;
} & Omit<TextStyleProps, 'fontWeight' | 'fontStyle'> &
  Partial<Pick<TextStyleProps, 'fontWeight' | 'fontStyle'>>;

export class TextElementModel extends SurfaceElementModel<TextElementProps> {
  get type() {
    return 'text';
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

  @yfield<FontStyle, TextElementModel>(FontStyle.Normal)
  accessor fontStyle: FontStyle = FontStyle.Normal;

  @yfield()
  accessor textAlign: TextAlign = TextAlign.Center;

  @yfield(false)
  accessor hasMaxWidth: boolean = false;

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

  static override propsToY(props: Record<string, unknown>) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text as string);
    }

    return props;
  }
}

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {
      text: TextElementModel;
    }

    interface EdgelessTextModelMap {
      text: TextElementModel;
    }
  }
}
