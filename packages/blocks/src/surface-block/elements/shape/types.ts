import type { Y } from '@blocksuite/store';

import type {
  CanvasTextFontFamilyValueType,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
  ShapeStyle,
  StrokeStyle,
} from '../../consts.js';
import type { CanvasElementType } from '../../element-model/index.js';
import type { TextAlign, TextVerticalAlign } from '../consts.js';
import type { ISurfaceElement } from '../surface-element.js';
import type { SHAPE_TEXT_FONT_SIZE, ShapeType } from './consts.js';

export interface IShape extends ISurfaceElement {
  type: CanvasElementType.SHAPE;
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
  fontSize?: SHAPE_TEXT_FONT_SIZE;
  fontFamily?: CanvasTextFontFamilyValueType;
  fontWeight?: CanvasTextFontWeight;
  fontStyle?: CanvasTextFontStyle;
  textAlign?: TextAlign;
  textHorizontalAlign?: TextAlign;
  textVerticalAlign?: TextVerticalAlign;

  // outdated, use `fontWeight` and `fontStyle` instead
  // bold?: boolean;
  // italic?: boolean;
}
