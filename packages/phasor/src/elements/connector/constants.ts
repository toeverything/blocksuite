import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import type { IElementDefaultProps } from '../index.js';
import { ConnectorMode } from './types.js';

export const ConnectorElementDefaultProps: IElementDefaultProps<'connector'> = {
  type: 'connector',
  mode: ConnectorMode.Orthogonal,
  strokeWidth: 4,
  stroke: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: DEFAULT_ROUGHNESS,
  source: {},
  target: {},
};
