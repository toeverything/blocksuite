import { DEFAULT_ROUGHNESS } from '../consts.js';
import type { PointLocation } from '../index.js';
import { type SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import type { StrokeStyle } from './common.js';
import { derive, local, yfield } from './decorators.js';

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

  @derive((instance: ConnectorElementModel) => {
    const { x, y } = instance;

    return {
      absolutePath: instance.path.map(p =>
        p.clone().setVec([p[0] + x, p[1] + y])
      ),
    };
  })
  @local()
  path: PointLocation[] = [];

  @local()
  absolutePath: PointLocation[] = [];

  @local()
  xywh: SerializedXYWH = '[0,0,0,0]';

  @local()
  rotate: number = 0;

  @yfield()
  mode: ConnectorMode = ConnectorMode.Orthogonal;

  @yfield()
  strokeWidth: number = 4;

  @yfield()
  stroke: string = '#000000';

  @yfield()
  strokeStyle: StrokeStyle = 'solid';

  @yfield()
  roughness: number = DEFAULT_ROUGHNESS;

  @yfield()
  rough?: boolean;

  @yfield()
  source: Connection = {
    position: [0, 0],
  };

  @yfield()
  target: Connection = {
    position: [0, 0],
  };

  @yfield('None')
  frontEndpointStyle!: PointStyle;

  @yfield('Arrow')
  rearEndpointStyle!: PointStyle;
}
