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
