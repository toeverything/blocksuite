import type {
  BaseElementProps,
  PointTestOptions,
  SerializedElement,
} from '@blocksuite/block-std/gfx';
import type { IVec, SerializedXYWH, XYWH } from '@blocksuite/global/utils';

import {
  GfxLocalElementModel,
  GfxPrimitiveElementModel,
  derive,
  local,
  yfield,
} from '@blocksuite/block-std/gfx';
import { Bound, PointLocation, Vec } from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';

import type { Color } from '../consts.js';

import {
  DEFAULT_ROUGHNESS,
  FontFamily,
  FontStyle,
  FontWeight,
  StrokeStyle,
  TextAlign,
  type TextStyleProps,
} from '../consts.js';
import {
  getBezierNearestPoint,
  getBezierNearestTime,
  getBezierParameters,
  getBezierPoint,
  intersects,
} from '../utils/curve.js';
import {
  linePolylineIntersects,
  polyLineNearestPoint,
} from '../utils/math-utils.js';
import { Polyline } from '../utils/polyline.js';

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
export const getConnectorModeName = (mode: ConnectorMode) => {
  return {
    [ConnectorMode.Straight]: 'Straight',
    [ConnectorMode.Orthogonal]: 'Orthogonal',
    [ConnectorMode.Curve]: 'Curve',
  }[mode];
};

export enum ConnectorLabelOffsetAnchor {
  Bottom = 'bottom',
  Center = 'center',
  Top = 'top',
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

export type ConnectorElementProps = BaseElementProps & {
  mode: ConnectorMode;
  stroke: Color;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness?: number;
  rough?: boolean;
  source: Connection;
  target: Connection;

  frontEndpointStyle?: PointStyle;
  rearEndpointStyle?: PointStyle;
} & ConnectorLabelProps;

export class ConnectorElementModel extends GfxPrimitiveElementModel<ConnectorElementProps> {
  updatingPath = false;

  static override propsToY(props: ConnectorElementProps) {
    if (props.text && !(props.text instanceof DocCollection.Y.Text)) {
      props.text = new DocCollection.Y.Text(props.text);
    }

    return props;
  }

  override containsBound(bounds: Bound) {
    return (
      this.absolutePath.some(point => bounds.containsPoint(point)) ||
      (this.hasLabel() &&
        Bound.fromXYWH(this.labelXYWH!).points.some(p =>
          bounds.containsPoint(p)
        ))
    );
  }

  override getLineIntersections(start: IVec, end: IVec) {
    const { mode, absolutePath: path } = this;

    let intersected = null;

    if (mode === ConnectorMode.Curve && path.length > 1) {
      intersected = intersects(path, [start, end]);
    } else {
      intersected = linePolylineIntersects(start, end, path);
    }

    if (!intersected && this.hasLabel()) {
      intersected = linePolylineIntersects(
        start,
        end,
        Bound.fromXYWH(this.labelXYWH!).points
      );
    }

    return intersected;
  }

  /**
   * Calculate the closest point on the curve via a point.
   */
  override getNearestPoint(point: IVec): IVec {
    const { mode, absolutePath: path } = this;

    if (mode === ConnectorMode.Straight) {
      const first = path[0];
      const last = path[path.length - 1];
      return Vec.nearestPointOnLineSegment(first, last, point, true);
    }

    if (mode === ConnectorMode.Orthogonal) {
      const points = path.map<IVec>(p => [p[0], p[1]]);
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
   * Calculating the computed distance along a path via a point.
   *
   * The point is relative to the viewport.
   */
  getOffsetDistanceByPoint(point: IVec, bounds?: Bound) {
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
      const points = path.map<IVec>(p => [p[0], p[1]]);
      const p = Polyline.nearestPoint(points, point);
      const pl = Polyline.lenAtPoint(points, p);
      const fl = Polyline.len(points);
      return pl / fl;
    }

    const b = getBezierParameters(path);
    return getBezierNearestTime(b, point);
  }

  /**
   * Calculating the computed point along a path via a offset distance.
   *
   * Returns a point relative to the viewport.
   */
  getPointByOffsetDistance(offsetDistance = 0.5, bounds?: Bound): IVec {
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
      const points = path.map<IVec>(p => [p[0], p[1]]);
      const point = Polyline.pointAt(points, offsetDistance);
      if (point) return point;
      return [x + w / 2, y + h / 2];
    }

    const b = getBezierParameters(path);
    const point = getBezierPoint(b, offsetDistance);
    if (point) return point;
    return [x + w / 2, y + h / 2];
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }

  hasLabel() {
    return Boolean(!this.lableEditing && this.labelDisplay && this.labelXYWH);
  }

  override includesPoint(
    x: number,
    y: number,
    options?: PointTestOptions | undefined
  ): boolean {
    const currentPoint: IVec = [x, y];

    if (this.labelIncludesPoint(currentPoint as IVec)) {
      return true;
    }

    const { mode, strokeWidth, absolutePath: path } = this;

    const point =
      mode === ConnectorMode.Curve
        ? getBezierNearestPoint(getBezierParameters(path), currentPoint)
        : polyLineNearestPoint(path, currentPoint);

    return (
      Vec.dist(point, currentPoint) <
      (options?.expand ? strokeWidth / 2 : 0) + 8
    );
  }

  labelIncludesPoint(point: IVec) {
    return (
      this.hasLabel() && Bound.fromXYWH(this.labelXYWH!).isPointInBound(point)
    );
  }

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

  resize(bounds: Bound, originalPath: PointLocation[], matrix: DOMMatrix) {
    this.updatingPath = false;

    const path = this.resizePath(originalPath, matrix);

    // the property assignment order matters
    this.xywh = bounds.serialize();
    this.path = path.map(p => p.clone().setVec(Vec.sub(p, bounds.tl)));

    const props: {
      labelXYWH?: XYWH;
      source?: Connection;
      target?: Connection;
    } = {};

    // Updates Connector's Label position.
    if (this.hasLabel()) {
      const [cx, cy] = this.getPointByOffsetDistance(this.labelOffset.distance);
      const [, , w, h] = this.labelXYWH!;
      props.labelXYWH = [cx - w / 2, cy - h / 2, w, h];
    }

    if (!this.source.id) {
      props.source = {
        ...this.source,
        position: path[0].toVec() as [number, number],
      };
    }
    if (!this.target.id) {
      props.target = {
        ...this.target,
        position: path[path.length - 1].toVec() as [number, number],
      };
    }

    return props;
  }

  resizePath(originalPath: PointLocation[], matrix: DOMMatrix) {
    if (this.mode === ConnectorMode.Curve) {
      return originalPath.map(point => {
        const [p, t, absIn, absOut] = [
          point,
          point.tangent,
          point.absIn,
          point.absOut,
        ]
          .map(p => new DOMPoint(...p).matrixTransform(matrix))
          .map(p => [p.x, p.y] as IVec);
        const ip = Vec.sub(absIn, p);
        const op = Vec.sub(absOut, p);
        return new PointLocation(p, t, ip, op);
      });
    }

    return originalPath.map(point => {
      const { x, y } = new DOMPoint(...point).matrixTransform(matrix);
      const p: IVec = [x, y];
      return PointLocation.fromVec(p);
    });
  }

  override serialize() {
    const result = super.serialize();
    result.xywh = this.xywh;
    return result as SerializedConnectorElement;
  }

  // @ts-ignore
  override get connectable() {
    return false as const;
  }

  get connected() {
    return !!(this.source.id || this.target.id);
  }

  override get elementBound() {
    let bounds = super.elementBound;
    if (this.hasLabel()) {
      bounds = bounds.unite(Bound.fromXYWH(this.labelXYWH!));
    }
    return bounds;
  }

  get type() {
    return 'connector';
  }

  @local()
  accessor absolutePath: PointLocation[] = [];

  @yfield('None' as PointStyle)
  accessor frontEndpointStyle!: PointStyle;

  /**
   * Defines the size constraints of the label.
   */
  @yfield({
    hasMaxWidth: true,
    maxWidth: CONNECTOR_LABEL_MAX_WIDTH,
  } as ConnectorLabelConstraintsProps)
  accessor labelConstraints!: ConnectorLabelConstraintsProps;

  /**
   * Control display and hide.
   */
  @yfield(true)
  accessor labelDisplay!: boolean;

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
   * Returns a `XYWH` array providing information about the size of a label
   * and its position relative to the viewport.
   */
  @yfield()
  accessor labelXYWH: XYWH | undefined = undefined;

  /**
   * Local control display and hide, mainly used in editing scenarios.
   */
  @local()
  accessor lableEditing: boolean = false;

  @yfield()
  accessor mode: ConnectorMode = ConnectorMode.Orthogonal;

  @derive((path: PointLocation[], instance: ConnectorElementModel) => {
    const { x, y } = instance;

    return {
      absolutePath: path.map(p => p.clone().setVec(Vec.add(p, [x, y]))),
    };
  })
  @local()
  accessor path: PointLocation[] = [];

  @yfield('Arrow' as PointStyle)
  accessor rearEndpointStyle!: PointStyle;

  @local()
  accessor rotate: number = 0;

  @yfield()
  accessor rough: boolean | undefined = undefined;

  @yfield()
  accessor roughness: number = DEFAULT_ROUGHNESS;

  @yfield()
  accessor source: Connection = {
    position: [0, 0],
  };

  @yfield()
  accessor stroke: Color = '#000000';

  @yfield()
  accessor strokeStyle: StrokeStyle = StrokeStyle.Solid;

  @yfield()
  accessor strokeWidth: number = 4;

  @yfield()
  accessor target: Connection = {
    position: [0, 0],
  };

  /**
   * The content of the label.
   */
  @yfield()
  accessor text: Y.Text | undefined = undefined;

  @local()
  accessor xywh: SerializedXYWH = '[0,0,0,0]';
}

export class LocalConnectorElementModel extends GfxLocalElementModel {
  private _path: PointLocation[] = [];

  absolutePath: PointLocation[] = [];

  frontEndpointStyle!: PointStyle;

  id: string = '';

  mode: ConnectorMode = ConnectorMode.Orthogonal;

  rearEndpointStyle!: PointStyle;

  rotate: number = 0;

  rough?: boolean;

  roughness: number = DEFAULT_ROUGHNESS;

  seed: number = Math.random();

  source: Connection = {
    position: [0, 0],
  };

  stroke: Color = '#000000';

  strokeStyle: StrokeStyle = StrokeStyle.Solid;

  strokeWidth: number = 4;

  target: Connection = {
    position: [0, 0],
  };

  updatingPath = false;

  xywh: SerializedXYWH = '[0,0,0,0]';

  get path(): PointLocation[] {
    return this._path;
  }

  set path(value: PointLocation[]) {
    const { x, y } = this;

    this._path = value;
    this.absolutePath = value.map(p => p.clone().setVec([p[0] + x, p[1] + y]));
  }

  get type() {
    return 'connector';
  }
}

export function isConnectorWithLabel(
  model: BlockSuite.EdgelessModel | BlockSuite.SurfaceLocalModel
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
    interface EdgelessTextModelMap {
      connector: ConnectorElementModel;
    }
  }
}
