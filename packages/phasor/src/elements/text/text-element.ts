import type { IModelCoord } from '../../consts.js';
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
  charWidth,
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  isRTL,
  splitIntoLines,
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

  get bold() {
    return this.yMap.get('bold') as IText['bold'];
  }

  get italic() {
    return this.yMap.get('italic') as IText['italic'];
  }

  get font() {
    const { bold, italic, fontSize, fontFamily } = this;
    const lineHeight = getLineHeight(fontFamily, fontSize);
    return getFontString({
      bold,
      italic,
      fontSize,
      lineHeight: `${lineHeight}px`,
      fontFamily: fontFamily,
    });
  }

  getNearestPoint(point: IVec): IVec {
    return polygonNearestPoint(Bound.deserialize(this.xywh).points, point);
  }

  getCursorByCoord(coord: IModelCoord) {
    const { x, y, fontSize, fontFamily, text } = this;
    const lineHeight = getLineHeight(fontFamily, fontSize);
    const lineIndex = Math.floor((coord.y - y) / lineHeight);
    const lines = splitIntoLines(text.toString());
    const string = lines[lineIndex];
    const offsetX = coord.x - x;
    let index = lines.slice(0, lineIndex).join('').length + lineIndex - 1;
    let currentStringWidth = 0;
    let charIndex = 0;
    while (currentStringWidth < offsetX) {
      index += 1;
      if (string === '') {
        break;
      }
      currentStringWidth += charWidth.calculate(string[charIndex], this.font);
      charIndex += 1;
    }
    return index;
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
    const font = this.font;
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
        ctx.fillStyle = computedValue(color);
        ctx.textAlign = textAlign;

        ctx.textBaseline = 'ideographic';

        // 0.5 is a "magic number" used to align the text rendered on the canvas with the text in the DOM.
        // This approach is employed until a better or proper handling method is discovered.
        ctx.fillText(
          str,
          // 1 comes from v-line padding
          horizontalOffset + beforeTextWidth + 1,
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
