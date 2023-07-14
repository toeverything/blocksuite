import { DEFAULT_ROUGHNESS } from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import type { Bound } from '../../utils/bound.js';
import { isPointIn } from '../../utils/math-utils.js';
import type { PointLocation } from '../../utils/point-location.js';
import type { IVec } from '../../utils/vec.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import type { ITextDelta } from '../text/types.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  isRTL,
  wrapText,
} from '../text/utils.js';
import { SHAPE_TEXT_FONT_SIZE, SHAPE_TEXT_PADDING } from './constants.js';
import { ShapeMethodsMap } from './shapes/index.js';
import type { IShape, IShapeLocalRecord } from './types.js';

export class ShapeElement extends SurfaceElement<IShape, IShapeLocalRecord> {
  get shapeType() {
    const shapeType = this.yMap.get('shapeType') as IShape['shapeType'];
    return shapeType;
  }

  get radius() {
    const radius = this.yMap.get('radius') as IShape['radius'];
    return radius;
  }

  get filled() {
    const filled = this.yMap.get('filled') as IShape['filled'];
    return filled;
  }

  get fillColor() {
    const fillColor = this.yMap.get('fillColor') as IShape['fillColor'];
    return fillColor;
  }

  get strokeWidth() {
    const strokeWidth = this.yMap.get('strokeWidth') as IShape['strokeWidth'];
    return strokeWidth;
  }

  get strokeColor() {
    const strokeColor = this.yMap.get('strokeColor') as IShape['strokeColor'];
    return strokeColor;
  }

  get strokeStyle() {
    const strokeStyle = this.yMap.get('strokeStyle') as IShape['strokeStyle'];
    return strokeStyle;
  }

  get roughness() {
    const roughness =
      (this.yMap.get('roughness') as IShape['roughness']) ?? DEFAULT_ROUGHNESS;
    return roughness;
  }

  get realStrokeColor() {
    return this.computedValue(this.strokeColor);
  }

  get realFillColor() {
    return this.computedValue(this.fillColor);
  }

  get text() {
    const text = this.yMap.get('text') as IShape['text'];
    return text;
  }

  get color() {
    const color = (this.yMap.get('color') as IShape['color']) ?? '#000000';
    return color;
  }

  get fontSize() {
    const fontSize =
      (this.yMap.get('fontSize') as IShape['fontSize']) ??
      SHAPE_TEXT_FONT_SIZE.MEDIUM;
    return fontSize;
  }

  get fontFamily() {
    const fontFamily =
      (this.yMap.get('fontFamily') as IShape['fontFamily']) ??
      "'Kalam', cursive";
    return fontFamily;
  }

  get textAlign() {
    const textAlign =
      (this.yMap.get('textAlign') as IShape['textAlign']) ?? 'center';
    return textAlign;
  }

  get textHorizontalAlign() {
    const textHorizontalAlign =
      (this.yMap.get('textHorizontalAlign') as IShape['textHorizontalAlign']) ??
      'center';
    return textHorizontalAlign;
  }

  get textVerticalAlign() {
    const textVerticalAlign =
      (this.yMap.get('textVerticalAlign') as IShape['textVerticalAlign']) ??
      'center';
    return textVerticalAlign;
  }

  override hitTest(x: number, y: number, options: HitTestOptions) {
    const pierce = options.pierce ?? true;
    if (!pierce) {
      return isPointIn(this, x, y);
    }

    const { hitTest } = ShapeMethodsMap[this.shapeType];
    options.ignoreTransparent = options.ignoreTransparent ?? true;
    return hitTest.apply(this, [x, y, options]);
  }

  override containedByBounds(bounds: Bound) {
    return ShapeMethodsMap[this.shapeType].containedByBounds(bounds, this);
  }

  override intersectWithLine(start: IVec, end: IVec) {
    return ShapeMethodsMap[this.shapeType].intersectWithLine(start, end, this);
  }

  override getNearestPoint(point: IVec): IVec {
    return ShapeMethodsMap[this.shapeType].getNearestPoint(point, this);
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return ShapeMethodsMap[this.shapeType].getRelativePointLocation(
      point,
      this
    );
  }

  override render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas
  ) {
    const { render } = ShapeMethodsMap[this.shapeType];
    render(ctx, matrix, rc, this);
    const record = this.getLocalRecord();
    if (record?.textDisplay ?? true) {
      this._renderText(ctx);
    }
  }

  private _renderText(ctx: CanvasRenderingContext2D) {
    const {
      w,
      text,
      color,
      fontSize,
      fontFamily,
      textVerticalAlign,
      textAlign,
      textHorizontalAlign,
    } = this;
    if (!text) return;

    const lineHeight = getLineHeight(fontFamily, fontSize);
    const font = getFontString({
      fontSize: fontSize,
      lineHeight: `${lineHeight}px`,
      fontFamily: fontFamily,
    });

    const yText = text;
    const deltas: ITextDelta[] = (yText.toDelta() as ITextDelta[]).flatMap(
      delta => ({
        insert: wrapText(delta.insert, font, w - SHAPE_TEXT_PADDING * 2),
        attributes: delta.attributes,
      })
    ) as ITextDelta[];
    const lines = deltaInsertsToChunks(deltas);

    const horizontalOffset =
      textHorizontalAlign === 'center'
        ? w / 2
        : textHorizontalAlign === 'right'
        ? w - SHAPE_TEXT_PADDING
        : SHAPE_TEXT_PADDING;
    const verticalOffset =
      textVerticalAlign === 'center'
        ? (this.h - lineHeight * lines.length) / 2
        : textVerticalAlign === 'top'
        ? SHAPE_TEXT_PADDING
        : this.h - lineHeight * lines.length - SHAPE_TEXT_PADDING;

    for (const [lineIndex, line] of lines.entries()) {
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
          horizontalOffset - 2,
          // 1.5 is a "magic number" used to align the text rendered on the canvas with the text in the DOM.
          // This approach is employed until a better or proper handling method is discovered.
          (lineIndex + 1) * lineHeight + verticalOffset - 1.5
        );

        if (shouldTemporarilyAttach) {
          ctx.canvas.remove();
        }

        ctx.restore();
      }
    }
  }
}
