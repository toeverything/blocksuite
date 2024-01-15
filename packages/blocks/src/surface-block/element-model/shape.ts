import { Workspace, type Y } from '@blocksuite/store';

import { DEFAULT_ROUGHNESS } from '../consts.js';
import type { SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import { FontFamily, FontWeight } from './common.js';
import {
  type FontStyle,
  type StrokeStyle,
  type TextAlign,
  type VerticalAlign,
} from './common.js';
import { local, yfield } from './decorators.js';

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
};

export class ShapeElementModel extends ElementModel<ShapeProps> {
  static override propsToY(props: ShapeProps) {
    if (props.text && !(props.text instanceof Workspace.Y.Text)) {
      props.text = new Workspace.Y.Text(props.text);
    }

    return props;
  }

  get type() {
    return 'shape';
  }

  @local()
  textDisplay: boolean = true;

  @yfield()
  xywh: SerializedXYWH = '[0,0,100,100]';

  @yfield()
  rotate: number = 0;

  @yfield()
  shapeType: ShapeType = 'rect';

  @yfield()
  radius: number = 0;

  @yfield()
  filled: boolean = false;

  @yfield()
  fillColor: string = '--affine-palette-shape-yellow';

  @yfield()
  strokeWidth: number = 4;

  @yfield()
  strokeColor: string = '--affine-palette-line-yellow';

  @yfield()
  strokeStyle: StrokeStyle = 'solid';

  @yfield()
  shapeStyle: ShapeStyle = 'General';

  @yfield()
  roughness: number = DEFAULT_ROUGHNESS;

  @yfield()
  text?: Y.Text;

  @yfield('#000000')
  color!: string;

  @yfield(ShapeTextFontSize.MEDIUM)
  fontSize!: number;

  @yfield(FontFamily.Inter)
  fontFamily!: string;

  @yfield(FontWeight.Regular)
  fontWeight!: FontWeight;

  @yfield('normal')
  fontStyle!: FontStyle;

  @yfield('center')
  textAlign!: TextAlign;

  @yfield('center')
  textHorizontalAlign!: TextAlign;

  @yfield('center')
  textVerticalAlign!: VerticalAlign;
}
