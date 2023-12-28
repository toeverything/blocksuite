import { Workspace, type Y } from '@blocksuite/store';

import { DEFAULT_ROUGHNESS } from '../consts.js';
import { type BaseProps, ElementModel } from './base.js';
import { type FontStyle, FontWeight } from './common.js';
import { FontFamily, type StrokeStyle } from './common.js';

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
  static override default() {
    return {
      xywh: '[0,0,10,10]',
      rotate: 0,
      shapeType: 'rect',
      shapeStyle: 'General',
      radius: 0,
      filled: false,
      fillColor: '#ffffff',
      strokeWidth: 4,
      strokeColor: '#000000',
      strokeStyle: 'solid',
      roughness: DEFAULT_ROUGHNESS,
    } as ShapeProps;
  }

  static override propsToYStruct(props: ShapeProps) {
    if (props.text && !(props.text instanceof Workspace.Y.Text)) {
      props.text = new Workspace.Y.Text(props.text);
    }

    return props;
  }

  override get type() {
    return 'shape';
  }

  get shapeType() {
    const shapeType = this.yMap.get('shapeType') as ShapeProps['shapeType'];
    return shapeType;
  }

  get radius() {
    const radius = this.yMap.get('radius') as ShapeProps['radius'];
    return radius;
  }

  get filled() {
    const filled = this.yMap.get('filled') as ShapeProps['filled'];
    return filled;
  }

  get fillColor() {
    const fillColor = this.yMap.get('fillColor') as ShapeProps['fillColor'];
    return fillColor;
  }

  get strokeWidth() {
    const strokeWidth = this.yMap.get(
      'strokeWidth'
    ) as ShapeProps['strokeWidth'];
    return strokeWidth;
  }

  get strokeColor() {
    const strokeColor = this.yMap.get(
      'strokeColor'
    ) as ShapeProps['strokeColor'];
    return strokeColor;
  }

  get strokeStyle() {
    const strokeStyle = this.yMap.get(
      'strokeStyle'
    ) as ShapeProps['strokeStyle'];
    return strokeStyle;
  }

  get shapeStyle() {
    const shapeStyle = this.yMap.get('shapeStyle') as ShapeProps['shapeStyle'];
    return shapeStyle;
  }

  get text() {
    const text = this.yMap.get('text') as ShapeProps['text'];
    return text;
  }

  get color() {
    const color = (this.yMap.get('color') as ShapeProps['color']) ?? '#000000';
    return color;
  }

  get fontSize() {
    const fontSize =
      (this.yMap.get('fontSize') as ShapeProps['fontSize']) ??
      ShapeTextFontSize.MEDIUM;
    return fontSize;
  }

  get fontFamily() {
    const fontFamily =
      (this.yMap.get('fontFamily') as ShapeProps['fontFamily']) ??
      FontFamily.Inter;
    return fontFamily;
  }

  get fontWeight() {
    return (
      (this.yMap.get('fontWeight') as ShapeProps['fontWeight']) ??
      FontWeight.Regular
    );
  }

  get fontStyle() {
    return (this.yMap.get('fontStyle') as ShapeProps['fontStyle']) ?? 'normal';
  }

  get textAlign() {
    const textAlign =
      (this.yMap.get('textAlign') as ShapeProps['textAlign']) ?? 'center';
    return textAlign;
  }

  get textHorizontalAlign() {
    const textHorizontalAlign =
      (this.yMap.get(
        'textHorizontalAlign'
      ) as ShapeProps['textHorizontalAlign']) ?? 'center';
    return textHorizontalAlign;
  }

  get textVerticalAlign() {
    const textVerticalAlign =
      (this.yMap.get('textVerticalAlign') as ShapeProps['textVerticalAlign']) ??
      'center';
    return textVerticalAlign;
  }
}
