import { Bound } from '../../utils/bound.js';
import { linePolygonIntersects } from '../../utils/math-utils.js';
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

  override intersectWithLine(start: IVec, end: IVec): boolean {
    return !!linePolygonIntersects(
      start,
      end,
      Bound.deserialize(this.xywh).points
    );
  }

  override render(ctx: CanvasRenderingContext2D, matrix: DOMMatrix) {
    const {
      text,
      color,
      fontSize,
      fontFamily,
      textAlign,
      rotate,
      flipX,
      flipY,
      widthAndHeight: [w, h],
    } = this;
    const cx = w / 2;
    const cy = h / 2;

    matrix = matrix.translate(cx, cy).rotate(rotate);
    if (flipX < 0) {
      matrix = matrix.flipX();
    }
    if (flipY < 0) {
      matrix = matrix.flipY();
    }
    ctx.setTransform(matrix.translate(-cx, -cy));

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
