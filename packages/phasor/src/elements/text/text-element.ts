import { assertExists } from '@blocksuite/global/utils';

import type { Renderer } from '../../renderer.js';
import { SurfaceElement } from '../surface-element.js';
import type { IText, ITextDelta } from './types.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeightInPx,
  getTextWidth,
  isRTL,
  wrapText,
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

  get containerId() {
    return this.yMap.get('containerId') as IText['containerId'];
  }

  get container() {
    if (!this.containerId) return;
    assertExists(this.surface);
    return this.surface.pickById(this.containerId);
  }

  override render(ctx: CanvasRenderingContext2D) {
    const { w, h, text, color, fontSize, fontFamily, textAlign } = this;

    const font = getFontString({
      fontSize: fontSize,
      fontFamily: fontFamily,
    });

    const yText = text;
    const deltas: ITextDelta[] = (yText.toDelta() as ITextDelta[]).map(
      delta => ({
        insert: wrapText(delta.insert, font, w),
        attributes: delta.attributes,
      })
    );
    const lines = deltaInsertsToChunks(deltas);

    const lineHeightPx = getLineHeightInPx(fontSize, 1.25);
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
    }

    // const rtl = isRTL(this.text);
    // const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
    // if (shouldTemporarilyAttach) {
    //   // to correctly render RTL text mixed with LTR, we have to append it
    //   // to the DOM
    //   document.body.appendChild(ctx.canvas);
    // }
    // ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    // ctx.save();
    // ctx.font = getFontString({
    //   fontSize: this.fontSize,
    //   fontFamily: this.fontFamily,
    // });
    // ctx.fillStyle = this.color;
    // ctx.textAlign = this.textAlign;

    // ctx.textBaseline = 'top';

    // const wrappedText = wrapText(this.text, this.fontFamily, this.w);
    // // Canvas does not support multiline text by default
    // const lines = wrappedText.replace(/\r\n?/g, '\n').split('\n');

    // const horizontalOffset =
    //   this.textAlign === 'center'
    //     ? this.w / 2
    //     : this.textAlign === 'right'
    //     ? this.w
    //     : 0;
    // const lineHeightPx = getLineHeightInPx(this.fontSize, this.lineHeight);
    // const verticalOffset = this.h / 2 - (lines.length * lineHeightPx) / 2;

    // for (let index = 0; index < lines.length; index++) {
    //   ctx.fillText(
    //     lines[index],
    //     horizontalOffset,
    //     index * lineHeightPx + verticalOffset
    //   );
    // }
    // ctx.restore();
    // if (shouldTemporarilyAttach) {
    //   ctx.canvas.remove();
    // }
  }

  private _onYMap = () => {
    // if (this.container) {
    //   const wrappedText = wrapText(this.text, this.fontFamily, this.w);
    //   const lines = wrappedText.replace(/\r\n?/g, '\n').split('\n');
    //   const lineHeightPx = getLineHeightInPx(this.fontSize, this.lineHeight);
    //   if (lines.length * lineHeightPx > this.h) {
    //     this.surface?.updateElement(this.container.id, {
    //       xywh: serializeXYWH(
    //         this.container.x,
    //         this.container.y,
    //         this.container.w,
    //         this.container.h + lineHeightPx * 2
    //       ),
    //     });
    //   }
    // }
  };

  override mount(renderer: Renderer) {
    super.mount(renderer);
    this.yMap.observeDeep(this._onYMap);
  }

  override unmount() {
    this.yMap.unobserveDeep(this._onYMap);
    super.unmount();
  }
}
