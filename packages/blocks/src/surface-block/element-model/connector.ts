import { DEFAULT_ROUGHNESS } from '../consts.js';
import type { PointLocation } from '../index.js';
import { type SerializedXYWH } from '../index.js';
import { Bound } from '../utils/bound.js';
import { Vec } from '../utils/vec.js';
import { type BaseProps, ElementModel } from './base.js';
import type { StrokeStyle } from './common.js';
import { derive, local, yfield } from './decorators.js';

export type PointStyle = 'None' | 'Arrow' | 'Triangle' | 'Circle' | 'Diamond';

export type Connection = {
  id?: string;
  position?: [number, number];
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

  // @ts-ignore
  override get connectable() {
    return false as const;
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

  moveTo(bound: Bound) {
    const oldBound = Bound.deserialize(this.xywh);
    const offset = Vec.sub([bound.x, bound.y], [oldBound.x, oldBound.y]);
    const { source, target } = this;

    if (!source.id && source.position) {
      this.source = {
        position: Vec.add(source.position, offset) as [number, number],
      };
    }

    if (!target.id && target.position) {
      this.target = {
        position: Vec.add(target.position, offset) as [number, number],
      };
    }
  }
}
