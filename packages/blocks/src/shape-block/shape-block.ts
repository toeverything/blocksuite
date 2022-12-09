import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import type { ShapeBlockModel } from './shape-model';
import { styleMap } from 'lit/directives/style-map.js';
import type { XYWH } from '../page-block/edgeless/selection-manager';
import { getRectanglePath } from './utils';

@customElement('shape-block')
export class ShapeBlockComponent extends LitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ShapeBlockModel;

  public detectCollision(x: number, y: number): boolean {
    const root = this.shadowRoot!;
    const point = root.querySelector('svg')!.createSVGPoint();
    point.x = x;
    point.y = y;
    return root.querySelector('path')!.isPointInStroke(point);
  }

  render() {
    if (this.model.type === 'rectangle') {
      const [, , modelW, modelH] = JSON.parse(this.model.xywh) as XYWH;
      return html`
        <svg
          style=${styleMap({
            width: modelW + 'px',
            height: modelH + 'px',
            pointerEvents: 'none',
          })}
        >
          <path
            style=${styleMap({
              pointerEvents: 'all',
              cursor: 'pointer',
            })}
            d=${getRectanglePath({}, [modelW, modelH])}
            stroke="2"
          />
        </svg>
      `;
    }
    console.error('not supported');
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pencil-block': ShapeBlockComponent;
  }
}
