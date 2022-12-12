import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import type { ShapeBlockModel } from './shape-model';
import { styleMap } from 'lit/directives/style-map.js';
import type { XYWH } from '../page-block/edgeless/selection-manager';
import { getRectanglePath } from './utils';
import { BLOCK_ID_ATTR } from '../__internal__';

@customElement('shape-block')
export class ShapeBlockComponent extends LitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ShapeBlockModel;

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    if (this.model.type === 'rectangle') {
      const [, , modelW, modelH] = JSON.parse(this.model.xywh) as XYWH;
      return html`
        <svg
          style=${styleMap({
            width: modelW + 'px',
            height: modelH + 'px',
          })}
        >
          <path
            style=${styleMap({
              // enable pointer events, otherwise edgeless block cannot detect by mouse event
              pointerEvents: 'all',
            })}
            d=${getRectanglePath([modelW, modelH])}
            stroke-width="2"
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
