import type { HitTestOptions } from '../../root-block/edgeless/type.js';
import { DEFAULT_ROUGHNESS } from '../consts.js';
import { Bound } from '../utils/bound.js';
import { getBezierNearestPoint } from '../utils/curve.js';
import { getBezierParameters } from '../utils/curve.js';
import {
  linePolylineIntersects,
  polyLineNearestPoint,
} from '../utils/math-utils.js';
import { PointLocation } from '../utils/point-location.js';
import { type IVec2, Vec } from '../utils/vec.js';
import { type SerializedXYWH } from '../utils/xywh.js';
import { type BaseProps, ElementModel, StatelessModel } from './base.js';
import type { StrokeStyle } from './common.js';
import { derive, local, yfield } from './decorators.js';

export enum ConnectorEndpoint {
  Front = 'Front',
  Rear = 'Rear',
}

export type PointStyle = 'None' | 'Arrow' | 'Triangle' | 'Circle' | 'Diamond';

export const DEFAULT_FRONT_END_POINT_STYLE = 'None' as const;
export const DEFAULT_REAR_END_POINT_STYLE = 'Arrow' as const;

// at least one of id and position is not null
// both exists means the position is relative to the element
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
  updatingPath = false;

  get type() {
    return 'connector';
  }

  // @ts-ignore
  override get connectable() {
    return false as const;
  }

  @derive((path: PointLocation[], instance: ConnectorElementModel) => {
    const { x, y } = instance;

    return {
      absolutePath: path.map(p => p.clone().setVec([p[0] + x, p[1] + y])),
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

  override hitTest(
    x: number,
    y: number,
    options?: HitTestOptions | undefined
  ): boolean {
    const point =
      this.mode === ConnectorMode.Curve
        ? getBezierNearestPoint(getBezierParameters(this.absolutePath), [x, y])
        : polyLineNearestPoint(this.absolutePath, [x, y]);

    return (
      Vec.dist(point, [x, y]) < (options?.expand ? this.strokeWidth / 2 : 0) + 8
    );
  }

  override containedByBounds(bounds: Bound) {
    return this.absolutePath.some(point => bounds.containsPoint(point));
  }

  override getNearestPoint(point: IVec2): IVec2 {
    return polyLineNearestPoint(this.absolutePath, point) as IVec2;
  }

  override intersectWithLine(start: IVec2, end: IVec2) {
    return linePolylineIntersects(start, end, this.absolutePath);
  }

  override getRelativePointLocation(point: IVec2): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }

  override serialize() {
    const result = super.serialize();
    result.xywh = this.xywh;
    return result;
  }
}

export class StatelessConnectorElementModel extends StatelessModel {
  get type() {
    return 'connector';
  }

  private _path: PointLocation[] = [];

  seed: number = Math.random();

  id: string = '';

  updatingPath = false;

  get path(): PointLocation[] {
    return this._path;
  }

  set path(value: PointLocation[]) {
    const { x, y } = this;

    this.absolutePath = value.map(p => p.clone().setVec([p[0] + x, p[1] + y]));
    this._path = this.path;
  }

  absolutePath: PointLocation[] = [];

  xywh: SerializedXYWH = '[0,0,0,0]';

  rotate: number = 0;

  mode: ConnectorMode = ConnectorMode.Orthogonal;

  strokeWidth: number = 4;

  stroke: string = '#000000';

  strokeStyle: StrokeStyle = 'solid';

  roughness: number = DEFAULT_ROUGHNESS;

  rough?: boolean;

  source: Connection = {
    position: [0, 0],
  };

  target: Connection = {
    position: [0, 0],
  };

  frontEndpointStyle!: PointStyle;

  rearEndpointStyle!: PointStyle;
}
