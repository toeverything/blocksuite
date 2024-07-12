import type { Y } from '@blocksuite/store';

import type {
  FontFamily,
  FontStyle,
  FontWeight,
  ShapeStyle,
  StrokeStyle,
  TextAlign,
  TextVerticalAlign,
} from '../../consts.js';
import type { CanvasElementType } from '../../element-model/index.js';
import type { ISurfaceElement } from '../surface-element.js';
import type { SHAPE_TEXT_FONT_SIZE, ShapeType } from './consts.js';

export interface IShape extends ISurfaceElement {
  color?: string;
  fillColor: string;
  filled: boolean;
  fontFamily?: FontFamily;
  fontSize?: SHAPE_TEXT_FONT_SIZE;
  fontStyle?: FontStyle;
  fontWeight?: FontWeight;
  radius: number;
  // https://github.com/rough-stuff/rough/wiki#roughness
  roughness?: number;
  shapeStyle: ShapeStyle;

  shapeType: ShapeType;
  strokeColor: string;
  strokeStyle: StrokeStyle;
  strokeWidth: number;
  text?: Y.Text;
  textAlign?: TextAlign;
  textHorizontalAlign?: TextAlign;
  textVerticalAlign?: TextVerticalAlign;
  type: CanvasElementType.SHAPE;

  // outdated, use `fontWeight` and `fontStyle` instead
  // bold?: boolean;
  // italic?: boolean;
}
