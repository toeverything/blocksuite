import type { IVec } from '@blocksuite/global/utils';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import { Bound } from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';

import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../consts.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonNearestPoint,
} from '../utils/math-utils.js';
import { type IBaseProps, SurfaceElementModel } from './base.js';
import { yfield } from './decorators.js';

export type TextElementProps = IBaseProps & {
  text: Y.Text;
  hasMaxWidth?: boolean;
} & Omit<TextStyleProps, 'fontWeight' | 'fontStyle'> &
  Partial<Pick<TextStyleProps, 'fontWeight' | 'fontStyle'>>;

export class TextElementModel extends SurfaceElementModel<TextElementProps> {
  static override propsToY(props: Record<string, unknown>) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text as string);
    }

    return props;
  }

  override containedByBounds(bounds: Bound): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override getNearestPoint(point: IVec): IVec {
    return polygonNearestPoint(
      Bound.deserialize(this.xywh).points,
      point
    ) as IVec;
  }

  override hitTest(x: number, y: number): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return pointInPolygon([x, y], points);
  }

  override intersectWithLine(start: IVec, end: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  get type() {
    return 'text';
  }

  @yfield()
  accessor color: string = '#000000';

  @yfield()
  accessor fontFamily: FontFamily = FontFamily.Inter;

  @yfield()
  accessor fontSize: number = 16;

  @yfield<FontStyle, TextElementModel>(FontStyle.Normal)
  accessor fontStyle: FontStyle = FontStyle.Normal;

  @yfield<FontWeight, TextElementModel>(FontWeight.Regular)
  accessor fontWeight: FontWeight = FontWeight.Regular;

  @yfield(false)
  accessor hasMaxWidth: boolean = false;

  @yfield(0)
  accessor rotate: number = 0;

  @yfield()
  accessor text: Y.Text = new DocCollection.Y.Text();

  @yfield()
  accessor textAlign: TextAlign = TextAlign.Center;

  @yfield()
  accessor xywh: SerializedXYWH = '[0,0,16,16]';
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
