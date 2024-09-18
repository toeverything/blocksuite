import type { BaseElementProps } from '@blocksuite/block-std/gfx';
import type { IVec, SerializedXYWH } from '@blocksuite/global/utils';

import { field, GfxPrimitiveElementModel } from '@blocksuite/block-std/gfx';
import {
  Bound,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonNearestPoint,
} from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';

import {
  type Color,
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../../consts/index.js';

export type TextElementProps = BaseElementProps & {
  text: Y.Text;
  hasMaxWidth?: boolean;
} & Omit<TextStyleProps, 'fontWeight' | 'fontStyle'> &
  Partial<Pick<TextStyleProps, 'fontWeight' | 'fontStyle'>>;

export class TextElementModel extends GfxPrimitiveElementModel<TextElementProps> {
  get type() {
    return 'text';
  }

  static override propsToY(props: Record<string, unknown>) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text as string);
    }

    return props;
  }

  override containsBound(bounds: Bound): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override getLineIntersections(start: IVec, end: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  override getNearestPoint(point: IVec): IVec {
    return polygonNearestPoint(
      Bound.deserialize(this.xywh).points,
      point
    ) as IVec;
  }

  override includesPoint(x: number, y: number): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return pointInPolygon([x, y], points);
  }

  @field()
  accessor color: Color = '#000000';

  @field()
  accessor fontFamily: FontFamily = FontFamily.Inter;

  @field()
  accessor fontSize: number = 16;

  @field(FontStyle.Normal as FontStyle)
  accessor fontStyle: FontStyle = FontStyle.Normal;

  @field(FontWeight.Regular as FontWeight)
  accessor fontWeight: FontWeight = FontWeight.Regular;

  @field(false)
  accessor hasMaxWidth: boolean = false;

  @field(0)
  accessor rotate: number = 0;

  @field()
  accessor text: Y.Text = new DocCollection.Y.Text();

  @field()
  accessor textAlign: TextAlign = TextAlign.Center;

  @field()
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
