import { StrokeStyle } from '../../consts.js';
import type { IElementDefaultProps } from '../index.js';
import { ConnectorMode } from './types.js';

export const ConnectorElementDefaultProps: IElementDefaultProps<'connector'> = {
  type: 'connector',
  xywh: '[0,0,0,0]',
  rotate: 0,
  flipX: 1,
  flipY: 1,

  mode: ConnectorMode.Orthogonal,
  lineWidth: 4,
  color: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: 2,
  controllers: [],
};
