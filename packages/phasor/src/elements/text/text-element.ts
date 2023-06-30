import { Bound } from '../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonNearestPoint,
} from '../../utils/math-utils.js';
import { type IVec } from '../../utils/vec.js';
import { SurfaceElement } from '../surface-element.js';
import type { IText, ITextDelta } from './types.js';
import {
  deltaInsertsToChunks,
  getFontString,
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
    const { text, color, fontSize, fontFamily, textAlign, rotate } = this;
    const [, , w, h] = this.deserializeXYWH();
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    const yText = text;
    const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
    const lines = deltaInsertsToChunks(deltas);

    const lineHeightPx = h / lines.length;
    const font = getFontString({
      fontSize: fontSize,
      lineHeight: `${lineHeightPx}px`,
      fontFamily: fontFamily,
    });
    const horizontalOffset =
      textAlign === 'center' ? w / 2 : textAlign === 'right' ? w : 0;

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
        ctx.fillStyle = this.computedValue(color);
        ctx.textAlign = textAlign;

        ctx.textBaseline = 'ideographic';

        ctx.fillText(
          str,
          horizontalOffset + beforeTextWidth,
          (lineIndex + 1) * lineHeightPx
        );

        beforeTextWidth += getTextWidth(str, fontFamily);

        if (shouldTemporarilyAttach) {
          ctx.canvas.remove();
        }

        ctx.restore();
      }
    }
  }
}
