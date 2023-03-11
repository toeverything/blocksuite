import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { BaseTextAttributes } from '../utils/index.js';
import type { VirgoElement } from './virgo-element.js';

@customElement('v-line')
export class VirgoLine<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> extends LitElement {
  @property({ attribute: false })
  elements: VirgoElement<TextAttributes>[] = [];

  get textLength() {
    return this.elements.reduce((acc, el) => acc + el.delta.insert.length, 0);
  }

  get textContent() {
    return this.elements.reduce((acc, el) => acc + el.delta.insert, '');
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await Promise.all(this.elements.map(el => el.updateComplete));
    return result;
  }

  protected firstUpdated(): void {
    this.style.display = 'block';
  }

  render() {
    return html`<div>${this.elements}</div>`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-line': VirgoLine;
  }
}
