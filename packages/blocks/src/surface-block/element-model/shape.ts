import { DocCollection, type Y } from '@blocksuite/store';

import type { HitTestOptions } from '../../root-block/edgeless/type.js';
import { DEFAULT_ROUGHNESS } from '../consts.js';
import type { IBound, SerializedXYWH } from '../index.js';
import type { Bound } from '../utils/bound.js';
import type { PointLocation } from '../utils/point-location.js';
import { type IVec2 } from '../utils/vec.js';
import { type BaseProps, ElementModel } from './base.js';
import { FontFamily, FontWeight, TextResizing } from './common.js';
import {
  type FontStyle,
  type StrokeStyle,
  type TextAlign,
  type VerticalAlign,
} from './common.js';
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
  SMALL = 12,
  MEDIUM = 20,
  LARGE = 28,
  XLARGE = 36,
}

export type ShapeProps = BaseProps & {
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
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textAlign?: TextAlign;
  textHorizontalAlign?: TextAlign;
  textVerticalAlign?: VerticalAlign;
  textResizing?: TextResizing;
  maxWidth?: false | number;
};

export class ShapeElementModel extends ElementModel<ShapeProps> {
  static override propsToY(props: ShapeProps) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text);
    }

    return props;
  }

  get type() {
    return 'shape';
  }

  @local()
  accessor textDisplay: boolean = true;

  @yfield()
  accessor xywh: SerializedXYWH = '[0,0,100,100]';

  @yfield(0)
  accessor rotate: number = 0;

  @yfield()
  accessor shapeType: ShapeType = 'rect';

  @yfield()
  accessor radius: number = 0;

  @yfield()
  accessor filled: boolean = false;

  @yfield()
  accessor fillColor: string = '--affine-palette-shape-yellow';

  @yfield()
  accessor strokeWidth: number = 4;

  @yfield()
  accessor strokeColor: string = '--affine-palette-line-yellow';

  @yfield()
  accessor strokeStyle: StrokeStyle = 'solid';

  @yfield('General' as ShapeStyle)
  accessor shapeStyle: ShapeStyle = 'General';

  @yfield(DEFAULT_ROUGHNESS)
  accessor roughness: number = DEFAULT_ROUGHNESS;

  @yfield()
  accessor text: Y.Text | undefined = undefined;

  @yfield('#000000')
  accessor color!: string;

  @yfield(ShapeTextFontSize.MEDIUM)
  accessor fontSize!: number;

  @yfield(FontFamily.Inter as string)
  accessor fontFamily!: string;

  @yfield(FontWeight.Regular as FontWeight)
  accessor fontWeight!: FontWeight;

  @yfield('normal' as FontStyle)
  accessor fontStyle!: FontStyle;

  @yfield('center' as TextAlign)
  accessor textAlign!: TextAlign;

  @yfield('center' as TextAlign)
  accessor textHorizontalAlign!: TextAlign;

  @yfield('center' as VerticalAlign)
  accessor textVerticalAlign!: VerticalAlign;

  @yfield(TextResizing.AUTO_HEIGHT as TextResizing)
  accessor textResizing: TextResizing = TextResizing.AUTO_HEIGHT;

  @yfield(false as false | number)
  accessor maxWidth: false | number = false;

  textBound: IBound | null = null;

  override hitTest(x: number, y: number, options: HitTestOptions) {
    return shapeMethods[this.shapeType].hitTest.call(this, x, y, {
      ...options,
      ignoreTransparent: options.ignoreTransparent ?? true,
    });
  }

  override containedByBounds(bounds: Bound) {
    return shapeMethods[this.shapeType].containedByBounds(bounds, this);
  }

  override intersectWithLine(start: IVec2, end: IVec2) {
    return shapeMethods[this.shapeType].intersectWithLine(start, end, this);
  }

  override getNearestPoint(point: IVec2): IVec2 {
    return shapeMethods[this.shapeType].getNearestPoint(point, this) as IVec2;
  }

  override getRelativePointLocation(point: IVec2): PointLocation {
    return shapeMethods[this.shapeType].getRelativePointLocation(point, this);
  }
}
