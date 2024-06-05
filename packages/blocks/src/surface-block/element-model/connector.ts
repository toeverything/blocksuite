import { DocCollection, type Y } from '@blocksuite/store';

import {
  DEFAULT_ROUGHNESS,
  FontFamily,
  FontStyle,
  FontWeight,
  StrokeStyle,
  TextAlign,
  type TextStyleProps,
} from '../consts.js';
import { Bound } from '../utils/bound.js';
import {
  getBezierNearestPoint,
  getBezierNearestTime,
  getBezierParameters,
  getBezierPoint,
} from '../utils/curve.js';
import {
  linePolylineIntersects,
  polyLineNearestPoint,
} from '../utils/math-utils.js';
import { PointLocation } from '../utils/point-location.js';
import { Polyline } from '../utils/polyline.js';
import { type IVec2, Vec } from '../utils/vec.js';
import type { SerializedXYWH, XYWH } from '../utils/xywh.js';
import {
  type IBaseProps,
  type IHitTestOptions,
  type SerializedElement,
  SurfaceElementModel,
  SurfaceLocalModel,
} from './base.js';
import { derive, local, yfield } from './decorators.js';

export enum ConnectorEndpoint {
  Front = 'Front',
  Rear = 'Rear',
}

export type PointStyle = 'None' | 'Arrow' | 'Triangle' | 'Circle' | 'Diamond';

export const DEFAULT_FRONT_END_POINT_STYLE = 'None' as const;
export const DEFAULT_REAR_END_POINT_STYLE = 'Arrow' as const;
export const CONNECTOR_LABEL_MAX_WIDTH = 280;

export type SerializedConnection = {
  id?: string;
  position?: `[${number},${number}]` | PointLocation;
};

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

export enum ConnectorLabelOffsetAnchor {
  Top = 'top',
  Center = 'center',
  Bottom = 'bottom',
}

export type ConnectorLabelOffsetProps = {
  // [0, 1], `0.5` by default
  distance: number;
  // `center` by default
  anchor?: ConnectorLabelOffsetAnchor;
};

export type ConnectorLabelConstraintsProps = {
  hasMaxWidth: boolean;
  maxWidth: number;
};

export type ConnectorLabelProps = {
  // Label's content
  text?: Y.Text;
  labelEditing?: boolean;
  labelDisplay?: boolean;
  labelXYWH?: XYWH;
  labelOffset?: ConnectorLabelOffsetProps;
  labelStyle?: TextStyleProps;
  labelConstraints?: ConnectorLabelConstraintsProps;
};

export type SerializedConnectorElement = SerializedElement & {
  source: SerializedConnection;
  target: SerializedConnection;
};

type ConnectorElementProps = IBaseProps & {
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
} & ConnectorLabelProps;

export class ConnectorElementModel extends SurfaceElementModel<ConnectorElementProps> {
  static override propsToY(props: ConnectorElementProps) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text);
    }

    return props;
  }

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
  accessor path: PointLocation[] = [];

  @local()
  accessor absolutePath: PointLocation[] = [];

  @local()
  accessor xywh: SerializedXYWH = '[0,0,0,0]';

  @local()
  accessor rotate: number = 0;

  @yfield()
  accessor mode: ConnectorMode = ConnectorMode.Orthogonal;

  @yfield()
  accessor strokeWidth: number = 4;

  @yfield()
  accessor stroke: string = '#000000';

  @yfield()
  accessor strokeStyle: StrokeStyle = StrokeStyle.Solid;

  @yfield()
  accessor roughness: number = DEFAULT_ROUGHNESS;

  @yfield()
  accessor rough: boolean | undefined = undefined;

  @yfield()
  accessor source: Connection = {
    position: [0, 0],
  };

  @yfield()
  accessor target: Connection = {
    position: [0, 0],
  };

  @yfield('None' as PointStyle)
  accessor frontEndpointStyle!: PointStyle;

  @yfield('Arrow' as PointStyle)
  accessor rearEndpointStyle!: PointStyle;

  /**
   * The content of the label.
   */
  @yfield()
  accessor text: Y.Text | undefined = undefined;

  /**
   * Local control display and hide, mainly used in editing scenarios.
   */
  @local()
  accessor lableEditing: boolean = false;

  /**
   * Control display and hide.
   */
  @yfield(true)
  accessor labelDisplay!: boolean;

  /**
   * Returns a `XYWH` array providing information about the size of a label
   * and its position relative to the viewport.
   */
  @yfield()
  accessor labelXYWH: XYWH | undefined = undefined;

  /**
   * The offset property specifies the label along the connector path.
   */
  @yfield({
    distance: 0.5,
    anchor: ConnectorLabelOffsetAnchor.Center,
  } as ConnectorLabelOffsetProps)
  accessor labelOffset!: ConnectorLabelOffsetProps;

  /**
   * Defines the style of the label.
   */
  @yfield({
    color: '#000000',
    fontFamily: FontFamily.Inter,
    fontSize: 16,
    fontStyle: FontStyle.Normal,
    fontWeight: FontWeight.Regular,
    textAlign: TextAlign.Center,
  } as TextStyleProps)
  accessor labelStyle!: TextStyleProps;

  /**
   * Defines the size constraints of the label.
   */
  @yfield({
    hasMaxWidth: true,
    maxWidth: CONNECTOR_LABEL_MAX_WIDTH,
  } as ConnectorLabelConstraintsProps)
  accessor labelConstraints!: ConnectorLabelConstraintsProps;

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

    // Updates Connector's Label position.
    if (this.hasLabel()) {
      const [x, y, w, h] = this.labelXYWH!;
      this.labelXYWH = [x + offset[0], y + offset[1], w, h];
    }
  }

  hasLabel() {
    return Boolean(!this.lableEditing && this.labelDisplay && this.labelXYWH);
  }

  labelHitTest(point: IVec2) {
    return (
      this.hasLabel() && Bound.fromXYWH(this.labelXYWH!).isPointInBound(point)
    );
  }

  override get elementBound() {
    let bounds = super.elementBound;
    if (this.hasLabel()) {
      bounds = bounds.unite(Bound.fromXYWH(this.labelXYWH!));
    }
    return bounds;
  }

  override hitTest(
    x: number,
    y: number,
    options?: IHitTestOptions | undefined
  ): boolean {
    const currentPoint = [x, y];

    if (this.labelHitTest(currentPoint as IVec2)) {
      return true;
    }

    const point =
      this.mode === ConnectorMode.Curve
        ? getBezierNearestPoint(
            getBezierParameters(this.absolutePath),
            currentPoint
          )
        : polyLineNearestPoint(this.absolutePath, currentPoint);

    return (
      Vec.dist(point, currentPoint) <
      (options?.expand ? this.strokeWidth / 2 : 0) + 8
    );
  }

  override containedByBounds(bounds: Bound) {
    return (
      this.absolutePath.some(point => bounds.containsPoint(point)) ||
      (this.hasLabel() &&
        Bound.fromXYWH(this.labelXYWH!).points.some(p =>
          bounds.containsPoint(p)
        ))
    );
  }

  override intersectWithLine(start: IVec2, end: IVec2) {
    let intersected = linePolylineIntersects(start, end, this.absolutePath);

    if (!intersected && this.hasLabel()) {
      intersected = linePolylineIntersects(
        start,
        end,
        Bound.fromXYWH(this.labelXYWH!).points
      );
    }

    return intersected;
  }

  override getRelativePointLocation(point: IVec2): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }

  override serialize() {
    const result = super.serialize();
    result.xywh = this.xywh;
    return result as SerializedConnectorElement;
  }

  /**
   * Calculate the closest point on the curve via a point.
   */
  override getNearestPoint(point: IVec2) {
    const { mode, absolutePath: path } = this;

    if (mode === ConnectorMode.Straight) {
      const first = path[0];
      const last = path[path.length - 1];
      return Vec.nearestPointOnLineSegment(first, last, point, true);
    }

    if (mode === ConnectorMode.Orthogonal) {
      const points = path.map<IVec2>(p => [p[0], p[1]]);
      return Polyline.nearestPoint(points, point);
    }

    const b = getBezierParameters(path);
    const t = getBezierNearestTime(b, point);
    const p = getBezierPoint(b, t);
    if (p) return p;

    const { x, y } = this;
    return [x, y];
  }

  /**
   * Calculating the computed point along a path via a offset distance.
   *
   * Returns a point relative to the viewport.
   */
  getPointByOffsetDistance(offsetDistance = 0.5, bounds?: Bound) {
    const { mode, absolutePath: path } = this;

    if (mode === ConnectorMode.Straight) {
      const first = path[0];
      const last = path[path.length - 1];
      return Vec.lrp(first, last, offsetDistance);
    }

    let { x, y, w, h } = this;
    if (bounds) {
      x = bounds.x;
      y = bounds.y;
      w = bounds.w;
      h = bounds.h;
    }

    if (mode === ConnectorMode.Orthogonal) {
      const points = path.map<IVec2>(p => [p[0], p[1]]);
      const point = Polyline.pointAt(points, offsetDistance);
      if (point) return point;
      return [x + w / 2, y + h / 2];
    }

    const b = getBezierParameters(path);
    const point = getBezierPoint(b, offsetDistance);
    if (point) return point;
    return [x + w / 2, y + h / 2];
  }

  /**
   * Calculating the computed distance along a path via a point.
   *
   * The point is relative to the viewport.
   */
  getOffsetDistanceByPoint(point: IVec2, bounds?: Bound) {
    const { mode, absolutePath: path } = this;

    let { x, y, w, h } = this;
    if (bounds) {
      x = bounds.x;
      y = bounds.y;
      w = bounds.w;
      h = bounds.h;
    }

    point[0] = Vec.clamp(point[0], x, x + w);
    point[1] = Vec.clamp(point[1], y, y + h);

    if (mode === ConnectorMode.Straight) {
      const s = path[0];
      const e = path[path.length - 1];
      const pl = Vec.dist(s, point);
      const fl = Vec.dist(s, e);
      return pl / fl;
    }

    if (mode === ConnectorMode.Orthogonal) {
      const points = path.map<IVec2>(p => [p[0], p[1]]);
      const p = Polyline.nearestPoint(points, point);
      const pl = Polyline.lenAtPoint(points, p);
      const fl = Polyline.len(points);
      return pl / fl;
    }

    const b = getBezierParameters(path);
    return getBezierNearestTime(b, point);
  }
}

export class LocalConnectorElementModel extends SurfaceLocalModel {
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

    this._path = value;
    this.absolutePath = value.map(p => p.clone().setVec([p[0] + x, p[1] + y]));
  }

  absolutePath: PointLocation[] = [];

  xywh: SerializedXYWH = '[0,0,0,0]';

  rotate: number = 0;

  mode: ConnectorMode = ConnectorMode.Orthogonal;

  strokeWidth: number = 4;

  stroke: string = '#000000';

  strokeStyle: StrokeStyle = StrokeStyle.Solid;

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

export function isConnectorWithLabel(
  model: SurfaceElementModel | SurfaceLocalModel
) {
  return model instanceof ConnectorElementModel && model.hasLabel();
}

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {
      connector: ConnectorElementModel;
    }
    interface SurfaceLocalModelMap {
      connector: LocalConnectorElementModel;
    }
  }
}
