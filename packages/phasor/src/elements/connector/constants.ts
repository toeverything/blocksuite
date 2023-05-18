import { StrokeStyle } from '../../consts.js';
import type { ElementDefaultProps } from '../index.js';
import { ConnectorMode } from './types.js';

export const ConnectorElementDefaultProps: ElementDefaultProps<'connector'> = {
  type: 'connector',
  xywh: '[0,0,0,0]',

  mode: ConnectorMode.Orthogonal,
  lineWidth: 4,
  color: '#000000',
  strokeStyle: StrokeStyle.Solid,
  controllers: [],
};
