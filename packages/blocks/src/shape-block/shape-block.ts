import { customElement, property } from 'lit/decorators';
import { html, LitElement } from 'lit';
import type { ShapeBlockModel } from './shape-model';

@customElement('shape-block')
export class ShapeBlockComponent extends LitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ShapeBlockModel;

  render() {
    if (this.model.type === 'rectangle') {
      return html` <div>test</div> `;
    }
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pencil-block': ShapeBlockComponent;
  }
}
