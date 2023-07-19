import { Bound } from '../../utils/bound.js';
import {
  getPointFromBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
} from '../../utils/math-utils.js';
import { PointLocation } from '../../utils/point-location.js';
import { type IVec } from '../../utils/vec.js';
import { SurfaceElement } from '../surface-element.js';
import type { IText, ITextDelta } from './types.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  isRTL,
} from './utils.js';

export class TextElement extends SurfaceElement<IText> {
  get text() {
    return this.yMap.get('text') as IText['text'];
  }

  get color() {
    return this.yMap.get('color') as IText['color'];
  }

  get fontSize() {
    return this.yMap.get('fontSize') as IText['fontSize'];
  }

  get fontFamily() {
    return this.yMap.get('fontFamily') as IText['fontFamily'];
  }

  get textAlign() {
    return this.yMap.get('textAlign') as IText['textAlign'];
  }

  get isBold() {
    return this.yMap.get('isBold') as IText['isBold'];
  }

  get isItalic() {
    return this.yMap.get('isItalic') as IText['isItalic'];
  }

  getNearestPoint(point: IVec): IVec {
    return polygonNearestPoint(Bound.deserialize(this.xywh).points, point);
  }

  override containedByBounds(bounds: Bound): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override intersectWithLine(start: IVec, end: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  override render(ctx: CanvasRenderingContext2D, matrix: DOMMatrix) {
    const {
      text,
      color,
      fontSize,
      fontFamily,
      textAlign,
      rotate,
      computedValue,
      isBold,
      isItalic,
    } = this;
    const [, , w, h] = this.deserializeXYWH();
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    const yText = text;
    const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
    const lines = deltaInsertsToChunks(deltas);

    const lineHeightPx = getLineHeight(fontFamily, fontSize);
    const font = getFontString({
      isBold,
      isItalic,
      fontSize: fontSize,
      lineHeight: `${lineHeightPx}px`,
      fontFamily: fontFamily,
    });

    for (const [lineIndex, line] of lines.entries()) {
      let beforeTextWidth = 0;

      for (const delta of line) {
        ctx.save();

        const str = delta.insert;
        const rtl = isRTL(str);
        const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
        if (shouldTemporarilyAttach) {
          // to correctly render RTL text mixed with LTR, we have to append it
          // to the DOM
          document.body.appendChild(ctx.canvas);
        }
        ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');
        ctx.font = font;
        ctx.fillStyle = computedValue(color);
        ctx.textAlign = textAlign;

        ctx.textBaseline = 'ideographic';

        // 0.5 is a "magic number" used to align the text rendered on the canvas with the text in the DOM.
        // This approach is employed until a better or proper handling method is discovered.
        ctx.fillText(
          str,
          // 1 comes from v-line padding
          beforeTextWidth + 1,
          (lineIndex + 1) * lineHeightPx + 0.5
        );

        beforeTextWidth += getTextWidth(str, font);

        if (shouldTemporarilyAttach) {
          ctx.canvas.remove();
        }

        ctx.restore();
      }
    }
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    const bound = Bound.deserialize(this.xywh);
    const rotatePoint = getPointFromBoundsWithRotation(
      this,
      bound.getRelativePoint(point)
    );
    const points = getPointsFromBoundsWithRotation(this);
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  }
}
