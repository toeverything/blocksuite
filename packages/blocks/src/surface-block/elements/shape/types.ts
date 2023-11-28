import type { Y } from '@blocksuite/store';

import type {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
  IBound,
  ShapeStyle,
  StrokeStyle,
} from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import type { Bound } from '../../utils/bound.js';
import type { PointLocation } from '../../utils/point-location.js';
import type { IVec } from '../../utils/vec.js';
import type { CanvasElementType, HitTestOptions } from '../edgeless-element.js';
import type {
  ISurfaceElement,
  ISurfaceElementLocalRecord,
} from '../surface-element.js';
import type { SHAPE_TEXT_FONT_SIZE } from './consts.js';
import type { ShapeElement } from './shape-element.js';

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';

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
  fontFamily?: CanvasTextFontFamily;
  fontWeight?: CanvasTextFontWeight;
  fontStyle?: CanvasTextFontStyle;
  textAlign?: 'left' | 'center' | 'right';
  textHorizontalAlign?: 'left' | 'center' | 'right';
  textVerticalAlign?: 'top' | 'center' | 'bottom';

  // outdated, use `fontWeight` and `fontStyle` instead
  // bold?: boolean;
  // italic?: boolean;
}

export interface IShapeLocalRecord extends ISurfaceElementLocalRecord {
  // used to control the render of the shape text because we
  // need to hide the text in canvas when we are editing the text
  textDisplay?: boolean;
}

export interface ShapeMethods {
  render: (
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    element: ShapeElement
  ) => void;
  hitTest: (
    this: ShapeElement,
    x: number,
    y: number,
    options: HitTestOptions
  ) => boolean;
  containedByBounds: (bounds: Bound, element: ShapeElement) => boolean;
  intersectWithLine: (
    start: IVec,
    end: IVec,
    element: ShapeElement
  ) => PointLocation[] | null;
  getNearestPoint: (point: IVec, element: ShapeElement) => IVec;
  getRelativePointLocation: (
    point: IVec,
    element: ShapeElement
  ) => PointLocation;
  points: (bound: IBound) => IVec[];
}
