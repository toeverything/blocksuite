import { Overlay, PathGenerator } from '@blocksuite/affine-block-surface';
import { ConnectorMode, LayoutType } from '@blocksuite/affine-model';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import {
  type Bound,
  isVecZero,
  type IVec,
  PointLocation,
  toRadian,
  Vec,
} from '@blocksuite/global/utils';

export class MindMapIndicatorOverlay extends Overlay {
  static INDICATOR_SIZE = [48, 22];

  static override overlayName: string = 'mindmap-indicator';

  direction: LayoutType.LEFT | LayoutType.RIGHT = LayoutType.RIGHT;

  mode: ConnectorMode = ConnectorMode.Straight;

  parentBound: Bound | null = null;

  pathGen = new PathGenerator();

  targetBound: Bound | null = null;

  get themeService() {
    return this.gfx.std.get(ThemeProvider);
  }

  private _generatePath() {
    const startRelativePos =
      this.direction === LayoutType.RIGHT
        ? PointLocation.fromVec([1, 0.5])
        : PointLocation.fromVec([0, 0.5]);
    const endRelativePos =
      this.direction === LayoutType.RIGHT
        ? PointLocation.fromVec([0, 0.5])
        : PointLocation.fromVec([1, 0.5]);
    const { parentBound, targetBound: newPosBound } = this;

    if (this.mode === ConnectorMode.Orthogonal) {
      return this.pathGen
        .generateOrthogonalConnectorPath({
          startPoint: this._getRelativePoint(parentBound!, startRelativePos),
          endPoint: this._getRelativePoint(newPosBound!, endRelativePos),
          startBound: parentBound,
          endBound: newPosBound,
        })
        .map(p => new PointLocation(p));
    } else if (this.mode === ConnectorMode.Curve) {
      const startPoint = this._getRelativePoint(
        this.parentBound!,
        startRelativePos
      );
      const endPoint = this._getRelativePoint(
        this.targetBound!,
        endRelativePos
      );

      const startTangentVertical = Vec.rot(startPoint.tangent, -Math.PI / 2);
      startPoint.out = Vec.mul(
        startTangentVertical,
        Math.max(
          100,
          Math.abs(
            Vec.pry(Vec.sub(endPoint, startPoint), startTangentVertical)
          ) / 3
        )
      );

      const endTangentVertical = Vec.rot(endPoint.tangent, -Math.PI / 2);
      endPoint.in = Vec.mul(
        endTangentVertical,
        Math.max(
          100,
          Math.abs(Vec.pry(Vec.sub(startPoint, endPoint), endTangentVertical)) /
            3
        )
      );

      return [startPoint, endPoint];
    } else {
      const startPoint = new PointLocation(
        this.parentBound!.getRelativePoint(startRelativePos)
      );
      const endPoint = new PointLocation(
        this.targetBound!.getRelativePoint(endRelativePos)
      );

      return [startPoint, endPoint];
    }
  }

  private _getRelativePoint(bound: Bound, position: IVec) {
    const location = new PointLocation(
      bound.getRelativePoint(position as IVec)
    );

    if (isVecZero(Vec.sub(position, [0, 0.5])))
      location.tangent = Vec.rot([0, -1], toRadian(0));
    else if (isVecZero(Vec.sub(position, [1, 0.5])))
      location.tangent = Vec.rot([0, 1], toRadian(0));
    else if (isVecZero(Vec.sub(position, [0.5, 0])))
      location.tangent = Vec.rot([1, 0], toRadian(0));
    else if (isVecZero(Vec.sub(position, [0.5, 1])))
      location.tangent = Vec.rot([-1, 0], toRadian(0));

    return location;
  }

  override clear() {
    this.targetBound = null;
    this.parentBound = null;
  }

  override render(ctx: CanvasRenderingContext2D): void {
    if (!this.parentBound || !this.targetBound) {
      return;
    }

    const targetPos = this.targetBound;
    const points = this._generatePath();
    const color = this.themeService.getColorValue(
      '--affine-primary-color',
      '#1E96EB',
      true
    );

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.roundRect(targetPos.x, targetPos.y, targetPos.w, targetPos.h, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);

    if (this.mode === ConnectorMode.Curve) {
      points.forEach((point, idx) => {
        if (idx === 0) return;
        const last = points[idx - 1];
        ctx.bezierCurveTo(
          last.absOut[0],
          last.absOut[1],
          point.absIn[0],
          point.absIn[1],
          point[0],
          point[1]
        );
      });
    } else {
      points.forEach((point, idx) => {
        if (idx === 0) return;
        ctx.lineTo(point[0], point[1]);
      });
    }

    ctx.stroke();
    ctx.closePath();
  }
}
