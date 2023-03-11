import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('link-mock-selection')
export class LinkMockSelection extends LitElement {
  rects: DOMRect[];

  constructor(rects: DOMRect[]) {
    super();
    this.rects = rects;
  }

  render() {
    return html`
      ${this.rects.map(
        rect => html`<div
          style="${styleMap({
            position: 'absolute',
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            backgroundColor: 'rgba(35, 131, 226, 0.28)',
          })}"
        ></div>`
      )}
    `;
  }
}
