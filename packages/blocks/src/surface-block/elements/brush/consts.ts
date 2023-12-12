import {
  CanvasElementType,
  type IElementDefaultProps,
} from '../edgeless-element.js';

export const BrushElementDefaultProps: IElementDefaultProps<'brush'> = {
  type: CanvasElementType.BRUSH,
  xywh: '[0,0,0,0]',

  rotate: 0,

  points: [],
  color: '#000000',
  lineWidth: 4,
};
