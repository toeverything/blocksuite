import type { Bound, IVec, PointLocation, SerializedXYWH } from '../index.js';
import type { SurfaceBlockComponent } from '../surface-block.js';
import type { IBrush } from './brush/types.js';
import type { IConnector } from './connector/types.js';
import type { IGroup } from './group/types.js';
import type { IShape } from './shape/types.js';
import type { IText } from './text/types.js';

export enum CanvasElementType {
  SHAPE = 'shape',
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  TEXT = 'text',
  GROUP = 'group',
}

export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}

export interface HitTestOptions {
  expand?: number;
  ignoreTransparent?: boolean;
  // we will select a shape without fill color by selecting its content area if
  // we set `pierce` to false, shape element used this options in `hitTest` method
  pierce?: boolean;
  all?: boolean;
}
export interface IEdgelessElement {
  xywh: SerializedXYWH;
  rotate: number;
  connectable: boolean;
  index: string;
  batch: string | null;
  gridBound: Bound;
  containedByBounds(bounds: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  hitTest(
    x: number,
    y: number,
    options: HitTestOptions,
    surface?: SurfaceBlockComponent
  ): boolean;
  boxSelect(bound: Bound): boolean;
}

export type ICanvasElementType = {
  shape: IShape;
  brush: IBrush;
  connector: IConnector;
  text: IText;
  group: IGroup;
};

export type IElementCreateProps<T extends keyof ICanvasElementType> = Partial<
  Omit<ICanvasElementType[T], 'id' | 'index' | 'seed'>
>;

export type IElementUpdateProps<T extends keyof ICanvasElementType> = Partial<
  Omit<ICanvasElementType[T], 'id' | 'index' | 'seed' | CanvasElementType>
>;

export type IElementDefaultProps<T extends keyof ICanvasElementType> =
  T extends 'connector'
    ? Omit<
        ICanvasElementType['connector'],
        | 'xywh'
        | 'id'
        | 'index'
        | 'seed'
        | 'path'
        | 'absolutePath'
        | 'controllers'
        | 'rotate'
        | 'batch'
      >
    : T extends 'frame'
      ? Omit<
          ICanvasElementType[T],
          'id' | 'index' | 'seed' | 'rotate' | 'batch'
        >
      : T extends 'group'
        ? Omit<
            ICanvasElementType[T],
            'id' | 'index' | 'seed' | 'rotate' | 'batch' | 'xywh'
          >
        : Omit<ICanvasElementType[T], 'id' | 'index' | 'seed' | 'batch'>;
