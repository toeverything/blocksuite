import { SurfaceElement } from '../surface-element.js';
import type { IText, ITextDelta } from './types.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeightInPx,
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

  private _maxTextWidth = 0;
  private _maxTextHeight = 0;

  override get minWidth() {
    return this._maxTextWidth;
  }

  override get minHeight() {
    return this._maxTextHeight;
  }

  private _lineHeight = 0;
  private _lines: ITextDelta[][] = [];

  get lineHeight() {
    return this._lineHeight;
  }

  get lines() {
    return this._lines;
  }

  override render(ctx: CanvasRenderingContext2D) {
    const { w, h, text, color, fontSize, fontFamily, textAlign } = this;

    const font = getFontString({
      fontSize: fontSize,
      fontFamily: fontFamily,
    });

    const yText = text;
    const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
    const lines = deltaInsertsToChunks(deltas);
    this._lines = lines;

    const lineHeightPx = getLineHeightInPx(fontSize, 1.5);
    this._lineHeight = lineHeightPx;
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
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;

        ctx.textBaseline = 'top';

        const verticalOffset =
          h / 2 - (lines.length * lineHeightPx) / 2 + lineIndex * lineHeightPx;

        ctx.fillText(str, horizontalOffset + beforeTextWidth, verticalOffset);

        beforeTextWidth += getTextWidth(str, fontFamily);

        if (shouldTemporarilyAttach) {
          ctx.canvas.remove();
        }

        ctx.restore();
      }

      if (beforeTextWidth > this._maxTextWidth) {
        this._maxTextWidth = beforeTextWidth;
      }
    }

    if (this._maxTextHeight < lines.length * lineHeightPx) {
      this._maxTextHeight = lines.length * lineHeightPx;
    }
  }
}
