import { StrokeStyle } from '../../consts.js';
import { ConnectorMode, type IConnector } from './types.js';

export const ConnectorElementDefaultProps: Omit<IConnector, 'id' | 'index'> = {
  type: 'connector',
  xywh: '[0,0,0,0]',

  mode: ConnectorMode.Orthogonal,
  lineWidth: 4,
  color: '#000000',
  strokeStyle: StrokeStyle.Solid,
  controllers: [],
};
