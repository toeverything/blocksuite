import {
  CanvasTextFontStyle,
  CanvasTextFontWeight,
  type IModelCoord,
} from '../../consts.js';
import { Bound } from '../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../../utils/math-utils.js';
import { PointLocation } from '../../utils/point-location.js';
import { type IVec } from '../../utils/vec.js';
import { SurfaceElement } from '../surface-element.js';
import type { IText, ITextDelta, ITextLocalRecord } from './types.js';
import {
  charWidth,
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  isRTL,
  wrapText,
} from './utils.js';

export class TextElement extends SurfaceElement<IText> {
  get text() {
    return this.yMap.get('text') as IText['text'];
  }

  override getRelativePointLocation(relativePoint: IVec): PointLocation {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      this.rotate ?? 0
    )[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate ?? 0);
    const tangent = polygonGetPointTangent(points, rotatePoint);

    return new PointLocation(rotatePoint, tangent);
  }

  get color() {
    return this.yMap.get('color') as IText['color'];
  }

  get fontSize() {
    return (
      (this.localRecord as ITextLocalRecord)?.fontSize ??
      (this.yMap.get('fontSize') as IText['fontSize'])
    );
  }

  get fontFamily() {
    return this.yMap.get('fontFamily') as IText['fontFamily'];
  }

  get fontWeight() {
    return (
      (this.yMap.get('fontWeight') as IText['fontWeight']) ??
      CanvasTextFontWeight.Regular
    );
  }

  get fontStyle() {
    return (
      (this.yMap.get('fontStyle') as IText['fontStyle']) ??
      CanvasTextFontStyle.Normal
    );
  }

  get textAlign() {
    return this.yMap.get('textAlign') as IText['textAlign'];
  }

  get hasMaxWidth() {
    return (
      (this.localRecord as ITextLocalRecord)?.hasMaxWidth ??
      (this.yMap.get('hasMaxWidth') as IText['hasMaxWidth'])
    );
  }

  get font() {
    const { fontStyle, fontWeight, fontSize, fontFamily } = this;
    return getFontString({
      fontStyle,
      fontWeight,
      fontSize,
      fontFamily,
    });
  }

  get wrapTextDeltas() {
    const { text, font, w } = this;

    const deltas: ITextDelta[] = (text.toDelta() as ITextDelta[]).flatMap(
      delta => ({
        insert: wrapText(delta.insert, font, w),
        attributes: delta.attributes,
      })
    ) as ITextDelta[];

    return deltas;
  }

  getTextCursorPosition(coord: IModelCoord) {
    const leftTop = getPointsFromBoundsWithRotation(this)[0];
    const mousePos = rotatePoints(
      [[coord.x, coord.y]],
      leftTop,
      -this.rotate
    )[0];

    return [
      Math.floor(
        (mousePos[1] - leftTop[1]) /
          getLineHeight(this.fontFamily, this.fontSize)
      ),
      mousePos[0] - leftTop[0],
    ];
  }

  override getNearestPoint(point: IVec): IVec {
    return polygonNearestPoint(Bound.deserialize(this.xywh).points, point);
  }

  getCursorByCoord(coord: IModelCoord) {
    const [lineIndex, offsetX] = this.getTextCursorPosition(coord);

    const deltas = this.wrapTextDeltas;
    const lines = deltaInsertsToChunks(deltas).map(line =>
      line.map(iTextDelta => iTextDelta.insert).join('')
    );
    const string = lines[lineIndex];

    let index = lines.slice(0, lineIndex).join('').length - 1;
    let currentStringWidth = 0;
    let charIndex = 0;
    while (currentStringWidth < offsetX) {
      index += 1;
      if (charIndex === string.length) {
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

  override hitTest(x: number, y: number): boolean {
    const points = getPointsFromBoundsWithRotation(this);
    return pointInPolygon([x, y], points);
  }

  override render(ctx: CanvasRenderingContext2D, matrix: DOMMatrix) {
    const { color, fontSize, fontFamily, textAlign, rotate, computedValue } =
      this;
    const [, , w, h] = this.deserializeXYWH();
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    // const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
    const font = this.font;
    // const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
    const deltas = this.wrapTextDeltas;
    const lines = deltaInsertsToChunks(deltas);

    const lineHeightPx = getLineHeight(fontFamily, fontSize);
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
}
