import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import {
  CanvasElementType,
  type IElementDefaultProps,
} from '../edgeless-element.js';
import { ConnectorMode } from './types.js';

export const ConnectorElementDefaultProps: IElementDefaultProps<'connector'> = {
  type: CanvasElementType.CONNECTOR,
  mode: ConnectorMode.Orthogonal,
  strokeWidth: 4,
  stroke: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: DEFAULT_ROUGHNESS,
  source: {},
  target: {},
};
