import { DEFAULT_ROUGHNESS } from '../consts.js';
import type { SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import type { StrokeStyle } from './common.js';
import { local, ymap } from './decorators.js';

export type PointStyle = 'None' | 'Arrow' | 'Triangle' | 'Circle' | 'Diamond';

export type Connection = {
  id?: string;
  position: [number, number];
};

export enum ConnectorMode {
  Straight,
  Orthogonal,
  Curve,
}

type ConnectorElementProps = BaseProps & {
  mode: ConnectorMode;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness?: number;
  rough?: boolean;
  source: Connection;
  target: Connection;

  frontEndpointStyle?: PointStyle;
  rearEndpointStyle?: PointStyle;
};

export class ConnectorElementModel extends ElementModel<ConnectorElementProps> {
  get type() {
    return 'connector';
  }

  @local()
  xywh: SerializedXYWH = '[0,0,0,0]';

  @local()
  rotate: number = 0;

  @ymap()
  mode: ConnectorMode = ConnectorMode.Orthogonal;

  @ymap()
  strokeWidth: number = 4;

  @ymap()
  stroke: string = '#000000';

  @ymap()
  strokeStyle: StrokeStyle = 'solid';

  @ymap()
  roughness: number = DEFAULT_ROUGHNESS;

  @ymap()
  rough?: boolean;

  @ymap()
  source: Connection = {
    position: [0, 0],
  };

  @ymap()
  target: Connection = {
    position: [0, 0],
  };

  @ymap()
  frontEndpointStyle?: PointStyle;

  @ymap()
  rearEndpointStyle?: PointStyle;
}
