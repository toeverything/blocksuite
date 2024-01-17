import { CanvasElementType } from '../../element-model/index.js';

export const BrushElementDefaultProps = {
  type: CanvasElementType.BRUSH,
  xywh: '[0,0,0,0]',

  rotate: 0,

  points: [],
  color: '#000000',
  lineWidth: 4,
};
