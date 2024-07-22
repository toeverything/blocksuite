import type { PointLocation } from '@blocksuite/global/utils';
import type { IVec } from '@blocksuite/global/utils';
import type { Bound } from '@blocksuite/global/utils';
import type { IBound } from '@blocksuite/global/utils';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import { DocCollection, type Y } from '@blocksuite/store';

import {
  DEFAULT_ROUGHNESS,
  FontFamily,
  FontStyle,
  FontWeight,
  StrokeStyle,
  TextAlign,
  TextResizing,
  type TextStyleProps,
  TextVerticalAlign,
} from '../consts.js';
import {
  type IBaseProps,
  type IHitTestOptions,
  SurfaceElementModel,
} from './base.js';
import { local, yfield } from './decorators.js';
import { diamond } from './utils/shape/diamond.js';
import { ellipse } from './utils/shape/ellipse.js';
import { rect } from './utils/shape/rect.js';
import { triangle } from './utils/shape/triangle.js';

export const shapeMethods: {
  [key in ShapeType]: typeof rect;
} = {
  rect,
  triangle,
  ellipse,
  diamond,
};

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';
export type ShapeStyle = 'General' | 'Scribbled';

export enum ShapeTextFontSize {
  LARGE = 28,
  MEDIUM = 20,
  SMALL = 12,
  XLARGE = 36,
}

export type ShapeProps = IBaseProps & {
  shapeType: ShapeType;
  radius: number;
  filled: boolean;
  fillColor: string;
  strokeWidth: number;
  strokeColor: string;
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

export class ShapeElementModel extends SurfaceElementModel<ShapeProps> {
  textBound: IBound | null = null;

  static override propsToY(props: ShapeProps) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text);
    }

    return props;
  }

  override containedByBounds(bounds: Bound) {
    return shapeMethods[this.shapeType].containedByBounds(bounds, this);
  }

  override getNearestPoint(point: IVec): IVec {
    return shapeMethods[this.shapeType].getNearestPoint(point, this) as IVec;
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return shapeMethods[this.shapeType].getRelativePointLocation(point, this);
  }

  override hitTest(x: number, y: number, options: IHitTestOptions) {
    return shapeMethods[this.shapeType].hitTest.call(this, x, y, {
      ...options,
      ignoreTransparent: options.ignoreTransparent ?? true,
    });
  }

  override intersectWithLine(start: IVec, end: IVec) {
    return shapeMethods[this.shapeType].intersectWithLine(start, end, this);
  }

  get type() {
    return 'shape';
  }

  @yfield('#000000')
  accessor color!: string;

  @yfield()
  accessor fillColor: string = '--affine-palette-shape-yellow';

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
  accessor strokeColor: string = '--affine-palette-line-yellow';

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
