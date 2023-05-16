import { assertExists } from '@blocksuite/global/utils';
import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import type { Renderer } from '../../renderer.js';
import {
  deserializeXYWH,
  type SerializedXYWH,
  serializeXYWH,
} from '../../utils/xywh.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import { ShapeMethodsMap } from './shapes/index.js';
import type { IShape } from './types.js';

function transformShapeXYWH(xywh: SerializedXYWH): SerializedXYWH {
  const [x, y, w, h] = deserializeXYWH(xywh);
  return serializeXYWH(x + 0.3 * w, y + 0.05 * h, 0.4 * w, 0.9 * h);
}

export class ShapeElement extends SurfaceElement<IShape> {
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

  get realStrokeColor() {
    return this.transformPropertyValue(this.strokeColor);
  }

  get realFillColor() {
    return this.transformPropertyValue(this.fillColor);
  }

  get textId() {
    const textId = this.yMap.get('textId') as IShape['textId'];
    return textId;
  }

  get text() {
    if (!this.textId) return;
    assertExists(this.surface);
    return this.surface.pickById(this.textId);
  }

  override hitTest(x: number, y: number, options?: HitTestOptions) {
    const { hitTest } = ShapeMethodsMap[this.shapeType];
    return hitTest(x, y, this, options);
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas) {
    const { render } = ShapeMethodsMap[this.shapeType];
    render(ctx, rc, this);
  }

  private _onYMap = () => {
    if (this.textId) {
      this.surface?.updateElement(this.textId, {
        xywh: transformShapeXYWH(this.xywh),
      });
    }
  };

  override mount(renderer: Renderer) {
    super.mount(renderer);
    this.yMap.observeDeep(this._onYMap);
  }

  override unmount() {
    this.yMap.unobserveDeep(this._onYMap);
    super.unmount();
  }

  updateText(text: string) {
    if (this.textId) {
      this.surface?.updateElement<'text'>(this.textId, {
        text,
      });
    } else {
      const id = this.surface?.addElement('text', {
        containerId: this.id,
        text,
        xywh: transformShapeXYWH(this.xywh),
      });
      this.yMap.set('textId', id);
    }
  }
}
