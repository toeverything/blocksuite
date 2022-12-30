import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement, unsafeCSS } from 'lit';
import type { ShapeBlockModel } from './shape-model.js';
import type { XYWH } from '../page-block/edgeless/selection-manager.js';
import {
  BLOCK_ID_ATTR,
  DashStyle,
  ShapeStyles,
  SizeStyle,
  TDShapeType,
} from '../__internal__/index.js';
import {
  getRectangleIndicatorPathTDSnapshot,
  getRectanglePath,
} from './utils/rectangle-helpers.js';
import { getShapeStyle } from './utils/shape-style.js';
import {
  getTriangleIndicatorPathTDSnapshot,
  getTrianglePath,
} from './utils/triangle-helpers.js';
import style from './style.css?inline';
import {
  getEllipseIndicatorPath,
  getEllipsePath,
} from './utils/ellpse-helpers.js';

export const SHAPE_PADDING = 48;

export const ShapeBlockTag = 'affine-shape';

@customElement(ShapeBlockTag)
export class ShapeBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}

    /* to make it at the center of the container */
    .affine-shape-block-g {
      transform: translate(${SHAPE_PADDING / 2}px, ${SHAPE_PADDING / 2}px);
    }
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ShapeBlockModel;

  render() {
    const id = this.model.id;
    this.setAttribute(BLOCK_ID_ATTR, id);
    const [, , modelW, modelH] = JSON.parse(this.model.xywh) as XYWH;
    const shapeStyles: ShapeStyles = {
      color: this.model.color,
      dash: DashStyle.Draw,
      size: SizeStyle.Small,
    };

    const size = [modelW, modelH];
    const { stroke, strokeWidth } = getShapeStyle(shapeStyles, false);
    switch (this.model.type) {
      case TDShapeType.Rectangle: {
        return html`
          <svg class="affine-shape-block">
            <g class="affine-shape-block-g">
              <path
                class="affine-shape-block-hit-box"
                d=${getRectangleIndicatorPathTDSnapshot(id, shapeStyles, size)}
              />
              <path
                d=${getRectanglePath(id, shapeStyles, size)}
                fill=${stroke}
                stroke=${stroke}
                stroke-width=${strokeWidth}
              />
            </g>
          </svg>
        `;
      }
      case TDShapeType.Triangle: {
        return html`
          <svg class="affine-shape-block">
            <g class="affine-shape-block-g">
              <path
                class="affine-shape-block-hit-box"
                d=${getTriangleIndicatorPathTDSnapshot(id, size, shapeStyles)}
              />
              <path
                d=${getTrianglePath(id, size, shapeStyles)}
                fill=${stroke}
                stroke=${stroke}
                stroke-width=${strokeWidth}
              />
            </g>
          </svg>
        `;
      }
      case TDShapeType.Ellipse: {
        const radius = [size[0] / 2, size[1] / 2];
        return html`
          <svg class="affine-shape-block">
            <g class="affine-shape-block-g">
              <path
                class="affine-shape-block-hit-box"
                d=${getEllipseIndicatorPath(id, radius, shapeStyles)}
              />
              <path
                d=${getEllipsePath(id, radius, shapeStyles)}
                fill=${stroke}
                stroke=${stroke}
                stroke-width=${strokeWidth}
              />
            </g>
          </svg>
        `;
      }
      default: {
        console.error('not supported shape type: ', this.model.type);
        return html``;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [ShapeBlockTag]: ShapeBlockComponent;
  }
}
