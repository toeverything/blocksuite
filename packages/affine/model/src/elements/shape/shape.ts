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
  type Color,
  DEFAULT_ROUGHNESS,
  FontFamily,
  FontStyle,
  FontWeight,
  StrokeStyle,
  TextAlign,
  type TextStyleProps,
  TextVerticalAlign,
} from '@blocksuite/affine-model';
import {
  GfxPrimitiveElementModel,
  local,
  yfield,
} from '@blocksuite/block-std/gfx';
import { DocCollection, type Y } from '@blocksuite/store';

import type { ShapeStyle, ShapeType } from '../../utils/index.js';

import { ShapeTextFontSize, TextResizing } from '../../consts/index.js';
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

  get type() {
    return 'shape';
  }

  @yfield('#000000' as Color)
  accessor color!: Color;

  @yfield()
  accessor fillColor: Color = '--affine-palette-shape-yellow';

  @yfield()
  accessor filled: boolean = false;

  @yfield(FontFamily.Inter as string)
  accessor fontFamily!: string;

  @yfield(ShapeTextFontSize.MEDIUM)
  accessor fontSize!: number;

  @yfield(FontStyle.Normal as FontStyle)
  accessor fontStyle!: FontStyle;

  @yfield(FontWeight.Regular as FontWeight)
  accessor fontWeight!: FontWeight;

  @yfield(false as false | number)
  accessor maxWidth: false | number = false;

  @yfield([SHAPE_TEXT_VERTICAL_PADDING, SHAPE_TEXT_PADDING])
  accessor padding: [number, number] = [
    SHAPE_TEXT_VERTICAL_PADDING,
    SHAPE_TEXT_PADDING,
  ];

  @yfield()
  accessor radius: number = 0;

  @yfield(0)
  accessor rotate: number = 0;

  @yfield(DEFAULT_ROUGHNESS)
  accessor roughness: number = DEFAULT_ROUGHNESS;

  @yfield()
  accessor shadow: {
    blur: number;
    offsetX: number;
    offsetY: number;
    color: string;
  } | null = null;

  @yfield('General' as ShapeStyle)
  accessor shapeStyle: ShapeStyle = 'General';

  @yfield()
  accessor shapeType: ShapeType = 'rect';

  @yfield()
  accessor strokeColor: Color = '--affine-palette-line-yellow';

  @yfield()
  accessor strokeStyle: StrokeStyle = StrokeStyle.Solid;

  @yfield()
  accessor strokeWidth: number = 4;

  @yfield()
  accessor text: Y.Text | undefined = undefined;

  @yfield(TextAlign.Center as TextAlign)
  accessor textAlign!: TextAlign;

  @local()
  accessor textDisplay: boolean = true;

  @yfield(TextAlign.Center as TextAlign)
  accessor textHorizontalAlign!: TextAlign;

  @yfield(TextResizing.AUTO_HEIGHT as TextResizing)
  accessor textResizing: TextResizing = TextResizing.AUTO_HEIGHT;

  @yfield(TextVerticalAlign.Center as TextVerticalAlign)
  accessor textVerticalAlign!: TextVerticalAlign;

  @yfield()
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
