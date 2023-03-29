import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('v-line')
export class VirgoLine extends LitElement {
  @property({ attribute: false })
  elements: TemplateResult<1>[] = [];

  get vElements() {
    return Array.from(this.querySelectorAll('v-element'));
  }

  get textLength() {
    return this.vElements.reduce((acc, el) => acc + el.delta.insert.length, 0);
  }

  get textContent() {
    return this.vElements.reduce((acc, el) => acc + el.delta.insert, '');
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await Promise.all(this.vElements.map(el => el.updateComplete));
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
