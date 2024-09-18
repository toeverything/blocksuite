import type {
  BaseElementProps,
  PointTestOptions,
} from '@blocksuite/block-std/gfx';
import type {
  Bound,
  IBound,
  IVec,
  PointLocation,
  SerializedXYWH,
} from '@blocksuite/global/utils';

import {
  field,
  GfxPrimitiveElementModel,
  local,
} from '@blocksuite/block-std/gfx';
import { DocCollection, type Y } from '@blocksuite/store';

import {
  type Color,
  DEFAULT_ROUGHNESS,
  FontFamily,
  FontStyle,
  FontWeight,
  LineColor,
  ShapeFillColor,
  ShapeStyle,
  ShapeTextFontSize,
  ShapeType,
  StrokeStyle,
  TextAlign,
  TextResizing,
  type TextStyleProps,
  TextVerticalAlign,
} from '../../consts/index.js';
import { shapeMethods } from './api/index.js';

export type ShapeProps = BaseElementProps & {
  shapeType: ShapeType;
  radius: number;
  filled: boolean;
  fillColor: Color;
  strokeWidth: number;
  strokeColor: Color;
  strokeStyle: StrokeStyle;
  shapeStyle: ShapeStyle;
  // https://github.com/rough-stuff/rough/wiki#roughness
  roughness?: number;

  text?: Y.Text;
  textHorizontalAlign?: TextAlign;
  textVerticalAlign?: TextVerticalAlign;
  textResizing?: TextResizing;
  maxWidth?: false | number;
} & Partial<TextStyleProps>;

export const SHAPE_TEXT_PADDING = 20;
export const SHAPE_TEXT_VERTICAL_PADDING = 10;

export class ShapeElementModel extends GfxPrimitiveElementModel<ShapeProps> {
  textBound: IBound | null = null;

  get type() {
    return 'shape';
  }

  static override propsToY(props: ShapeProps) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text);
    }

    return props;
  }

  override containsBound(bounds: Bound) {
    return shapeMethods[this.shapeType].containsBound(bounds, this);
  }

  override getLineIntersections(start: IVec, end: IVec) {
    return shapeMethods[this.shapeType].getLineIntersections(start, end, this);
  }

  override getNearestPoint(point: IVec): IVec {
    return shapeMethods[this.shapeType].getNearestPoint(point, this) as IVec;
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return shapeMethods[this.shapeType].getRelativePointLocation(point, this);
  }

  override includesPoint(x: number, y: number, options: PointTestOptions) {
    return shapeMethods[this.shapeType].includesPoint.call(this, x, y, {
      ...options,
      ignoreTransparent: options.ignoreTransparent ?? true,
    });
  }

  @field('#000000' as Color)
  accessor color!: Color;

  @field()
  accessor fillColor: Color = ShapeFillColor.Yellow;

  @field()
  accessor filled: boolean = false;

  @field(FontFamily.Inter as string)
  accessor fontFamily!: string;

  @field(ShapeTextFontSize.MEDIUM)
  accessor fontSize!: number;

  @field(FontStyle.Normal as FontStyle)
  accessor fontStyle!: FontStyle;

  @field(FontWeight.Regular as FontWeight)
  accessor fontWeight!: FontWeight;

  @field(false as false | number)
  accessor maxWidth: false | number = false;

  @field([SHAPE_TEXT_VERTICAL_PADDING, SHAPE_TEXT_PADDING])
  accessor padding: [number, number] = [
    SHAPE_TEXT_VERTICAL_PADDING,
    SHAPE_TEXT_PADDING,
  ];

  @field()
  accessor radius: number = 0;

  @field(0)
  accessor rotate: number = 0;

  @field(DEFAULT_ROUGHNESS)
  accessor roughness: number = DEFAULT_ROUGHNESS;

  @field()
  accessor shadow: {
    blur: number;
    offsetX: number;
    offsetY: number;
    color: string;
  } | null = null;

  @field()
  accessor shapeStyle: ShapeStyle = ShapeStyle.General;

  @field()
  accessor shapeType: ShapeType = ShapeType.Rect;

  @field()
  accessor strokeColor: Color = LineColor.Yellow;

  @field()
  accessor strokeStyle: StrokeStyle = StrokeStyle.Solid;

  @field()
  accessor strokeWidth: number = 4;

  @field()
  accessor text: Y.Text | undefined = undefined;

  @field(TextAlign.Center as TextAlign)
  accessor textAlign!: TextAlign;

  @local()
  accessor textDisplay: boolean = true;

  @field(TextAlign.Center as TextAlign)
  accessor textHorizontalAlign!: TextAlign;

  @field(TextResizing.AUTO_HEIGHT as TextResizing)
  accessor textResizing: TextResizing = TextResizing.AUTO_HEIGHT;

  @field(TextVerticalAlign.Center as TextVerticalAlign)
  accessor textVerticalAlign!: TextVerticalAlign;

  @field()
  accessor xywh: SerializedXYWH = '[0,0,100,100]';
}

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {
      shape: ShapeElementModel;
    }

    interface EdgelessTextModelMap {
      shape: ShapeElementModel;
    }
  }
}
