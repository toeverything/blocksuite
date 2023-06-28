import { StrokeStyle } from '../../consts.js';
import type { IElementDefaultProps } from '../index.js';
import { ConnectorMode } from './types.js';

export const ConnectorElementDefaultProps: IElementDefaultProps<'connector'> = {
  type: 'connector',
  xywh: '[0,0,0,0]',

  mode: ConnectorMode.Orthogonal,
  strokeWidth: 4,
  stroke: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: 2,
  controllers: [],
  source: {},
  target: {},
  path: [],
  absolutePath: [],
};
