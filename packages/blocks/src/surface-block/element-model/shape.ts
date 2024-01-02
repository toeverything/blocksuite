import { Workspace, type Y } from '@blocksuite/store';

import { DEFAULT_ROUGHNESS } from '../consts.js';
import type { SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import type { FontWeight } from './common.js';
import { type FontStyle } from './common.js';
import { type StrokeStyle } from './common.js';
import { ymap } from './decorators.js';

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
  textAlign?: 'left' | 'center' | 'right';
  textHorizontalAlign?: 'left' | 'center' | 'right';
  textVerticalAlign?: 'top' | 'center' | 'bottom';
};

export class ShapeElementModel extends ElementModel<ShapeProps> {
  static override propsToYStruct(props: ShapeProps) {
    if (props.text && !(props.text instanceof Workspace.Y.Text)) {
      props.text = new Workspace.Y.Text(props.text);
    }

    return props;
  }

  @ymap()
  xywh: SerializedXYWH = '[0,0,100,100]';

  @ymap()
  rotate: number = 0;

  @ymap()
  shapeType: ShapeType = 'rect';

  @ymap()
  radius: number = 0;

  @ymap()
  filled: boolean = false;

  @ymap()
  fillColor: string = '--affine-palette-shape-yellow';

  @ymap()
  strokeWidth: number = 4;

  @ymap()
  strokeColor: string = '--affine-palette-line-yellow';

  @ymap()
  strokeStyle: StrokeStyle = 'solid';

  @ymap()
  shapeStyle: ShapeStyle = 'General';

  @ymap()
  roughness: number = DEFAULT_ROUGHNESS;

  @ymap()
  text?: Y.Text;

  @ymap()
  color?: string;

  @ymap()
  fontSize?: number;

  @ymap()
  fontFamily?: string;

  @ymap()
  fontWeight?: FontWeight;

  @ymap()
  fontStyle?: FontStyle;

  @ymap()
  textAlign?: 'left' | 'center' | 'right';

  @ymap()
  textHorizontalAlign?: 'left' | 'center' | 'right';

  @ymap()
  textVerticalAlign?: 'top' | 'center' | 'bottom';

  get type() {
    return 'shape';
  }
}
