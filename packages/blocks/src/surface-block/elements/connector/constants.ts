import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import {
  type IElementDefaultProps,
  PhasorElementType,
} from '../edgeless-element.js';
import { ConnectorMode } from './types.js';

export const ConnectorElementDefaultProps: IElementDefaultProps<'connector'> = {
  type: PhasorElementType.CONNECTOR,
  mode: ConnectorMode.Orthogonal,
  strokeWidth: 4,
  stroke: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: DEFAULT_ROUGHNESS,
  source: {},
  target: {},
};
